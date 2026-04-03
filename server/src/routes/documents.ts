import { Router } from 'express'
import multer from 'multer'
import pdfParse from 'pdf-parse'
import Tesseract from 'tesseract.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { groqChat } from '../services/groqService.js'

export const documentsRouter = Router()

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } })

type DocHistoryItem = {
  id: string
  userId: string
  filename: string
  summary: string
  createdAt: Date
}

const history: DocHistoryItem[] = []

documentsRouter.post('/explain', requireAuth, upload.single('file'), async (req: AuthedRequest, res, next) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ ok: false, error: { message: 'Please upload a file.' } })

    let text = ''
    if (file.mimetype === 'application/pdf') {
      const parsed = await pdfParse(file.buffer)
      text = parsed.text || ''
    } else {
      const ocr = await Tesseract.recognize(file.buffer)
      text = ocr.data.text || ''
    }

    const prompt =
      'Explain this document in plain English for an Indian user. Output in 4 sections: Plain English summary, Key points, What action is required, Deadline (if any). Keep it calm and non-judgmental.\n\nDOCUMENT TEXT:\n' +
      text.slice(0, 12000)

    const result = await groqChat({ messages: [{ role: 'user', content: prompt }] })
    const clerkId = req.auth!.clerkId
    const item: DocHistoryItem = {
      id: String(Date.now()),
      userId: clerkId,
      filename: file.originalname,
      summary: result.content,
      createdAt: new Date(),
    }
    history.unshift(item)

    res.json({ ok: true, data: { explanation: result.content } })
  } catch (err) {
    next(err)
  }
})

documentsRouter.get('/history', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const clerkId = req.auth!.clerkId
    const items = history.filter((h) => h.userId === clerkId).slice(0, 20)
    res.json({ ok: true, data: { items } })
  } catch (err) {
    next(err)
  }
})
