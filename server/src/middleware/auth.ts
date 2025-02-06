import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { ApiError } from './error-handler'
import { db } from '../db/client'
import { reviews } from '../db/schema'
import { eq } from 'drizzle-orm'

dotenv.config()

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
)

// Verify JWT token and add user to request
export const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]
        if (!token) {
            return res.status(401).json({ message: 'No token provided' })
        }

        const { data: { user }, error } = await supabase.auth.getUser(token)

        if (error || !user) {
            return res.status(401).json({ message: 'Invalid token' })
        }

        req.user = {
            id: user.id,
            email: user.email!
        }

        next()
    } catch (error) {
        console.error('Auth error:', error)
        res.status(401).json({ message: 'Authentication failed' })
    }
}

// Verify review ownership
export const verifyReviewOwnership = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reviewId = req.params.id
        const { data: review } = await supabase
            .from('reviews')
            .select('owner_id')
            .eq('id', reviewId)
            .single()

        if (!review) {
            return res.status(404).json({ message: 'Review not found' })
        }

        if (review.owner_id !== req.user?.id) {
            return res.status(403).json({ message: 'You do not have permission to access this review' })
        }

        next()
    } catch (error) {
        console.error('Review ownership verification error:', error)
        res.status(500).json({ message: 'Error verifying review ownership' })
    }
}

// Add user types to Express Request
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string
                email: string
            }
        }
    }
} 