import { api } from './client.js'

export const likeRecipe = (id) => api(`/recipes/${id}/like`, { method: 'PUT' })
export const unlikeRecipe = (id) => api(`/recipes/${id}/like`, { method: 'DELETE' })
export const rateRecipe = (id, value) =>
  api(`/recipes/${id}/rating`, { method: 'PUT', body: { value } })
export const removeRating = (id) => api(`/recipes/${id}/rating`, { method: 'DELETE' })
export const listComments = (id) => api(`/recipes/${id}/comments`)
export const addComment = (id, body) =>
  api(`/recipes/${id}/comments`, { method: 'POST', body: { body } })
export const deleteComment = (commentId) => api(`/comments/${commentId}`, { method: 'DELETE' })
