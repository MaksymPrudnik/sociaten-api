import { success, notFound, authorOrAdmin } from '../../services/response/'
import { Comment } from '.'

export const create = ({ user, bodymen: { body } }, res, next) =>
  Comment.create({ ...body, author: user })
    .then((comment) => comment.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  Comment.count(query)
    .then(count => Comment.find(query, select, cursor)
      .populate('author')
      .then((comments) => ({
        count,
        rows: comments.map((comment) => comment.view())
      }))
    )
    .then(success(res))
    .catch(next)

export const update = ({ user, bodymen: { body }, params }, res, next) =>
  Comment.findById(params.id)
    .populate('author')
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'author'))
    .then((comment) => comment ? Object.assign(comment, body).save() : null)
    .then((comment) => comment ? comment.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ user, params }, res, next) =>
  Comment.findById(params.id)
    .then(notFound(res))
    .then(authorOrAdmin(res, user, 'author'))
    .then((comment) => comment ? comment.remove() : null)
    .then(success(res, 204))
    .catch(next)
