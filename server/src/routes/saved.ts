import { Router } from 'express'

import { requireAuth } from '../middleware/auth.js'
import { deleteSavedHandler, getSavedHandler, saveSchemeHandler, updateSavedStatusHandler } from '../controllers/savedController.js'

export const savedRouter = Router()

savedRouter.get('/', requireAuth, getSavedHandler)
savedRouter.post('/:schemeId', requireAuth, saveSchemeHandler)
savedRouter.delete('/:schemeId', requireAuth, deleteSavedHandler)
savedRouter.put('/:schemeId/status', requireAuth, updateSavedStatusHandler)

