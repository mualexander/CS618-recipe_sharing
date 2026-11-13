import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { useTestApp } from './helpers.js'

const t = useTestApp()

describe('messages', () => {
  test('conversation list, unread counts, and read receipts', async () => {
    const alice = await t.signup('alice')
    const bob = await t.signup('bob')

    await t.api().post(`/api/v1/messages/${bob.user._id}`).set(alice.auth).send({ body: 'hi' })
    await t.api().post(`/api/v1/messages/${bob.user._id}`).set(alice.auth).send({ body: 'there' })

    const convos = await t.api().get('/api/v1/messages').set(bob.auth)
    assert.equal(convos.body.length, 1)
    assert.equal(convos.body[0].user.username, 'alice')
    assert.equal(convos.body[0].unread, 2)
    assert.equal(convos.body[0].lastMessage.body, 'there')

    const thread = await t.api().get(`/api/v1/messages/${alice.user._id}`).set(bob.auth)
    assert.deepEqual(
      thread.body.messages.map((m) => m.body),
      ['hi', 'there'],
    )

    await t.api().post(`/api/v1/messages/${alice.user._id}/read`).set(bob.auth)
    const unread = await t.api().get('/api/v1/messages/unread').set(bob.auth)
    assert.equal(unread.body.count, 0)
  })

  test('cannot message yourself or read without auth', async () => {
    const alice = await t.signup('alice')
    const self = await t
      .api()
      .post(`/api/v1/messages/${alice.user._id}`)
      .set(alice.auth)
      .send({ body: 'me' })
    assert.equal(self.status, 400)
    assert.equal((await t.api().get('/api/v1/messages')).status, 401)
  })
})

describe('message privacy and validation', () => {
  test('threads only include the two participants', async () => {
    const alice = await t.signup('alice')
    const bob = await t.signup('bob')
    const carol = await t.signup('carol')
    await t.api().post(`/api/v1/messages/${bob.user._id}`).set(alice.auth).send({ body: 'secret' })

    const asCarol = await t.api().get(`/api/v1/messages/${alice.user._id}`).set(carol.auth)
    assert.equal(asCarol.body.messages.length, 0)
    assert.equal((await t.api().get('/api/v1/messages').set(carol.auth)).body.length, 0)
  })

  test('rejects empty bodies and unknown recipients', async () => {
    const alice = await t.signup('alice')
    const bob = await t.signup('bob')
    const empty = await t
      .api()
      .post(`/api/v1/messages/${bob.user._id}`)
      .set(alice.auth)
      .send({ body: '   ' })
    assert.equal(empty.status, 400)
    assert.ok(empty.body.fields.body)
    const missing = await t
      .api()
      .post('/api/v1/messages/000000000000000000000000')
      .set(alice.auth)
      .send({ body: 'hello?' })
    assert.equal(missing.status, 404)
  })
})

describe('notifications', () => {
  async function setup() {
    const alice = await t.signup('alice')
    const bob = await t.signup('bob')
    const recipe = await t.createRecipe(alice)
    return { alice, bob, recipe, url: `/api/v1/recipes/${recipe._id}` }
  }
  const list = (user) => t.api().get('/api/v1/notifications').set(user.auth)
  const unread = async (user) =>
    (await t.api().get('/api/v1/notifications/unread').set(user.auth)).body.count

  test('likes, ratings, and comments notify the recipe author', async () => {
    const { alice, bob, recipe, url } = await setup()
    await t.api().put(`${url}/like`).set(bob.auth)
    await t.api().put(`${url}/rating`).set(bob.auth).send({ value: 4 })
    await t.api().post(`${url}/comments`).set(bob.auth).send({ body: 'Delicious' })

    const res = await list(alice)
    assert.deepEqual(
      res.body.map((n) => n.type),
      ['comment', 'rating', 'like'],
    )
    const [comment, rating] = res.body
    assert.equal(comment.actor.username, 'bob')
    assert.equal(comment.recipe.title, recipe.title)
    assert.equal(comment.excerpt, 'Delicious')
    assert.equal(rating.value, 4)
    assert.equal(await unread(alice), 3)
    assert.equal((await list(bob)).body.length, 0)
  })

  test('acting on your own recipe does not notify you', async () => {
    const { alice, url } = await setup()
    await t.api().put(`${url}/like`).set(alice.auth)
    await t.api().post(`${url}/comments`).set(alice.auth).send({ body: 'note to self' })
    assert.equal(await unread(alice), 0)
  })

  test('repeat ratings replace the notification; undoing removes it', async () => {
    const { alice, bob, url } = await setup()
    await t.api().put(`${url}/rating`).set(bob.auth).send({ value: 2 })
    await t.api().put(`${url}/rating`).set(bob.auth).send({ value: 5 })
    let res = await list(alice)
    assert.equal(res.body.length, 1)
    assert.equal(res.body[0].value, 5)

    await t.api().delete(`${url}/rating`).set(bob.auth)
    await t.api().put(`${url}/like`).set(bob.auth)
    await t.api().delete(`${url}/like`).set(bob.auth)
    const c = await t.api().post(`${url}/comments`).set(bob.auth).send({ body: 'oops' })
    await t.api().delete(`/api/v1/comments/${c.body._id}`).set(bob.auth)
    res = await list(alice)
    assert.equal(res.body.length, 0)
  })

  test('mark specific or all notifications read', async () => {
    const { alice, bob, url } = await setup()
    await t.api().put(`${url}/like`).set(bob.auth)
    await t.api().post(`${url}/comments`).set(bob.auth).send({ body: 'one' })
    const [first] = (await list(alice)).body

    await t
      .api()
      .post('/api/v1/notifications/read')
      .set(alice.auth)
      .send({ ids: [first._id] })
    assert.equal(await unread(alice), 1)
    // Bob cannot mark Alice's notifications.
    await t.api().post('/api/v1/notifications/read').set(bob.auth).send({})
    assert.equal(await unread(alice), 1)
    await t.api().post('/api/v1/notifications/read').set(alice.auth).send({})
    assert.equal(await unread(alice), 0)
  })

  test('deleting a recipe removes its notifications; endpoints require auth', async () => {
    const { alice, bob, url } = await setup()
    await t.api().put(`${url}/like`).set(bob.auth)
    await t.api().delete(url).set(alice.auth)
    assert.equal((await list(alice)).body.length, 0)
    assert.equal((await t.api().get('/api/v1/notifications')).status, 401)
  })
})
