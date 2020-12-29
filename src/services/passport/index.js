import passport from 'passport'
import { Schema } from 'bodymen'
import { BasicStrategy } from 'passport-http'
import LocalStrategy from 'passport-local'
import { Strategy as BearerStrategy } from 'passport-http-bearer'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import { jwtSecret, masterKey } from '../../config'
import User, { schema } from '../../api/user/model'

export const password = () => (req, res, next) =>
  passport.authenticate(
    ['basic', 'local'],
    { session: false },
    (err, user, info) => {
      if (err && err.param) {
        return res.status(400).json(err)
      } else if (err || !user) {
        return res.status(401).end()
      }
      req.logIn(user, { session: false }, (err) => {
        if (err) return res.status(401).end()
        next()
      })
    }
  )(req, res, next)

export const master = () => passport.authenticate('master', { session: false })

export const token = ({ required, roles = User.roles } = {}) => (
  req,
  res,
  next
) =>
  passport.authenticate('token', { session: false }, (err, user, info) => {
    if (
      err ||
      (required && !user) ||
      (required && !~roles.indexOf(user.role))
    ) {
      return res.status(401).end()
    }
    req.logIn(user, { session: false }, (err) => {
      if (err) return res.status(401).end()
      next()
    })
  })(req, res, next)

passport.use(
  'master',
  new BearerStrategy((token, done) => {
    if (token === masterKey) {
      done(null, {})
    } else {
      done(null, false)
    }
  })
)

passport.use(
  'token',
  new JwtStrategy(
    {
      secretOrKey: jwtSecret,
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromUrlQueryParameter('access_token'),
        ExtractJwt.fromBodyField('access_token'),
        ExtractJwt.fromAuthHeaderWithScheme('Bearer')
      ])
    },
    ({ id }, done) => {
      User.findById(id)
        .then((user) => {
          done(null, user)
          return null
        })
        .catch(done)
    }
  )
)

passport.use(
  'basic',
  new BasicStrategy((login, password, done) => {
    const userSchema = new Schema({
      email: schema.tree.email,
      password: schema.tree.password
    })

    const query = {}

    userSchema.validate({ email: login, password }, (err) => {
      if (err) {
        if (err.name === 'match' && err.param === 'email') {
          query.nickname = login
        } else {
          done(err)
        }
      } else {
        query.email = login
      }
    })

    console.log(query)
    User.findOne({ ...query }).then((user) => {
      if (!user) {
        done(true)
        return null
      }
      return user
        .authenticate(password, user.password)
        .then((user) => {
          done(null, user)
          return null
        })
        .catch(done)
    })
  })
)

passport.use(
  'local',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      session: false
    },
    function (login, password, done) {
      const userSchema = new Schema({
        email: schema.tree.email,
        password: schema.tree.password
      })

      const query = {}

      userSchema.validate({ email: login, password }, (err) => {
        if (err) {
          if (err.name === 'match' && err.param === 'email') {
            query.nickname = login
          } else {
            done(err)
          }
        } else {
          query.email = login
        }
      })

      User.findOne({ ...query }).then((user) => {
        if (!user) {
          done(true)
          return null
        }
        return user
          .authenticate(password, user.password)
          .then((user) => {
            done(null, user)
            return null
          })
          .catch(done)
      })
    }
  )
)
