import mongoose, { Schema } from 'mongoose'

const friendRequestSchema = new Schema(
  {
    author: {
      type: Schema.ObjectId,
      ref: 'User',
      required: true
    },
    receiver: {
      type: Schema.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (obj, ret) => {
        delete ret._id
      }
    }
  }
)

friendRequestSchema.methods = {
  view(full) {
    let fields = ['id', 'author', 'receiver']
    const view = {}

    if (full) {
      fields = [...fields, 'createdAt', 'updatedAt']
    }

    fields.forEach((field) => {
      view[field] = this[field]
    })

    return view
  }
}

const model = mongoose.model('FriendRequest', friendRequestSchema)

export const schema = model.schema
export default model
