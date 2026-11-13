import mongoose from 'mongoose'
import { Recipe } from '../models/recipe.js'
import { Like, Rating, Comment } from '../models/social.js'
import { PUBLIC_USER_FIELDS } from '../models/user.js'
import { HttpError, notFound, forbidden } from '../middleware/errors.js'
import { broadcast, emitTo, rooms } from '../realtime.js'
import { notify, retract } from './notifications.js'

async function requireRecipe(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'invalid id')
  const recipe = await Recipe.findById(id).select('author title')
  if (!recipe) throw notFound('recipe')
  return recipe
}

// Recomputes a recipe's counters from source collections and pushes the
// result to every connected client so feeds and detail pages stay live.
export async function refreshStats(recipeId) {
  const id = new mongoose.Types.ObjectId(String(recipeId))
  const [likes, comments, [rating]] = await Promise.all([
    Like.countDocuments({ recipe: id }),
    Comment.countDocuments({ recipe: id }),
    Rating.aggregate([
      { $match: { recipe: id } },
      { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$value' } } },
    ]),
  ])
  const recipe = await Recipe.findByIdAndUpdate(
    id,
    {
      $set: {
        'stats.likes': likes,
        'stats.comments': comments,
        'stats.ratingCount': rating?.count ?? 0,
        'stats.ratingAvg': rating ? Math.round(rating.avg * 100) / 100 : 0,
      },
    },
    // Counter changes are not edits, so leave updatedAt alone.
    { returnDocument: 'after', timestamps: false },
  ).select('stats')
  if (recipe) broadcast('recipe:stats', { recipeId: id, stats: recipe.stats })
  return recipe?.stats
}

// Notification side effects should never fail the action that caused them.
const quietly = (promise) => promise.catch((err) => console.error('notification failed:', err))

// --- likes -----------------------------------------------------------------

export async function likeRecipe(user, recipeId) {
  const recipe = await requireRecipe(recipeId)
  // Upsert keeps this idempotent: liking twice is not an error.
  const res = await Like.updateOne(
    { user: user.sub, recipe: recipeId },
    { $setOnInsert: { user: user.sub, recipe: recipeId } },
    { upsert: true },
  )
  const stats = await refreshStats(recipeId)
  if (res.upsertedCount) {
    await quietly(
      notify({ recipient: recipe.author, actor: user.sub, type: 'like', recipe: recipe._id }),
    )
  }
  return { liked: true, stats }
}

export async function unlikeRecipe(user, recipeId) {
  await requireRecipe(recipeId)
  await Like.deleteOne({ user: user.sub, recipe: recipeId })
  await quietly(retract({ actor: user.sub, recipe: recipeId, type: 'like' }))
  return { liked: false, stats: await refreshStats(recipeId) }
}

// --- ratings ---------------------------------------------------------------

export async function rateRecipe(user, recipeId, value) {
  const recipe = await requireRecipe(recipeId)
  if (recipe.author.equals(user.sub)) {
    throw new HttpError(400, 'you cannot rate your own recipe')
  }
  await Rating.findOneAndUpdate(
    { user: user.sub, recipe: recipeId },
    { $set: { value: Number(value) } },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true },
  )
  const stats = await refreshStats(recipeId)
  await quietly(
    notify({
      recipient: recipe.author,
      actor: user.sub,
      type: 'rating',
      recipe: recipe._id,
      value: Number(value),
    }),
  )
  return { rating: Number(value), stats }
}

export async function removeRating(user, recipeId) {
  await requireRecipe(recipeId)
  await Rating.deleteOne({ user: user.sub, recipe: recipeId })
  await quietly(retract({ actor: user.sub, recipe: recipeId, type: 'rating' }))
  return { rating: null, stats: await refreshStats(recipeId) }
}

// --- comments --------------------------------------------------------------

export async function listComments(recipeId, { before, limit = 50 } = {}) {
  await requireRecipe(recipeId)
  const filter = { recipe: recipeId }
  if (before) filter.createdAt = { $lt: new Date(before) }
  return Comment.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 50, 100))
    .populate('author', PUBLIC_USER_FIELDS)
}

export async function addComment(user, recipeId, body) {
  const recipe = await requireRecipe(recipeId)
  const comment = await Comment.create({ recipe: recipeId, author: user.sub, body })
  await comment.populate('author', PUBLIC_USER_FIELDS)
  emitTo(rooms.recipe(recipeId), 'comment:created', { recipeId, comment })
  await refreshStats(recipeId)
  await quietly(
    notify({
      recipient: recipe.author,
      actor: user.sub,
      type: 'comment',
      recipe: recipe._id,
      comment: comment._id,
      excerpt: comment.body.slice(0, 140),
    }),
  )
  return comment
}

export async function deleteComment(user, commentId) {
  if (!mongoose.isValidObjectId(commentId)) throw new HttpError(400, 'invalid id')
  const comment = await Comment.findById(commentId)
  if (!comment) throw notFound('comment')
  if (!comment.author.equals(user.sub)) throw forbidden()
  await comment.deleteOne()
  await quietly(retract({ comment: comment._id }))
  emitTo(rooms.recipe(comment.recipe), 'comment:deleted', {
    recipeId: comment.recipe,
    commentId,
  })
  await refreshStats(comment.recipe)
}
