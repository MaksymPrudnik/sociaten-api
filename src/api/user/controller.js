import { success, notFound } from '../../services/response/'
import { User } from '.'
import { sign } from '../../services/jwt'
import createError from 'http-errors'

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  User.count(query)
    .then((count) =>
      User.find(query, select, cursor).then((users) => ({
        rows: users.map((user) => user.view()),
        count
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params: { username } }, res, next) =>
  User.findOne({ username })
    .then(notFound(res))
    .then((user) => (user ? user.view() : null))
    .then(success(res))
    .catch(next)

export const showMe = ({ user }, res) => res.json(user.view(true))

export const create = ({ bodymen: { body } }, res, next) =>
  User.create(body)
    .then((user) => {
      sign(user.id)
        .then((token) => ({ token, user: user.view(true) }))
        .then(success(res, 201))
    })
    .catch((err) => {
      if (err.name === 'MongoError' && err.code === 11000) {
        res.status(409).json({
          valid: false,
          param: 'email',
          message: 'email already registered'
        })
      } else {
        next(err)
      }
    })

export const update = ({ bodymen: { body }, params, user }, res, next) =>
  User.findById(params.id === 'me' ? user.id : params.id)
    .then(notFound(res))
    .then((result) => {
      if (!result) return null
      const isAdmin = user.role === 'admin'
      const isSelfUpdate = user.id === result.id
      if (!isSelfUpdate && !isAdmin) {
        res.status(401).json({
          valid: false,
          message: "You can't change other user's data"
        })
        return null
      }
      return result
    })
    .then((user) => (user ? Object.assign(user, body).save() : null))
    .then((user) => (user ? user.view(true) : null))
    .then(success(res))
    .catch(next)

export const updatePassword = (
  { bodymen: { body }, params, user },
  res,
  next
) =>
  User.findById(params.id === 'me' ? user.id : params.id)
    .then(notFound(res))
    .then((result) => {
      if (!result) return null
      const isSelfUpdate = user.id === result.id
      if (!isSelfUpdate) {
        res.status(401).json({
          valid: false,
          param: 'password',
          message: "You can't change other user's password"
        })
        return null
      }
      return result
    })
    .then((user) =>
      user ? user.set({ password: body.password }).save() : null
    )
    .then((user) => (user ? user.view(true) : null))
    .then(success(res))
    .catch(next)

export const makeFriendRequest = async ({ user, params }, res, next) => {
  try {
    const requestReceiver = await User.findById(params.id)
    if (!requestReceiver) {
      throw createError(400, 'Requested user not found')
    }

    const isMade = await user.makeFriendRequest(params.id)
    const isReceived = await requestReceiver.receiveFriendRequest(id)

    if (!isMade || !isReceived) {
      await user.manageMadeRequest(params.id, false)
      await requestReceiver.manageReceivedRequest(user.id, false)
      throw createError(500, 'Error making request')
    }
  } catch (error) {
    return next(error)
  }
}

export const destroy = ({ params }, res, next) =>
  User.findById(params.id)
    .then(notFound(res))
    .then((user) => (user ? user.remove() : null))
    .then(success(res, 204))
    .catch(next)
