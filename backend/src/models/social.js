import mongoose, { Schema } from 'mongoose'

const ref = (model) => ({ type: Schema.Types.ObjectId, ref: model, required: true })

// One document per (user, recipe) like. Keeping likes as their own
// collection (rather than an array on the recipe) supports time-series
// analytics and avoids unbounded document growth.
const likeSchema = new Schema(
  { user: ref('user'), recipe: ref('recipe') },
  { timestamps: { createdAt: true, updatedAt: false } },
)
likeSchema.index({ user: 1, recipe: 1 }, { unique: true })
likeSchema.index({ recipe: 1, createdAt: -1 })
likeSchema.index({ createdAt: -1 })
export const Like = mongoose.model('like', likeSchema)

const ratingSchema = new Schema(
  {
    user: ref('user'),
    recipe: ref('recipe'),
    value: {
      type: Number,
      required: true,
      min: [1, 'rating must be between 1 and 5'],
      max: [5, 'rating must be between 1 and 5'],
      validate: { validator: Number.isInteger, message: 'rating must be a whole number' },
    },
  },
  { timestamps: true },
)
ratingSchema.index({ user: 1, recipe: 1 }, { unique: true })
ratingSchema.index({ recipe: 1 })
export const Rating = mongoose.model('rating', ratingSchema)

const commentSchema = new Schema(
  {
    recipe: ref('recipe'),
    author: ref('user'),
    body: {
      type: String,
      required: [true, 'comment cannot be empty'],
      trim: true,
      maxlength: [2000, 'comment must be at most 2000 characters'],
    },
  },
  { timestamps: true },
)
commentSchema.index({ recipe: 1, createdAt: -1 })
export const Comment = mongoose.model('comment', commentSchema)

// Raw view events power "views over time" charts; the running total
// lives in recipe.stats.views.
const viewSchema = new Schema(
  {
    recipe: ref('recipe'),
    viewer: { type: Schema.Types.ObjectId, ref: 'user' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)
viewSchema.index({ recipe: 1, createdAt: -1 })
export const View = mongoose.model('view', viewSchema)
