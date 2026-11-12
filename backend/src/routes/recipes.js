import { Router } from 'express'
import {
  listRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from '../services/recipes.js'

export function recipesRouter(io) {
  const router = Router()

  router.get('/', async (req, res) => {
    const { tag, sortBy, sortOrder } = req.query
    res.json(await listRecipes({ tag, sortBy, sortOrder }))
  })

  router.get('/:id', async (req, res) => {
    const recipe = await getRecipeById(req.params.id)
    if (!recipe) return res.sendStatus(404)
    res.json(recipe)
  })

  router.post('/', async (req, res) => {
    const recipe = await createRecipe(req.body)
    io.emit('recipe:created', recipe)
    res.status(201).json(recipe)
  })

  router.patch('/:id', async (req, res) => {
    const recipe = await updateRecipe(req.params.id, req.body)
    if (!recipe) return res.sendStatus(404)
    io.emit('recipe:updated', recipe)
    res.json(recipe)
  })

  router.delete('/:id', async (req, res) => {
    const { deletedCount } = await deleteRecipe(req.params.id)
    if (deletedCount === 0) return res.sendStatus(404)
    io.emit('recipe:deleted', { _id: req.params.id })
    res.sendStatus(204)
  })

  return router
}
