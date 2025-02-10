import { Router } from 'express'
import { Request, Response, NextFunction } from 'express'
import { OpenAI } from 'openai'
import { verifyAuth } from '../middleware/auth'
import { RequestHandler } from 'express'

const router = Router()

// Apply auth middleware to all routes
// router.use(verifyAuth as RequestHandler)

// Simple test endpoint
router.get('/list-models', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        })

        const models = await openai.models.list()

        res.json({
            status: 'success',
            message: 'OpenAI connection successful',
            availableModels: models.data.map(model => model.id)
        })
    } catch (error) {
        next(error)
    }
})

export default router 