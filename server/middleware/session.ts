import session from 'express-session'
import MongoStore from 'connect-mongo'
import dotenv from 'dotenv'

dotenv.config()

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI!,
  }),
  cookie: {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 1000,
  },
})

export default sessionMiddleware
