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
    let fields = ['id']
    const view = {}

    if (full) {
      fields = [...fields, 'createdAt', 'updatedAt']
    }

    fields.forEach((field) => {
      view[field] = this[field]
    })

    view.author = this.author.view()
    view.receiver = this.receiver.view()

    return view
  }
}

friendRequestSchema.pre(/^find/, function (next) {
  this.populate([{ path: 'author' }, { path: 'receiver' }])
})

const model = mongoose.model('FriendRequest', friendRequestSchema)

export const schema = model.schema
export default model
