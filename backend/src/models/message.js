import mongoose, { Schema } from 'mongoose'

const ref = (model) => ({ type: Schema.Types.ObjectId, ref: model, required: true })

const messageSchema = new Schema(
  {
    from: ref('user'),
    to: ref('user'),
    body: {
      type: String,
      required: [true, 'message cannot be empty'],
      trim: true,
      maxlength: [5000, 'message must be at most 5000 characters'],
    },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
)
messageSchema.index({ from: 1, to: 1, createdAt: -1 })
messageSchema.index({ to: 1, readAt: 1 })
export const Message = mongoose.model('message', messageSchema)
