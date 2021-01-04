import mongoose, { Schema } from 'mongoose'

const commentSchema = new Schema(
  {
    author: {
      type: Schema.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String
    },
    document: {
      type: Schema.ObjectId,
      ref: 'Post',
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

commentSchema.methods = {
  view(full) {
    let fields = ['id', 'author', 'text', 'document', 'createdAt']
    const view = {}

    if (full) {
      fields = [...fields, 'updatedAt']
    }

    fields.forEach((field) => {
      view[field] = this[field]
    })

    return view
  }
}

commentSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'author',
    select: 'id username picture'
  })
  next()
})

const model = mongoose.model('Comment', commentSchema)

export const schema = model.schema
export default model
