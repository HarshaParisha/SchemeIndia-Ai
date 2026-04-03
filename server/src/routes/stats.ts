import { Router } from 'express'

import { statsHandler } from '../controllers/statsController.js'

export const statsRouter = Router()

statsRouter.get('/', statsHandler)

