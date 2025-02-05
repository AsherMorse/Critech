import { db } from '../db/client'
import { reviews } from '../db/schema'
import { eq } from 'drizzle-orm'
import type { ReviewStatus } from '../db/schema'

export interface CreateReviewDto {
  title: string
  description: string
  pros?: string[]
  cons?: string[]
  tags?: string[]
}

export interface UpdateReviewDto extends Partial<CreateReviewDto> {
  status?: ReviewStatus
  videoId?: number
}

class ReviewsService {
  // Create a new draft review
  async createDraft(data: CreateReviewDto) {
    const [review] = await db.insert(reviews).values({
      title: data.title,
      description: data.description,
      pros: data.pros || [],
      cons: data.cons || [],
      tags: data.tags || [],
      status: 'draft',
      isVideoReady: false,
      statusHistory: [{
        status: 'draft',
        timestamp: new Date().toISOString()
      }]
    }).returning()

    return review
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

  // Update a review
  async updateReview(id: number, data: UpdateReviewDto) {
    const updateData: Partial<typeof reviews.$inferInsert> = { ...data }
    
    // If status is being updated, add to status history
    if (updateData.status) {
      const review = await this.getReviewById(id)
      if (!review) {
        throw new Error('Review not found')
      }

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
}

export default new ReviewsService() 