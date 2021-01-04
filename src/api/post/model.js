import mongoose, { Schema } from 'mongoose'

const postSchema = new Schema(
  {
    author: {
      type: Schema.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    media: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length < 5
        },
        message: 'One post can contain no more then 5 media items'
      }
    },
    likes: {
      type: [String]
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

postSchema.virtual('likesCount').get(function () {
  return this.likes?.length
})

postSchema.virtual('comments', {
  ref: 'Comment',
  foreignField: 'document',
  localField: '_id'
})

postSchema.virtual('commentsCount').get(function () {
  return this.comments?.length
})

postSchema.methods = {
  view(full) {
    let fields = [
      'id',
      'author',
      'title',
      'text',
      'media',
      'comments',
      'commentsCount',
      'likesCount',
      'createdAt',
      'updatedAt'
    ]
    const view = {}

    if (full) {
      fields = [...fields, 'likes']
    }

    fields.forEach((field) => {
      view[field] = this[field]
    })

    return view
  },

  like(id) {
    if (this.likes.includes(id)) {
      this.likes = this.likes.filter((like) => like !== id)
    } else {
      this.likes.addToSet(id)
    }
    return this.save()
  }
}

postSchema.pre(/^find/, function (next) {
  this.populate([
    {
      path: 'author',
      select: 'id picture username'
    },
    {
      path: 'comments',
      select: 'id author text createdAt'
    }
  ])
  next()
})

const model = mongoose.model('Post', postSchema)

export const schema = model.schema
export default model
