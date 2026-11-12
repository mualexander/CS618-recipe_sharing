import { Recipe } from '../models/recipe.js'

export async function listRecipes({ tag, sortBy = 'createdAt', sortOrder = 'descending' } = {}) {
  const query = tag ? { tags: tag } : {}
  return Recipe.find(query).sort({ [sortBy]: sortOrder })
}

export async function getRecipeById(id) {
  return Recipe.findById(id)
}

export async function createRecipe(data) {
  const { title, author, ingredients, instructions, imageUrl, tags } = data
  return new Recipe({ title, author, ingredients, instructions, imageUrl, tags }).save()
}

export async function updateRecipe(id, data) {
  const { title, author, ingredients, instructions, imageUrl, tags } = data
  return Recipe.findByIdAndUpdate(
    id,
    { $set: { title, author, ingredients, instructions, imageUrl, tags } },
    { returnDocument: 'after', runValidators: true },
  )
}

export async function deleteRecipe(id) {
  return Recipe.deleteOne({ _id: id })
}
