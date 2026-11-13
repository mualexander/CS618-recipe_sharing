import mongoose, { Schema } from 'mongoose'
import { httpUrl } from './validators.js'

const ingredientSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'ingredient name is required'],
      trim: true,
      maxlength: 120,
    },
    // Free-form so "2 cups", "a pinch", or "to taste" all work.
    quantity: { type: String, trim: true, maxlength: 60 },
  },
  { _id: false },
)

const recipeSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      maxlength: [120, 'title must be at most 120 characters'],
    },
    description: { type: String, trim: true, maxlength: 2000 },
    ingredients: {
      type: [ingredientSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0 && v.length <= 100,
        message: 'add between 1 and 100 ingredients',
      },
    },
    instructions: { type: String, trim: true, maxlength: 20000 },
    imageUrl: { type: String, trim: true, validate: httpUrl },
    tags: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
      validate: { validator: (v) => v.length <= 10, message: 'at most 10 tags' },
    },
    author: { type: Schema.Types.ObjectId, ref: 'user', required: true, index: true },
  },
  { timestamps: true },
)

recipeSchema.index({ createdAt: -1 })
recipeSchema.index({ tags: 1 })

// Fields a client may set directly. Everything else is server-controlled.
export const EDITABLE_RECIPE_FIELDS = [
  'title',
  'description',
  'ingredients',
  'instructions',
  'imageUrl',
  'tags',
]

export const Recipe = mongoose.model('recipe', recipeSchema)
