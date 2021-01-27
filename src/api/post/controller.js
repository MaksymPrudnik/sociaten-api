import { success, notFound, authorOrAdmin } from '../../services/response/'
import Post from './model'
import createError from 'http-errors'
import User from '../user/model'

export const create = ({ user: { id }, bodymen: { body } }, res, next) =>
  Post.create({ ...body, author: id })
    .then((post) => post.view(true, id))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Post.countDocuments(query)
    .then((count) =>
      Post.find(query, select, cursor).then((posts) => ({
        count,
        rows: posts.map((post) => post.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const feed = (
  { user: { id }, querymen: { query, select, cursor } },
  res,
  next
) =>
  Post.countDocuments(query)
    .then((count) =>
      Post.find(query, select, cursor).then((posts) => ({
        count,
        rows: posts.map((post) => post.view(false, id))
      }))
    )
    .then(success(res))
    .catch(next)

export const feedByAuthor = async (
  { user: { id }, params: { username } },
  res,
  next
) => {
  try {
    let profile = {}
    if (username !== 'me') {
      profile = await User.findOne({ username })
    } else {
      profile.id = id
    }

    if (!profile) {
      throw createError(400, 'User not found')
    }

    const count = await Post.countDocuments({ author: profile.id })
    if (!count) {
      return res.status(200).json({ count, rows: [] })
    }
    const posts = await Post.find(
      { author: profile.id },
      {},
      { sort: '-createdAt' }
    )
    const rows = posts.map((post) => post.view(false, id))

    return res.status(200).json({ count, rows })
  } catch (error) {
    return next(error)
  }
}

export const show = ({ user: { id }, params }, res, next) =>
  Post.findById(params.id)
    .then(notFound(res))
    .then((post) => (post ? post.view(false, id) : null))
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  Post.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'author'))
    .then((post) => (post ? Object.assign(post, body).save() : null))
    .then((post) => (post ? post.view(true, user.id) : null))
    .then(success(res))
    .catch(next)

export const like = ({ user, params: { id } }, res, next) => {
  console.log('id', id)
  return Post.findById(id)
    .then(notFound(res))
    .then((post) => (post ? post.like(user.id) : null))
    .then((post) => (post ? post.view(true, user.id) : null))
    .then(success(res))
    .catch(next)
}

export const destroy = ({ user, params }, res, next) =>
  Post.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'author'))
    .then((post) => (post ? post.remove() : null))
    .then(success(res, 204))
    .catch(next)
