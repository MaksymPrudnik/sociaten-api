import { success, notFound, authorOrAdmin } from '../../services/response/'
import FriendRequest from './model'
import User from '../user/model'
import createError from 'http-errors'

export const create = async ({ user, params: { receiver } }, res, next) => {
  try {
    const receiverUser = await User.findById(receiver)
    if (!receiverUser) {
      createError(400, 'Requested user does not exist')
    }

    const isRequestExist = !!(await FriendRequest.findOne({
      author: user.id,
      receiver
    }))
    if (isRequestExist) {
      throw createError(400, 'Such friend request already exist')
    }

    await FriendRequest.create({
      receiver,
      author: user.id
    })

    return res.status(201).end()
  } catch (error) {
    return next(error)
  }
}

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  FriendRequest.count(query)
    .then((count) =>
      FriendRequest.find(query, select, cursor).then((friendRequests) => ({
        count,
        rows: friendRequests.map((friendRequest) => friendRequest.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const indexMade = async (
  { params: { author }, querymen: { select, cursor } },
  res,
  next
) => {
  try {
    const count = await FriendRequest.find({ author }, select, cursor)
    if (!count) {
      return res.status(200).json({ count, rows: [] })
    }

    const madeRequests = await FriendRequest.find({ author }, select, cursor)
    const rows = madeRequests.map((request) => request.view())

    return res.status(200).json({ count, rows })
  } catch (error) {
    return next(error)
  }
}

export const indexReceived = async (
  { params: { receiver }, querymen: { select, cursor } },
  res,
  next
) => {
  try {
    const count = await FriendRequest.find({ receiver }, select, cursor)
    if (!count) {
      return res.status(200).json({ count, rows: [] })
    }

    const madeRequests = await FriendRequest.find({ receiver }, select, cursor)
    const rows = madeRequests.map((request) => request.view())

    return res.status(200).json({ count, rows })
  } catch (error) {
    return next(error)
  }
}

export const show = ({ params }, res, next) =>
  FriendRequest.findById(params.id)
    .then(notFound(res))
    .then((friendRequest) => (friendRequest ? friendRequest.view() : null))
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  FriendRequest.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'author'))
    .then((friendRequest) => (friendRequest ? friendRequest.remove() : null))
    .then(success(res, 204))
    .catch(next)
