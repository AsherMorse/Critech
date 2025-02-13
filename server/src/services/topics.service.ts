import { db } from '../db/client'
import { topics, reviews } from '../db/schema'
import { eq, sql } from 'drizzle-orm'

// DTO for creating a topic
export interface CreateTopicDto {
  name: string
  description?: string
}

// DTO for updating a topic
export interface UpdateTopicDto {
  name?: string
  description?: string
}

class TopicsService {
  async createTopic(data: CreateTopicDto) {
    const newTopic = await db.insert(topics)
      .values({
        name: data.name,
        description: data.description
      })
      .returning()

    return newTopic[0]
  }

  async getAllTopics() {
    return await db.select().from(topics)
  }

  async getTopicById(id: number) {
    const result = await db.select()
      .from(topics)
      .where(eq(topics.id, id))

    return result[0] || null
  }

  async updateTopic(id: number, data: UpdateTopicDto) {
    const result = await db.update(topics)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(topics.id, id))
      .returning()

    return result[0] || null
  }

  async deleteTopic(id: number) {
    const result = await db.delete(topics)
      .where(eq(topics.id, id))
      .returning()

    return result[0] || null
  }

  async getTopicByName(name: string) {
    const result = await db.select()
      .from(topics)
      .where(eq(topics.name, name))

    return result[0] || null
  }

  async createTopicsFromExistingTags() {
    // Get all distinct tags from reviews
    const distinctTagsQuery = await db.select({
      tag: sql<string>`distinct jsonb_array_elements_text(${reviews.tags})`
    }).from(reviews)

    const createdTopics = []

    // Process each distinct tag
    for (const { tag } of distinctTagsQuery) {
      // Skip if tag is empty or null
      if (!tag) continue

      // Check if topic already exists
      const existingTopic = await this.getTopicByName(tag)
      if (existingTopic) continue

      // Create new topic from tag
      const newTopic = await this.createTopic({
        name: tag,
        description: '' // Leave description blank initially as specified
      })

      createdTopics.push(newTopic)
    }

    return createdTopics
  }
}

// Export singleton instance
export const topicsService = new TopicsService() 