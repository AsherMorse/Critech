import { db } from '../db/client'
import { reviews } from '../db/schema'
import { eq } from 'drizzle-orm'
import type { ReviewStatus } from '../db/schema'

// DTO for creating a review from a video
export interface CreateReviewFromVideoDto {
  videoId: number
}

// DTO for updating review details
export interface UpdateReviewDto {
  title?: string
  description?: string
  pros?: string[]
  cons?: string[]
  tags?: string[]
  status?: ReviewStatus
}

class ReviewsService {
  // Create initial review entry after video upload
  async createFromVideo(data: CreateReviewFromVideoDto) {
    const [review] = await db.insert(reviews).values({
      videoId: data.videoId,
      pros: [],
      cons: [],
      tags: [],
      status: 'video_uploaded',
      statusHistory: [{
        status: 'video_uploaded',
        timestamp: new Date().toISOString()
      }]
    }).returning()

    return review
  }

  // Update review with details
  async updateReview(id: number, data: UpdateReviewDto) {
    // Get current review state
    const review = await this.getReviewById(id)
    if (!review) {
      throw new Error('Review not found')
    }

    const updateData: Partial<typeof reviews.$inferInsert> = { ...data }

    // If adding title and description for the first time, transition to draft
    if (review.status === 'video_uploaded' && updateData.title && updateData.description) {
      updateData.status = 'draft'
      // Initialize arrays if not provided
      updateData.pros = updateData.pros || []
      updateData.cons = updateData.cons || []
      updateData.tags = updateData.tags || []
    }

    // If status is being updated (either manually or automatically), add to status history
    if (updateData.status) {
      updateData.statusHistory = [
        ...(review.statusHistory as any[]),
        {
          status: updateData.status,
          timestamp: new Date().toISOString()
        }
      ]
    }

    const [updated] = await db.update(reviews)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(reviews.id, id))
      .returning()

    return updated
  }

  // Get all reviews
  async getAllReviews() {
    return await db.query.reviews.findMany({
      orderBy: (reviews, { desc }) => [desc(reviews.createdAt)]
    })
  }

  // Get a review by ID
  async getReviewById(id: number) {
    return await db.query.reviews.findFirst({
      where: eq(reviews.id, id)
    })
  }

  // Delete a review
  async deleteReview(id: number) {
    const [deleted] = await db.delete(reviews)
      .where(eq(reviews.id, id))
      .returning()

    return deleted
  }

  // Validate review exists
  async validateReviewExists(id: number) {
    const review = await this.getReviewById(id)
    if (!review) {
      throw new Error('Review not found')
    }
    return review
  }

  // Update review by video ID
  async updateReviewByVideoId(videoId: number, data: Partial<typeof reviews.$inferInsert>) {
    const [updated] = await db.update(reviews)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(reviews.videoId, videoId))
      .returning()

    return updated
  }
}

export default new ReviewsService() 