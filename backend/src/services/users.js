import bcrypt from 'bcrypt'
import { User } from '../models/user.js'
import { HttpError, notFound } from '../middleware/errors.js'
import { signToken } from '../middleware/auth.js'

const SALT_ROUNDS = 10
const MIN_PASSWORD = 8

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export async function signup({ username, password, displayName } = {}) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
    throw new HttpError(400, 'validation failed', {
      password: `password must be at least ${MIN_PASSWORD} characters`,
    })
  }
  const hash = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await User.create({ username, password: hash, displayName })
  return { user: user.toJSON(), token: signToken(user) }
}

export async function login({ username, password } = {}) {
  const user =
    typeof username === 'string'
      ? await User.findOne({ username: username.trim().toLowerCase() }).select('+password')
      : null
  // Same message for unknown user and wrong password, so usernames can't be probed.
  const ok = user && typeof password === 'string' && (await bcrypt.compare(password, user.password))
  if (!ok) throw new HttpError(401, 'invalid username or password')
  return { user: user.toJSON(), token: signToken(user) }
}

export async function getUserById(id) {
  const user = await User.findById(id)
  if (!user) throw notFound('user')
  return user
}

export async function searchUsers({ q, limit = 20 } = {}) {
  const filter = q
    ? {
        $or: [
          { username: { $regex: escapeRegex(q), $options: 'i' } },
          { displayName: { $regex: escapeRegex(q), $options: 'i' } },
        ],
      }
    : {}
  return User.find(filter)
    .select('username displayName avatarUrl bio')
    .sort({ username: 1 })
    .limit(Math.min(Number(limit) || 20, 50))
}

export async function updateProfile(userId, { displayName, bio, avatarUrl } = {}) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { displayName, bio, avatarUrl } },
    { returnDocument: 'after', runValidators: true },
  )
  if (!user) throw notFound('user')
  return user
}
