import { db } from '../db/client'
import { reviews, videos, topics } from '../db/schema'
import { eq, desc, sql, and, lt } from 'drizzle-orm'
import type { ReviewStatus } from '../db/schema'
import { OpenAI } from 'openai'
import { topicsService } from './topics.service'

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
  topicId?: number // Optional topic ID
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
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

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
        topicId: reviews.topicId,
        video: sql<any>`json_build_object(
          'videoUrl', ${videos.videoUrl},
          'thumbnailUrl', ${videos.thumbnailUrl}
        )`,
        topic: sql<any>`CASE WHEN ${topics.id} IS NOT NULL THEN json_build_object(
          'id', ${topics.id},
          'name', ${topics.name},
          'description', ${topics.description}
        ) ELSE NULL END`
      })
        .from(reviews)
        .leftJoin(videos, eq(reviews.videoId, videos.id))
        .leftJoin(topics, eq(reviews.topicId, topics.id))
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
        video: result.video.videoUrl ? result.video : undefined,
        topic: result.topic || undefined
      }))

      return transformedResults
    } catch (error) {
      console.error('Error in getReviewsPage:', error)
      throw error
    }
  }

  // Get all reviews (legacy method)
  async getAllReviews(ownerId?: string) {
    try {
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
        topicId: reviews.topicId,
        video: sql<any>`json_build_object(
          'videoUrl', ${videos.videoUrl},
          'thumbnailUrl', ${videos.thumbnailUrl}
        )`,
        topic: sql<any>`CASE WHEN ${topics.id} IS NOT NULL THEN json_build_object(
          'id', ${topics.id},
          'name', ${topics.name},
          'description', ${topics.description}
        ) ELSE NULL END`
      })
        .from(reviews)
        .leftJoin(videos, eq(reviews.videoId, videos.id))
        .leftJoin(topics, eq(reviews.topicId, topics.id))
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
        video: result.video.videoUrl ? result.video : undefined,
        topic: result.topic || undefined
      }))

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
      topicId: data.topicId,
      status: data.title && data.description ? 'draft' : 'video_uploaded',
      statusHistory: [{
        status: data.title && data.description ? 'draft' : 'video_uploaded',
        timestamp: new Date().toISOString()
      }]
    }).returning()

    // If topic is assigned, update its market summary
    if (data.topicId) {
      await this.updateTopicMarketSummary(data.topicId);
    }

    // If no topic is provided, analyze and assign one
    if (!data.topicId && review.title && review.description) {
      const updatedReview = await this.analyzeAndAssignTopic(review.id);
      if (updatedReview.topicId) {
        await this.updateTopicMarketSummary(updatedReview.topicId);
      }
      return updatedReview;
    }

    return review;
  }

  // Update review with details
  async updateReview(id: number, data: UpdateReviewDto) {
    const review = await this.getReviewById(id);
    if (!review) {
      throw new Error('Review not found');
    }

    const updateData: Partial<typeof reviews.$inferInsert> = { ...data };

    if (review.status === 'video_uploaded' && updateData.title && updateData.description) {
      updateData.status = 'draft';
      updateData.pros = updateData.pros || [];
      updateData.cons = updateData.cons || [];
      updateData.tags = updateData.tags || [];
    }

    if (updateData.status) {
      updateData.statusHistory = [
        ...(review.statusHistory as any[]),
        {
          status: updateData.status,
          timestamp: new Date().toISOString()
        }
      ];
    }

    const [updated] = await db.update(reviews)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(reviews.id, id))
      .returning();

    // Update market summary if the review has a topic
    if (updated.topicId) {
      await this.updateTopicMarketSummary(updated.topicId);
    }

    // If title or description was updated and no topic is assigned, analyze and assign one
    if ((updateData.title || updateData.description) && !review.topicId) {
      const updatedWithTopic = await this.analyzeAndAssignTopic(updated.id);
      if (updatedWithTopic.topicId) {
        await this.updateTopicMarketSummary(updatedWithTopic.topicId);
      }
      return updatedWithTopic;
    }

    return updated;
  }

  // Get a single review with video data
  async getReviewById(id: number) {
    const result = await db.select({
      id: reviews.id,
      videoId: reviews.videoId,
      ownerId: reviews.ownerId,
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
      topicId: reviews.topicId,
      video: sql<any>`json_build_object(
        'videoUrl', ${videos.videoUrl},
        'thumbnailUrl', ${videos.thumbnailUrl}
      )`,
      topic: sql<any>`CASE WHEN ${topics.id} IS NOT NULL THEN json_build_object(
        'id', ${topics.id},
        'name', ${topics.name},
        'description', ${topics.description}
      ) ELSE NULL END`
    })
      .from(reviews)
      .leftJoin(videos, eq(reviews.videoId, videos.id))
      .leftJoin(topics, eq(reviews.topicId, topics.id))
      .where(eq(reviews.id, id))
      .limit(1)

    if (result.length === 0) return null

    const review = result[0]
    return {
      ...review,
      video: review.video.videoUrl ? review.video : undefined,
      topic: review.topic || undefined
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

  // Analyze and assign topic to a review
  async analyzeAndAssignTopic(reviewId: number) {
    try {
      // Get the review including video transcript
      const review = await this.getReviewById(reviewId)
      if (!review) {
        throw new Error('Review not found')
      }

      // If topicId is already assigned, skip analysis
      if (review.topicId) {
        console.log(`Review ${reviewId} already has topic assigned: ${review.topicId}`)
        return review
      }

      // Get video with transcript if available
      const video = await db.query.videos.findFirst({
        where: eq(videos.id, review.videoId),
        columns: {
          transcript: true
        }
      })

      // Get all other reviews for potential topic matching
      const allReviews = await db.select({
        id: reviews.id,
        title: reviews.title,
        description: reviews.description,
        pros: reviews.pros,
        cons: reviews.cons,
        tags: reviews.tags,
        topicId: reviews.topicId,
        topic: sql<any>`CASE WHEN ${topics.id} IS NOT NULL THEN json_build_object(
          'id', ${topics.id},
          'name', ${topics.name}
        ) ELSE NULL END`
      })
        .from(reviews)
        .leftJoin(topics, eq(reviews.topicId, topics.id))
        .where(
          sql`${reviews.id} != ${reviewId}
          AND ${reviews.status} != 'deleted'
          AND ${reviews.status} != 'archived'`
        )

      // Prepare content for analysis
      const content = {
        title: review.title || '',
        description: review.description || '',
        transcript: video?.transcript || '',
        otherReviews: allReviews.map(r => ({
          title: r.title || '',
          description: r.description || '',
          topic: r.topic?.name
        }))
      }

      // Get topic suggestion from OpenAI
      const suggestedTopic = await this.determineTopic(content)
      if (!suggestedTopic) {
        console.log(`No topic could be determined for review ${reviewId}`)
        return review
      }

      // Check if topic exists
      let topic = await db.select()
        .from(topics)
        .where(eq(topics.name, suggestedTopic))
        .limit(1)
        .then(results => results[0])

      // Create topic if it doesn't exist
      if (!topic) {
        const [newTopic] = await db.insert(topics)
          .values({
            name: suggestedTopic,
            description: '' // Leave blank as specified
          })
          .returning()
        topic = newTopic
      }

      // Update review with topic
      const [updatedReview] = await db.update(reviews)
        .set({
          topicId: topic.id,
          updatedAt: new Date()
        })
        .where(eq(reviews.id, reviewId))
        .returning()

      return updatedReview
    } catch (error) {
      console.error('Error in analyzeAndAssignTopic:', error)
      throw error
    }
  }

  // Helper method to determine topic using OpenAI
  private async determineTopic(content: {
    title: string,
    description: string,
    transcript: string,
    otherReviews: Array<{
      title: string,
      description: string,
      topic?: string
    }>
  }): Promise<string | null> {
    try {
      const systemPrompt = "Given a review's content and a list of other reviews with their topics, determine the most appropriate topic name for the current review. If the review seems similar to an existing topic, use that topic name. Otherwise, provide a new concise topic name (e.g., 'iPhone 15', 'Tesla Model Y', 'Sony WH-1000XM5'). Respond with ONLY the topic name."

      const userPrompt = `Current Review:
Title: ${content.title}
Description: ${content.description}
Transcript: ${content.transcript}

Other Reviews:
${content.otherReviews.map(r => `- Title: ${r.title}
  Description: ${r.description}
  Topic: ${r.topic || 'unassigned'}`).join('\n\n')}

Remember to respond with ONLY the topic name.`

      const response = await this.openai.completions.create({
        model: 'gpt-3.5-turbo-instruct',
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        temperature: 0.3,
        max_tokens: 50,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })

      return response.choices[0].text?.trim() || null
    } catch (error) {
      console.error('Error determining topic:', error)
      return null
    }
  }

  private async updateTopicMarketSummary(topicId: number) {
    if (!topicId) return;

    try {
      // Get all reviews for this topic with their video transcripts
      const topicReviews = await db.select({
        title: reviews.title,
        description: reviews.description,
        pros: reviews.pros,
        cons: reviews.cons,
        transcript: videos.transcript
      })
        .from(reviews)
        .leftJoin(videos, eq(reviews.videoId, videos.id))
        .where(eq(reviews.topicId, topicId))

      if (topicReviews.length === 0) return;

      const topic = await topicsService.getTopicById(topicId);
      if (!topic) return;

      // Use the same format as generateMarketSummary from openai.ts
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: "system",
            content: `You are an expert market analyst specializing in tech products.
              Your task is to analyze multiple reviews of products in the same category/topic and provide a comprehensive market summary.
              Focus on identifying common patterns, overall pros and cons, market trends, and target audience.
              Pay special attention to the video transcripts as they contain detailed information about the product.
              The response must follow this exact JSON structure:
              {
                "summary": "A comprehensive 2-3 paragraph market analysis",
                "overallPros": ["Common advantage 1", "Common advantage 2", ...],
                "overallCons": ["Common disadvantage 1", "Common disadvantage 2", ...],
                "marketTrends": [
                  {
                    "trend": "Name of trend",
                    "description": "Brief description of the trend"
                  }
                ],
                "recommendedAudience": ["Audience type 1", "Audience type 2", ...]
              }`
          },
          {
            role: "user",
            content: `Please analyze these reviews for ${topic.name} and provide a market summary. Pay special attention to the video transcripts as they contain detailed product information:\n\n${JSON.stringify(topicReviews, null, 2)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('OpenAI response did not contain any content');
      }

      const marketSummary = JSON.parse(content);

      // Add lastUpdated field to match MarketSummary type
      const summaryWithTimestamp = {
        ...marketSummary,
        lastUpdated: new Date().toISOString()
      };

      // Update topic with new market summary
      await topicsService.updateMarketSummary(topicId, summaryWithTimestamp);
    } catch (error) {
      console.error('Error updating topic market summary:', error);
      // Don't throw error to prevent disrupting the review creation/update process
    }
  }
}

export default new ReviewsService() 