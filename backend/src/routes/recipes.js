import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  listRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from '../services/recipes.js'

export const recipesRouter = Router()

recipesRouter.get('/', async (req, res) => {
  res.json(await listRecipes(req.query))
})

recipesRouter.post('/', requireAuth, async (req, res) => {
  res.status(201).json(await createRecipe(req.auth.sub, req.body))
})

recipesRouter.get('/:id', async (req, res) => {
  res.json(await getRecipe(req.params.id))
})

recipesRouter.patch('/:id', requireAuth, async (req, res) => {
  res.json(await updateRecipe(req.auth.sub, req.params.id, req.body))
})

recipesRouter.delete('/:id', requireAuth, async (req, res) => {
  await deleteRecipe(req.auth.sub, req.params.id)
  res.sendStatus(204)
})
