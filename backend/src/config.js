const isTest = process.env.NODE_ENV === 'test'

export const config = {
  port: Number(process.env.PORT) || 3001,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || (isTest ? 'test-secret' : undefined),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) ?? '*',
}

export function assertConfig() {
  const missing = []
  if (!config.databaseUrl) missing.push('DATABASE_URL')
  if (!config.jwtSecret) missing.push('JWT_SECRET')
  if (missing.length) {
    throw new Error(`missing required environment variables: ${missing.join(', ')}`)
  }
}
