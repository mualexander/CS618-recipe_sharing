import { Router } from 'express'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import {
  listRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from '../services/recipes.js'
import {
  likeRecipe,
  unlikeRecipe,
  rateRecipe,
  removeRating,
  listComments,
  addComment,
} from '../services/social.js'

export const recipesRouter = Router()

recipesRouter.get('/', async (req, res) => {
  res.json(await listRecipes(req.query))
})

recipesRouter.post('/', requireAuth, async (req, res) => {
  res.status(201).json(await createRecipe(req.auth.sub, req.body))
})

recipesRouter.get('/:id', optionalAuth, async (req, res) => {
  res.json(await getRecipe(req.params.id, req.auth?.sub))
})

recipesRouter.patch('/:id', requireAuth, async (req, res) => {
  res.json(await updateRecipe(req.auth.sub, req.params.id, req.body))
})

recipesRouter.delete('/:id', requireAuth, async (req, res) => {
  await deleteRecipe(req.auth.sub, req.params.id)
  res.sendStatus(204)
})

// --- likes, ratings, comments ---

recipesRouter.put('/:id/like', requireAuth, async (req, res) => {
  res.json(await likeRecipe(req.auth, req.params.id))
})

recipesRouter.delete('/:id/like', requireAuth, async (req, res) => {
  res.json(await unlikeRecipe(req.auth, req.params.id))
})

recipesRouter.put('/:id/rating', requireAuth, async (req, res) => {
  res.json(await rateRecipe(req.auth, req.params.id, req.body?.value))
})

recipesRouter.delete('/:id/rating', requireAuth, async (req, res) => {
  res.json(await removeRating(req.auth, req.params.id))
})

recipesRouter.get('/:id/comments', async (req, res) => {
  res.json(await listComments(req.params.id, req.query))
})

recipesRouter.post('/:id/comments', requireAuth, async (req, res) => {
  res.status(201).json(await addComment(req.auth, req.params.id, req.body?.body))
})
