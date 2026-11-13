import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { useTestApp } from './helpers.js'
import { Like, Rating, Comment } from '../src/models/social.js'

const t = useTestApp()

describe('likes, ratings, comments', () => {
  test('social actions require sign-in', async () => {
    const alice = await t.signup('alice')
    const recipe = await t.createRecipe(alice)
    const url = `/api/v1/recipes/${recipe._id}`
    assert.equal((await t.api().put(`${url}/like`)).status, 401)
    assert.equal((await t.api().put(`${url}/rating`).send({ value: 3 })).status, 401)
    assert.equal((await t.api().post(`${url}/comments`).send({ body: 'hi' })).status, 401)
    // Reading stays public.
    assert.equal((await t.api().get(`${url}/comments`)).status, 200)
  })

  test('feed can sort by likes', async () => {
    const alice = await t.signup('alice')
    const bob = await t.signup('bob')
    await t.createRecipe(alice, { title: 'Quiet' })
    const loved = await t.createRecipe(alice, { title: 'Loved' })
    await t.createRecipe(alice, { title: 'Newest' })
    await t.api().put(`/api/v1/recipes/${loved._id}/like`).set(bob.auth)
    const res = await t.api().get('/api/v1/recipes?sort=popular')
    assert.equal(res.body.items[0].title, 'Loved')
  })

  test('likes are idempotent and reflected in stats and viewer state', async () => {
    const alice = await t.signup('alice')
    const bob = await t.signup('bob')
    const recipe = await t.createRecipe(alice)
    const url = `/api/v1/recipes/${recipe._id}`

    await t.api().put(`${url}/like`).set(bob.auth)
    const again = await t.api().put(`${url}/like`).set(bob.auth)
    assert.equal(again.body.stats.likes, 1)

    const asBob = await t.api().get(url).set(bob.auth)
    assert.equal(asBob.body.viewer.liked, true)
    // A like is not an edit to the recipe.
    assert.equal(asBob.body.updatedAt, recipe.updatedAt)

    const unliked = await t.api().delete(`${url}/like`).set(bob.auth)
    assert.equal(unliked.body.stats.likes, 0)
  })

  test('ratings update the average and cannot be self-assigned', async () => {
    const alice = await t.signup('alice')
    const bob = await t.signup('bob')
    const carol = await t.signup('carol')
    const recipe = await t.createRecipe(alice)
    const url = `/api/v1/recipes/${recipe._id}/rating`

    assert.equal((await t.api().put(url).set(alice.auth).send({ value: 5 })).status, 400)
    assert.equal((await t.api().put(url).set(bob.auth).send({ value: 7 })).status, 400)

    await t.api().put(url).set(bob.auth).send({ value: 5 })
    const res = await t.api().put(url).set(carol.auth).send({ value: 2 })
    assert.equal(res.body.stats.ratingCount, 2)
    assert.equal(res.body.stats.ratingAvg, 3.5)

    // Changing a rating replaces it rather than adding a new one.
    const changed = await t.api().put(url).set(carol.auth).send({ value: 4 })
    assert.equal(changed.body.stats.ratingCount, 2)
    assert.equal(changed.body.stats.ratingAvg, 4.5)
  })

  test('only the comment author can delete a comment', async () => {
    const alice = await t.signup('alice')
    const bob = await t.signup('bob')
    const recipe = await t.createRecipe(alice)

    const created = await t
      .api()
      .post(`/api/v1/recipes/${recipe._id}/comments`)
      .set(bob.auth)
      .send({ body: 'Looks great!' })
    assert.equal(created.status, 201)
    assert.equal(created.body.author.username, 'bob')

    // Even the recipe author cannot delete someone else's comment.
    const byAlice = await t.api().delete(`/api/v1/comments/${created.body._id}`).set(alice.auth)
    assert.equal(byAlice.status, 403)

    const byBob = await t.api().delete(`/api/v1/comments/${created.body._id}`).set(bob.auth)
    assert.equal(byBob.status, 204)

    const recipeAfter = await t.api().get(`/api/v1/recipes/${recipe._id}`)
    assert.equal(recipeAfter.body.stats.comments, 0)
  })

  test('deleting a recipe removes its likes, ratings, and comments', async () => {
    const alice = await t.signup('alice')
    const bob = await t.signup('bob')
    const recipe = await t.createRecipe(alice)
    const url = `/api/v1/recipes/${recipe._id}`
    await t.api().put(`${url}/like`).set(bob.auth)
    await t.api().put(`${url}/rating`).set(bob.auth).send({ value: 4 })
    await t.api().post(`${url}/comments`).set(bob.auth).send({ body: 'yum' })

    await t.api().delete(url).set(alice.auth)
    assert.equal(await Like.countDocuments(), 0)
    assert.equal(await Rating.countDocuments(), 0)
    assert.equal(await Comment.countDocuments(), 0)
  })
})
