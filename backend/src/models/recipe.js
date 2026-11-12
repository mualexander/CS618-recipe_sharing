import mongoose, { Schema } from 'mongoose'

const recipeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, trim: true },
    ingredients: [{ type: String, trim: true }],
    instructions: { type: String },
    imageUrl: { type: String },
    tags: [{ type: String, trim: true, lowercase: true }],
  },
  { timestamps: true },
)

export const Recipe = mongoose.model('recipe', recipeSchema)
