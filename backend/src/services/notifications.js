import mongoose from 'mongoose'
import { Notification } from '../models/notification.js'
import { PUBLIC_USER_FIELDS } from '../models/user.js'
import { emitTo, rooms } from '../realtime.js'

const populate = (query) =>
  query.populate('actor', PUBLIC_USER_FIELDS).populate('recipe', 'title imageUrl')

// Records activity on someone's recipe and pushes it to them live.
// Acting on your own recipe never notifies you.
export async function notify({ recipient, actor, type, recipe, comment, value, excerpt }) {
  if (String(recipient) === String(actor)) return null

  if (type !== 'comment') {
    // Re-liking or changing a rating replaces the earlier notification so
    // it moves to the top as unread instead of piling up duplicates.
    await Notification.deleteMany({ recipient, actor, type, recipe })
  }
  const doc = await Notification.create({ recipient, actor, type, recipe, comment, value, excerpt })
  const full = await populate(Notification.findById(doc._id))
  emitTo(rooms.user(recipient), 'notification:new', { notification: full })
  return full
}

// Removes notifications for activity that was undone (unlike, cleared
// rating, deleted comment or recipe) and tells affected users to refresh.
export async function retract(filter) {
  const recipients = await Notification.distinct('recipient', filter)
  if (!recipients.length) return
  await Notification.deleteMany(filter)
  for (const r of recipients) emitTo(rooms.user(r), 'notification:changed', {})
}

export async function listNotifications(userId, { before, limit = 30 } = {}) {
  const filter = { recipient: userId }
  if (before) filter.createdAt = { $lt: new Date(before) }
  return populate(
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 30, 100)),
  )
}

export async function unreadNotificationCount(userId) {
  return Notification.countDocuments({ recipient: userId, readAt: null })
}

// Marks the given notifications (or all of them) as read.
export async function markNotificationsRead(userId, ids) {
  const filter = { recipient: userId, readAt: null }
  if (Array.isArray(ids)) filter._id = { $in: ids.filter((id) => mongoose.isValidObjectId(id)) }
  const { modifiedCount } = await Notification.updateMany(filter, { $set: { readAt: new Date() } })
  if (modifiedCount) emitTo(rooms.user(userId), 'notification:changed', {})
  return { updated: modifiedCount }
}
