import { db } from '../db/client'
import { reviews, videos } from '../db/schema'
import { eq, desc, sql, and, lt } from 'drizzle-orm'
import type { ReviewStatus } from '../db/schema'

// DTO for creating a review from a video
export interface CreateReviewFromVideoDto {
  videoId: number
  ownerId: string
  title?: string
  description?: string
  pros?: string[]
  cons?: string[]
  altLinks?: { name: string, url: string }[]
  tags?: string[]
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
  // Get total count of reviews
  async getReviewCount(ownerId?: string) {
    const result = await db.select({
      count: sql<number>`count(*)`
    })
      .from(reviews)
      .where(
        sql`${reviews.status} != 'deleted' 
      AND ${reviews.status} != 'archived'
      AND ${reviews.title} IS NOT NULL
      AND ${reviews.title} != ''
      ${ownerId ? sql`AND ${reviews.ownerId} = ${ownerId}` : sql``}`
      )

    return result[0].count
  }

  // Get reviews with pagination
  async getReviewsPage(pageSize: number = 5, lastId?: number, ownerId?: string) {
    try {
      console.time(`getReviewsPage-${lastId || 'initial'}`)

      // Build base query with join
      const query = db.select({
        id: reviews.id,
        videoId: reviews.videoId,
        title: reviews.title,
        description: reviews.description,
        pros: reviews.pros,
        cons: reviews.cons,
        altLinks: reviews.altLinks,
        tags: reviews.tags,
        status: reviews.status,
        statusHistory: reviews.statusHistory,
        isVideoReady: reviews.isVideoReady,
        publishedAt: reviews.publishedAt,
        archivedAt: reviews.archivedAt,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        video: sql<any>`json_build_object(
          'videoUrl', ${videos.videoUrl},
          'thumbnailUrl', ${videos.thumbnailUrl}
        )`
      })
        .from(reviews)
        .leftJoin(videos, eq(reviews.videoId, videos.id))
        .where(
          sql`${reviews.status} != 'deleted' 
        AND ${reviews.status} != 'archived'
        AND ${reviews.title} IS NOT NULL
        AND ${reviews.title} != ''
        ${ownerId ? sql`AND ${reviews.ownerId} = ${ownerId}` : sql``}
        ${lastId ? sql`AND ${reviews.id} < ${lastId}` : sql``}`
        )
        .orderBy(desc(reviews.id))
        .limit(pageSize)

      // Execute query
      const results = await query

      // Transform results to match expected format
      const transformedResults = results.map(result => ({
        ...result,
        video: result.video.videoUrl ? result.video : undefined
      }))

      console.timeEnd(`getReviewsPage-${lastId || 'initial'}`)
      console.log('Page results:', {
        lastId: lastId || 'initial',
        count: transformedResults.length,
        withVideo: transformedResults.filter(r => !!r.video).length,
        withThumbnail: transformedResults.filter(r => !!r.video?.thumbnailUrl).length,
        ids: transformedResults.map(r => r.id)
      })

      return transformedResults
    } catch (error) {
      console.error('Error in getReviewsPage:', error)
      throw error
    }
  }

  // Get all reviews (legacy method)
  async getAllReviews(ownerId?: string) {
    try {
      console.time('getAllReviews')

      // Build base query with join
      const query = db.select({
        id: reviews.id,
        videoId: reviews.videoId,
        title: reviews.title,
        description: reviews.description,
        pros: reviews.pros,
        cons: reviews.cons,
        altLinks: reviews.altLinks,
        tags: reviews.tags,
        status: reviews.status,
        statusHistory: reviews.statusHistory,
        isVideoReady: reviews.isVideoReady,
        publishedAt: reviews.publishedAt,
        archivedAt: reviews.archivedAt,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        video: sql<any>`json_build_object(
          'videoUrl', ${videos.videoUrl},
          'thumbnailUrl', ${videos.thumbnailUrl}
        )`
      })
        .from(reviews)
        .leftJoin(videos, eq(reviews.videoId, videos.id))
        .where(
          sql`${reviews.status} != 'deleted' 
        AND ${reviews.status} != 'archived'
        AND ${reviews.title} IS NOT NULL
        AND ${reviews.title} != ''
        ${ownerId ? sql`AND ${reviews.ownerId} = ${ownerId}` : sql``}`
        )
        .orderBy(desc(reviews.createdAt))

      // Execute query
      const results = await query

      // Transform results to match expected format
      const transformedResults = results.map(result => ({
        ...result,
        video: result.video.videoUrl ? result.video : undefined
      }))

      console.timeEnd('getAllReviews')
      console.log('Query results:', {
        total: transformedResults.length,
        withVideo: transformedResults.filter(r => !!r.video).length,
        withThumbnail: transformedResults.filter(r => !!r.video?.thumbnailUrl).length
      })

      return transformedResults
    } catch (error) {
      console.error('Error in getAllReviews:', error)
      throw error
    }
  }

  // Create initial review entry after video upload
  async createFromVideo(data: CreateReviewFromVideoDto) {
    const [review] = await db.insert(reviews).values({
      videoId: data.videoId,
      ownerId: data.ownerId,
      title: data.title || '',
      description: data.description || '',
      pros: data.pros || [],
      cons: data.cons || [],
      altLinks: data.altLinks || [],
      tags: data.tags || [],
      status: data.title && data.description ? 'draft' : 'video_uploaded',
      statusHistory: [{
        status: data.title && data.description ? 'draft' : 'video_uploaded',
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

  // Get a single review with video data
  async getReviewById(id: number) {
    const result = await db.select({
      id: reviews.id,
      videoId: reviews.videoId,
      title: reviews.title,
      description: reviews.description,
      pros: reviews.pros,
      cons: reviews.cons,
      altLinks: reviews.altLinks,
      tags: reviews.tags,
      status: reviews.status,
      statusHistory: reviews.statusHistory,
      isVideoReady: reviews.isVideoReady,
      publishedAt: reviews.publishedAt,
      archivedAt: reviews.archivedAt,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      video: sql<any>`json_build_object(
        'videoUrl', ${videos.videoUrl},
        'thumbnailUrl', ${videos.thumbnailUrl}
      )`
    })
      .from(reviews)
      .leftJoin(videos, eq(reviews.videoId, videos.id))
      .where(eq(reviews.id, id))
      .limit(1)

    if (result.length === 0) return null

    const review = result[0]
    return {
      ...review,
      video: review.video.videoUrl ? review.video : undefined
    }
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