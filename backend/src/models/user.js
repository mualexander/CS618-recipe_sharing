import mongoose, { Schema } from 'mongoose'
import { httpUrl } from './validators.js'

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'username must be at least 3 characters'],
      maxlength: [30, 'username must be at most 30 characters'],
      match: [/^[a-z0-9_]+$/, 'username may only contain letters, numbers, and underscores'],
    },
    // Excluded from queries by default; select('+password') when verifying.
    password: { type: String, required: true, select: false },
    displayName: { type: String, trim: true, maxlength: 60 },
    bio: { type: String, trim: true, maxlength: 500 },
    avatarUrl: { type: String, trim: true, validate: httpUrl },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password
        delete ret.__v
        return ret
      },
    },
  },
)

export const PUBLIC_USER_FIELDS = 'username displayName avatarUrl'

export const User = mongoose.model('user', userSchema)
