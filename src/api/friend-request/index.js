import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { token } from '../../services/passport'
import { create, index, show, destroy } from './controller'
import { schema } from './model'
export FriendRequest, { schema } from './model'

const router = new Router()
const { receiver } = schema.tree

/**
 * @api {post} /friend-requests Create friend request
 * @apiName CreateFriendRequest
 * @apiGroup FriendRequest
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiParam receiver Friend request's receiver.
 * @apiSuccess {Object} friendRequest Friend request's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Friend request not found.
 * @apiError 401 user access only.
 */
router.post('/',
  token({ required: true }),
  body({ receiver }),
  create)

/**
 * @api {get} /friend-requests Retrieve friend requests
 * @apiName RetrieveFriendRequests
 * @apiGroup FriendRequest
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Number} count Total amount of friend requests.
 * @apiSuccess {Object[]} rows List of friend requests.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /friend-requests/:id Retrieve friend request
 * @apiName RetrieveFriendRequest
 * @apiGroup FriendRequest
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} friendRequest Friend request's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Friend request not found.
 * @apiError 401 user access only.
 */
router.get('/:id',
  token({ required: true }),
  show)

/**
 * @api {delete} /friend-requests/:id Delete friend request
 * @apiName DeleteFriendRequest
 * @apiGroup FriendRequest
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Friend request not found.
 * @apiError 401 user access only.
 */
router.delete('/:id',
  token({ required: true }),
  destroy)

export default router
