import mongoose from 'mongoose'
import { Message } from '../models/message.js'
import { User, PUBLIC_USER_FIELDS } from '../models/user.js'
import { HttpError, notFound } from '../middleware/errors.js'
import { emitTo, rooms } from '../realtime.js'

const oid = (id) => new mongoose.Types.ObjectId(String(id))

async function requireOtherUser(meId, otherId) {
  if (!mongoose.isValidObjectId(otherId)) throw new HttpError(400, 'invalid id')
  if (String(meId) === String(otherId)) throw new HttpError(400, 'you cannot message yourself')
  const other = await User.findById(otherId).select(PUBLIC_USER_FIELDS)
  if (!other) throw notFound('user')
  return other
}

// One row per conversation partner with the latest message and unread count.
export async function listConversations(meId) {
  const me = oid(meId)
  return Message.aggregate([
    { $match: { $or: [{ from: me }, { to: me }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { $cond: [{ $eq: ['$from', me] }, '$to', '$from'] },
        lastMessage: { $first: '$$ROOT' },
        unread: {
          $sum: { $cond: [{ $and: [{ $eq: ['$to', me] }, { $eq: ['$readAt', null] }] }, 1, 0] },
        },
      },
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
        pipeline: [{ $project: { username: 1, displayName: 1, avatarUrl: 1 } }],
      },
    },
    { $unwind: '$user' },
    { $project: { _id: 0, user: 1, lastMessage: 1, unread: 1 } },
  ])
}

export async function getThread(meId, otherId, { before, limit = 50 } = {}) {
  const other = await requireOtherUser(meId, otherId)
  const filter = {
    $or: [
      { from: meId, to: otherId },
      { from: otherId, to: meId },
    ],
  }
  if (before) filter.createdAt = { $lt: new Date(before) }
  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 50, 200))
  return { user: other, messages: messages.reverse() }
}

export async function sendMessage(meId, otherId, body) {
  await requireOtherUser(meId, otherId)
  const message = await Message.create({ from: meId, to: otherId, body })
  // Include the sender's public profile so clients can show who it's from.
  const sender = await User.findById(meId).select(PUBLIC_USER_FIELDS)
  const payload = { message, sender }
  emitTo(rooms.user(otherId), 'message:new', payload)
  // Also notify the sender's other tabs/devices.
  emitTo(rooms.user(meId), 'message:new', payload)
  return message
}

export async function markThreadRead(meId, otherId) {
  await requireOtherUser(meId, otherId)
  const { modifiedCount } = await Message.updateMany(
    { from: otherId, to: meId, readAt: null },
    { $set: { readAt: new Date() } },
  )
  if (modifiedCount) {
    emitTo(rooms.user(otherId), 'message:read', { by: meId })
    emitTo(rooms.user(meId), 'message:read', { by: meId })
  }
  return { updated: modifiedCount }
}

export async function unreadCount(meId) {
  return Message.countDocuments({ to: meId, readAt: null })
}
