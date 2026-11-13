import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { useTestApp } from './helpers.js'

const t = useTestApp()

describe('auth', () => {
  test('signup returns a token and never exposes the password', async () => {
    const res = await t.api().post('/api/v1/auth/signup').send({
      username: 'Alice',
      password: 'password123',
      displayName: 'Alice A.',
    })
    assert.equal(res.status, 201)
    assert.ok(res.body.token)
    assert.equal(res.body.user.username, 'alice')
    assert.equal(res.body.user.password, undefined)
  })

  test('rejects short passwords and invalid usernames with field errors', async () => {
    const short = await t.api().post('/api/v1/auth/signup').send({ username: 'bob', password: 'x' })
    assert.equal(short.status, 400)
    assert.ok(short.body.fields.password)

    const bad = await t
      .api()
      .post('/api/v1/auth/signup')
      .send({ username: 'no spaces!', password: 'password123' })
    assert.equal(bad.status, 400)
    assert.ok(bad.body.fields.username)
  })

  test('duplicate usernames return 409', async () => {
    await t.signup('carol')
    const res = await t
      .api()
      .post('/api/v1/auth/signup')
      .send({ username: 'CAROL', password: 'password123' })
    assert.equal(res.status, 409)
  })

  test('login succeeds with the right password and fails otherwise', async () => {
    await t.signup('dave', 'correct-horse')
    const ok = await t
      .api()
      .post('/api/v1/auth/login')
      .send({ username: 'dave', password: 'correct-horse' })
    assert.equal(ok.status, 200)
    assert.ok(ok.body.token)

    const bad = await t.api().post('/api/v1/auth/login').send({ username: 'dave', password: 'nope' })
    assert.equal(bad.status, 401)
    const unknown = await t
      .api()
      .post('/api/v1/auth/login')
      .send({ username: 'nobody', password: 'nope' })
    assert.equal(unknown.status, 401)
    assert.equal(bad.body.error, unknown.body.error)
  })

  test('/auth/me requires a valid token', async () => {
    const u = await t.signup('erin')
    assert.equal((await t.api().get('/api/v1/auth/me')).status, 401)
    assert.equal(
      (await t.api().get('/api/v1/auth/me').set('Authorization', 'Bearer garbage')).status,
      401,
    )
    const me = await t.api().get('/api/v1/auth/me').set(u.auth)
    assert.equal(me.body.username, 'erin')
  })
})
