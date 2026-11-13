import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { useTestApp } from './helpers.js'

const t = useTestApp()

describe('recipes', () => {
  test('creating requires authentication', async () => {
    const res = await t.api().post('/api/v1/recipes').send({ title: 'x', ingredients: ['a'] })
    assert.equal(res.status, 401)
  })

  test('validates title, ingredients, and image URL', async () => {
    const u = await t.signup('alice')
    const res = await t
      .api()
      .post('/api/v1/recipes')
      .set(u.auth)
      .send({ title: '', ingredients: [], imageUrl: 'javascript:alert(1)' })
    assert.equal(res.status, 400)
    assert.ok(res.body.fields.title)
    assert.ok(res.body.fields.ingredients)
    assert.ok(res.body.fields.imageUrl)
  })

  test('author is taken from the token and server fields are ignored', async () => {
    const alice = await t.signup('alice')
    const bob = await t.signup('bob')
    const recipe = await t.createRecipe(alice, {
      author: bob.user._id,
      createdAt: '2000-01-01T00:00:00.000Z',
      stats: { likes: 999 },
      tags: ['Breakfast', 'breakfast', ' Quick '],
    })
    assert.equal(recipe.author.username, 'alice')
    assert.notEqual(recipe.createdAt, '2000-01-01T00:00:00.000Z')
    assert.equal(recipe.stats.likes, 0)
    assert.deepEqual(recipe.tags, ['breakfast', 'quick'])
  })

  test('only the author can update or delete', async () => {
    const alice = await t.signup('alice')
    const bob = await t.signup('bob')
    const recipe = await t.createRecipe(alice)

    const bobEdit = await t
      .api()
      .patch(`/api/v1/recipes/${recipe._id}`)
      .set(bob.auth)
      .send({ title: 'Hijacked' })
    assert.equal(bobEdit.status, 403)

    const bobDelete = await t.api().delete(`/api/v1/recipes/${recipe._id}`).set(bob.auth)
    assert.equal(bobDelete.status, 403)

    const aliceEdit = await t
      .api()
      .patch(`/api/v1/recipes/${recipe._id}`)
      .set(alice.auth)
      .send({ title: 'Better Pancakes' })
    assert.equal(aliceEdit.status, 200)
    assert.equal(aliceEdit.body.title, 'Better Pancakes')

    const aliceDelete = await t.api().delete(`/api/v1/recipes/${recipe._id}`).set(alice.auth)
    assert.equal(aliceDelete.status, 204)
    assert.equal((await t.api().get(`/api/v1/recipes/${recipe._id}`)).status, 404)
  })

  test('list supports author filter, search, sort, and pagination', async () => {
    const alice = await t.signup('alice')
    const bob = await t.signup('bob')
    await t.createRecipe(alice, { title: 'Banana Bread', tags: ['baking'] })
    await t.createRecipe(alice, { title: 'Tomato Soup' })
    await t.createRecipe(bob, { title: 'Garlic Bread' })

    const mine = await t.api().get(`/api/v1/recipes?author=${alice.user._id}`)
    assert.equal(mine.body.total, 2)

    const search = await t.api().get('/api/v1/recipes?q=bread')
    assert.equal(search.body.total, 2)

    const tag = await t.api().get('/api/v1/recipes?tag=baking')
    assert.equal(tag.body.items[0].title, 'Banana Bread')

    const paged = await t.api().get('/api/v1/recipes?limit=2&page=2')
    assert.equal(paged.body.items.length, 1)
    assert.equal(paged.body.pages, 2)
  })

  test('invalid ids return 400, missing ids return 404', async () => {
    assert.equal((await t.api().get('/api/v1/recipes/not-an-id')).status, 400)
    assert.equal((await t.api().get('/api/v1/recipes/000000000000000000000000')).status, 404)
  })
})
