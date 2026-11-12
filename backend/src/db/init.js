import mongoose from 'mongoose'

export async function initDatabase(uri) {
  if (!uri) {
    throw new Error('DATABASE_URL is not set')
  }

  mongoose.connection.on('connected', () => {
    console.info('connected to database')
  })
  mongoose.connection.on('error', (err) => {
    console.error('database connection error:', err.message)
  })

  await mongoose.connect(uri)
  return mongoose.connection
}
