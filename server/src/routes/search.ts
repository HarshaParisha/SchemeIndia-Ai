import { Router } from 'express'

import { searchHandler } from '../controllers/searchController.js'

export const searchRouter = Router()

searchRouter.get('/', searchHandler)

