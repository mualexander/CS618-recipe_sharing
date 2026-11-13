import { before, after, beforeEach } from 'node:test'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import { createApp } from '../src/app.js'

// Spins up an in-memory MongoDB for the test file and clears it between tests.
export function useTestApp() {
  const ctx = {}
  let mongod

  before(async () => {
    mongod = await MongoMemoryServer.create()
    await mongoose.connect(mongod.getUri())
    await mongoose.connection.syncIndexes()
    ctx.app = createApp()
    ctx.api = () => request(ctx.app)
  })

  beforeEach(async () => {
    const collections = await mongoose.connection.db.collections()
    await Promise.all(collections.map((c) => c.deleteMany({})))
  })

  after(async () => {
    await mongoose.disconnect()
    await mongod?.stop()
  })

  // Creates a user and returns { user, token, auth } where auth is a header object.
  ctx.signup = async (username, password = 'password123') => {
    const res = await ctx.api().post('/api/v1/auth/signup').send({ username, password })
    if (res.status !== 201) throw new Error(`signup failed: ${JSON.stringify(res.body)}`)
    return { ...res.body, auth: { Authorization: `Bearer ${res.body.token}` } }
  }

  ctx.createRecipe = async (owner, overrides = {}) => {
    const res = await ctx
      .api()
      .post('/api/v1/recipes')
      .set(owner.auth)
      .send({
        title: 'Pancakes',
        ingredients: [{ name: 'flour', quantity: '1 cup' }, { name: 'milk' }],
        ...overrides,
      })
    if (res.status !== 201) throw new Error(`create failed: ${JSON.stringify(res.body)}`)
    return res.body
  }

  return ctx
}
