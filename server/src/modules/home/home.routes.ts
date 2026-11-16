import { Router } from 'express'
import { requireAuth } from '../../common/middleware/auth.js'
import * as controller from './home.controller.js'

export const homeRouter = Router()

homeRouter.use(requireAuth)

homeRouter.get('/', controller.getHome)
