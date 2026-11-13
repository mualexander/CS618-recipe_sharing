import mongoose, { Schema } from 'mongoose'

export const NOTIFICATION_TYPES = ['like', 'rating', 'comment']

// Stored so users see activity that happened while they were offline.
// Likes and ratings keep one notification per (actor, recipe) that is
// refreshed on repeat actions; each comment gets its own.
const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    recipe: { type: Schema.Types.ObjectId, ref: 'recipe', required: true },
    comment: { type: Schema.Types.ObjectId, ref: 'comment' },
    // Type-specific details: the rating value or a short comment excerpt.
    value: Number,
    excerpt: String,
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
)
notificationSchema.index({ recipient: 1, createdAt: -1 })
notificationSchema.index({ recipient: 1, readAt: 1 })
notificationSchema.index({ recipe: 1 })
export const Notification = mongoose.model('notification', notificationSchema)
