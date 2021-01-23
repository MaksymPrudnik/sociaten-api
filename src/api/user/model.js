import crypto from 'crypto'
import bcrypt from 'bcrypt'
import mongoose, { Schema } from 'mongoose'
import mongooseKeywords from 'mongoose-keywords'
import { env } from '../../config'

const roles = ['user', 'admin']

const userRefSchema = new Schema(
  {
    type: Schema.ObjectId
  },
  {
    _id: false,
    autoIndex: false
  }
)

const requestsSchema = new Schema(
  {
    received: [userRefSchema],
    made: [userRefSchema]
  },
  {
    _id: false,
    autoIndex: false
  }
)

const userSchema = new Schema(
  {
    email: {
      type: String,
      match: /^\S+@\S+\.\S+$/,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    username: {
      type: String,
      index: true,
      trim: true,
      required: true
    },
    role: {
      type: String,
      enum: roles,
      default: 'user'
    },
    picture: {
      type: String,
      trim: true,
      default:
        'https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=889&q=80',
      required: true
    },
    wallpapper: {
      type: String,
      trim: true,
      required: true,
      default:
        'https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?ixlib=rb-1.2.1&ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&auto=format&fit=crop&w=1500&q=80'
    },
    requests: requestsSchema,
    friends: [userRefSchema]
  },
  {
    timestamps: true
  }
)

userSchema.path('email').set(function (email) {
  if (!this.picture || this.picture.indexOf('https://gravatar.com') === 0) {
    const hash = crypto.createHash('md5').update(email).digest('hex')
    this.picture = `https://gravatar.com/avatar/${hash}?d=identicon`
  }

  return email
})

userSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next()

  /* istanbul ignore next */
  const rounds = env === 'test' ? 1 : 9

  bcrypt
    .hash(this.password, rounds)
    .then((hash) => {
      this.password = hash
      next()
    })
    .catch(next)
})

userSchema.methods = {
  view(full) {
    const view = {}
    let fields = ['id', 'username', 'picture', 'wallpapper', 'createdAt']

    if (full) {
      fields = [...fields, 'email']
    }

    fields.forEach((field) => {
      view[field] = this[field]
    })

    return view
  },

  async authenticate(password) {
    const valid = await bcrypt.compare(password, this.password)
    return valid ? this : false
  },

  async makeFriendRequest(id) {
    const isSuccessful = !!this.requests.made.addToSet(id).length

    await this.save()

    return isSuccessful
  },

  async receiveFriendRequest(id) {
    const isSuccessful = !!this.requests.received.addToSet(id).length

    await this.save()

    return isSuccessful
  },

  async manageReceivedRequest(id, shouldAccept) {
    if (!this.requests.received.includes(id)) {
      return false
    }

    this.requests.received = this.requests.received.filter(
      (request) => request !== id
    )
    if (shouldAccept) {
      this.friends.addToSet(id)
    }

    await this.save()

    return true
  },

  async manageMadeRequest(id, isAccepted) {
    if (!this.requests.made.includes(id)) {
      return false
    }

    this.requests.received = this.requests.made.filter(
      (request) => request !== id
    )
    if (isAccepted) {
      this.friends.addToSet(id)
    }

    await this.save()

    return true
  },

  async removeFriend(id) {
    if (!this.friends.includes(id)) {
      return false
    }

    this.friends = this.friends.filter((friend) => friend !== id)
    await this.save()

    return true
  }
}

userSchema.statics = {
  roles
}

userSchema.plugin(mongooseKeywords, { paths: ['email', 'username'] })

const model = mongoose.model('User', userSchema)

export const schema = model.schema
export default model
