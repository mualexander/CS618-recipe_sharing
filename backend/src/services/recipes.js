import mongoose from 'mongoose'
import { Recipe, EDITABLE_RECIPE_FIELDS } from '../models/recipe.js'
import { PUBLIC_USER_FIELDS } from '../models/user.js'
import { HttpError, notFound, forbidden } from '../middleware/errors.js'
import { broadcast } from '../realtime.js'

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  title: { title: 1 },
}

function pickEditable(data = {}) {
  const out = {}
  for (const key of EDITABLE_RECIPE_FIELDS) {
    if (data[key] !== undefined) out[key] = data[key]
  }
  if (Array.isArray(out.tags)) {
    out.tags = [...new Set(out.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))]
  }
  if (Array.isArray(out.ingredients)) {
    out.ingredients = out.ingredients
      .map((i) => (typeof i === 'string' ? { name: i } : i))
      .filter((i) => i && (i.name?.trim() || i.quantity?.trim()))
  }
  if (out.imageUrl === '') out.imageUrl = undefined
  return out
}

export async function listRecipes({
  author,
  tag,
  q,
  sort = 'newest',
  page = 1,
  limit = 12,
} = {}) {
  const filter = {}
  if (author) filter.author = author
  if (tag) filter.tags = String(tag).toLowerCase()
  if (q) {
    const rx = { $regex: escapeRegex(String(q)), $options: 'i' }
    filter.$or = [{ title: rx }, { tags: rx }, { 'ingredients.name': rx }]
  }

  const pageNum = Math.max(1, Number(page) || 1)
  const pageSize = Math.min(50, Math.max(1, Number(limit) || 12))

  const [items, total] = await Promise.all([
    Recipe.find(filter)
      .sort(SORTS[sort] ?? SORTS.newest)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .populate('author', PUBLIC_USER_FIELDS),
    Recipe.countDocuments(filter),
  ])

  return { items, total, page: pageNum, limit: pageSize, pages: Math.ceil(total / pageSize) }
}

export async function getRecipe(id) {
  const recipe = await Recipe.findById(id).populate('author', PUBLIC_USER_FIELDS)
  if (!recipe) throw notFound('recipe')
  return recipe
}

export async function createRecipe(userId, data) {
  const recipe = await Recipe.create({ ...pickEditable(data), author: userId })
  await recipe.populate('author', PUBLIC_USER_FIELDS)
  broadcast('recipe:created', { recipeId: recipe._id, authorId: userId })
  return recipe
}

// Loads a recipe and confirms the caller owns it: 404 if missing, 403 if not theirs.
async function loadOwned(userId, id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'invalid id')
  const recipe = await Recipe.findById(id)
  if (!recipe) throw notFound('recipe')
  if (!recipe.author.equals(userId)) throw forbidden()
  return recipe
}

export async function updateRecipe(userId, id, data) {
  const recipe = await loadOwned(userId, id)
  recipe.set(pickEditable(data))
  await recipe.save()
  await recipe.populate('author', PUBLIC_USER_FIELDS)
  broadcast('recipe:updated', { recipeId: recipe._id })
  return recipe
}

export async function deleteRecipe(userId, id) {
  const recipe = await loadOwned(userId, id)
  await recipe.deleteOne()
  broadcast('recipe:deleted', { recipeId: id })
}
