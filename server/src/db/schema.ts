import { pgTable, serial, text, varchar, jsonb, timestamp, integer, boolean } from 'drizzle-orm/pg-core'

// Review status type
export type ReviewStatus = 'video_uploaded' | 'draft' | 'in_review' | 'published' | 'archived' | 'deleted'

// Transcript status type
export type TranscriptStatus = 'pending' | 'processing' | 'completed' | 'failed'

// Topics table to store product/topic information
export const topics = pgTable('topics', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Videos table to store video metadata
export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  cloudinaryId: text('cloudinary_id').notNull(), // Cloudinary resource ID
  publicId: text('public_id').notNull(), // Cloudinary public ID for URLs
  duration: integer('duration'),
  videoUrl: text('video_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  status: varchar('status', { length: 50 }).notNull().default('ready'), // Cloudinary handles processing
  metadata: jsonb('metadata').$type<{
    format: string
    codec: string | null
    bitRate: number | null
    width: number | null
    height: number | null
    fps: number | null
    audioCodec: string | null
    audioFrequency: number | null
    aspectRatio: string | null
    rotation: number | null
    quality: number | null
  }>(),
  // New transcript-related columns
  transcript: text('transcript'),  // Store the actual transcript text
  summary: text('summary'),  // Store the AI-generated summary
  transcriptStatus: varchar('transcript_status', { length: 50 }).notNull().default('pending').$type<TranscriptStatus>(), // Track transcription status
  secure: boolean('secure').default(true), // Use HTTPS URLs
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Reviews table with required reference to videos
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  videoId: integer('video_id').notNull().references(() => videos.id),
  topicId: integer('topic_id').references(() => topics.id), // Optional reference to topics
  ownerId: text('owner_id').notNull(), // User ID from Supabase auth
  title: varchar('title', { length: 255 }),  // Make title optional initially
  description: text('description'),          // Make description optional initially
  pros: jsonb('pros'),
  cons: jsonb('cons'),
  altLinks: jsonb('alt_links'),
  tags: jsonb('tags'),
  status: varchar('status', { length: 50 }).notNull().default('video_uploaded'),
  statusHistory: jsonb('status_history').default([]), // Track status changes
  isVideoReady: boolean('is_video_ready').default(false),
  publishedAt: timestamp('published_at'), // When the review was published
  archivedAt: timestamp('archived_at'), // When the review was archived
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}) 