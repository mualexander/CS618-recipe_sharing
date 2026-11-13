import { api } from './client.js'

export const listRecipes = (query) => api('/recipes', { query })
export const getRecipe = (id) => api(`/recipes/${id}`)
export const createRecipe = (data) => api('/recipes', { method: 'POST', body: data })
export const updateRecipe = (id, data) => api(`/recipes/${id}`, { method: 'PATCH', body: data })
export const deleteRecipe = (id) => api(`/recipes/${id}`, { method: 'DELETE' })
