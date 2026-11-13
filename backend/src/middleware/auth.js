import { expressjwt } from 'express-jwt'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'

const jwtOptions = () => ({
  secret: config.jwtSecret,
  algorithms: ['HS256'],
  requestProperty: 'auth',
})

// Rejects requests without a valid token. Sets req.auth = { sub, username }.
export const requireAuth = (req, res, next) =>
  expressjwt({ ...jwtOptions(), credentialsRequired: true })(req, res, next)

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), username: user.username }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn,
  })
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] })
}
