import { pgTable, serial, text, varchar, jsonb, timestamp, integer, foreignKey, boolean } from 'drizzle-orm/pg-core'

// Review status type
export type ReviewStatus = 'video_uploaded' | 'draft' | 'in_review' | 'published' | 'archived' | 'deleted'

// Videos table to store video metadata
export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  cloudinaryId: text('cloudinary_id').notNull(), // Cloudinary resource ID
  publicId: text('public_id').notNull(), // Cloudinary public ID for URLs
  duration: integer('duration'),
  videoUrl: text('video_url'),
  status: varchar('status', { length: 50 }).notNull().default('ready'), // Cloudinary handles processing
  metadata: jsonb('metadata').default({
    format: null,         // video format (mp4, webm, etc)
    codec: null,          // video codec used
    bitRate: null,        // video bitrate
    width: null,          // video width
    height: null,         // video height
    fps: null,           // frames per second
    audioCodec: null,     // audio codec
    audioFrequency: null, // audio sample rate
    aspectRatio: null,    // video aspect ratio
    rotation: null,       // video rotation
    quality: null        // quality score
  }),
  secure: boolean('secure').default(true), // Use HTTPS URLs
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Reviews table with required reference to videos
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  videoId: integer('video_id').notNull().references(() => videos.id), // Make videoId required
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