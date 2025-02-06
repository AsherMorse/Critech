# API Documentation

Base URL: `localhost:3000/api/`

## Table of Contents

### Core
- [Root Endpoint](#root-endpoint)
- [Health Check](#health-check)
- [Authentication](#authentication)

### Videos
- [Create Video Record](#create-video-record)
- [Direct Server Upload](#direct-server-upload)
- [Get Upload Signature](#get-upload-signature)
- [Cloudinary Webhook](#cloudinary-webhook-internal)
- [Cloudinary Configuration](#cloudinary-configuration)

### Reviews
- [Get All Reviews](#get-all-reviews)
- [Get Review by ID](#get-review-by-id)
- [Create Review from Video](#create-review-from-video)
- [Update Review](#update-review)
- [Delete Review](#delete-review)
- [Review Status Transitions](#review-status-transitions)

### Common
- [Error Responses](#error-responses)
- [CORS](#cors)
- [Response Formats](#common-response-formats)
- [Resources](#resources)
- [Query Parameters](#query-parameters)
- [Headers](#common-headers)
- [Status Codes](#status-codes)
- [Rate Limiting](#rate-limiting)
- [Data Formats](#data-formats)
- [Versioning](#versioning)

## Root Endpoint

```http
GET /
```

Response:
```ts
{
  message: 'Welcome to Critech API'
}
```

## Health Check

```http
GET /health
```

Response:
```ts
{
  status: 'ok',
  timestamp: string,  // ISO 8601 format
  version: string    // Semantic version
}
```

## Authentication
```http
Authorization: Bearer <jwt_token>
```

## Video Endpoints

### Create Video Record
```http
POST /videos
Content-Type: application/json
```

Request:
```ts
{
  cloudinaryId: string
  publicId: string
  duration: number
  videoUrl: string
  metadata: {
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
  }
}
```

Response:
```ts
{
  id: number
  cloudinaryId: string
  publicId: string
  duration: number
  videoUrl: string
  status: string
  metadata: {
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
  }
  secure: boolean
  createdAt: string
  updatedAt: string
}
```

### Direct Server Upload
```http
POST /videos/upload
Content-Type: multipart/form-data
```

Request:
```ts
{
  video: File  // Video file (mp4, webm, mov, avi)
}
```

Response:
```ts
{
  message: string,
  video: {
    id: number
    cloudinaryId: string
    publicId: string
    duration?: number
    videoUrl: string
    status: string
    metadata: {
      format?: string
      codec?: string
      bitRate?: number
      width?: number
      height?: number
      fps?: number
      audioCodec?: string
      audioFrequency?: number
      aspectRatio?: string
      rotation?: number
      quality?: number
    }
    secure: boolean
    createdAt: string
    updatedAt: string
  },
  review: {
    id: number
    videoId: number
    title?: string
    description?: string
    pros?: string[]
    cons?: string[]
    altLinks?: string[]
    tags?: string[]
    status: 'video_uploaded'
    statusHistory: Array<{
      status: string
      timestamp: string
    }>
    isVideoReady: boolean
    createdAt: string
    updatedAt: string
  }
}
```

### Get Upload Signature
For secure client-side Cloudinary upload. This endpoint provides the necessary credentials and signature for direct-to-Cloudinary uploads.

```http
GET /videos/signature
```

Response:
```ts
{
  timestamp: number,        // Unix timestamp for signature validation
  signature: string,       // SHA-256 signature for upload authentication
  cloudName: string,      // Your Cloudinary cloud name
  apiKey: string,        // Your Cloudinary API key
  uploadPreset: 'review_video_upload'  // Preset with video processing config
}
```

#### Client-Side Upload Example
```typescript
// 1. Get upload credentials
const getSignature = async () => {
  const response = await fetch('/api/videos/signature')
  return await response.json()
}

// 2. Prepare form data for Cloudinary
const prepareUpload = (file: File, { cloudName, apiKey, signature, timestamp, uploadPreset }) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', apiKey)
  formData.append('timestamp', timestamp)
  formData.append('signature', signature)
  formData.append('upload_preset', uploadPreset)
  return formData
}

// 3. Upload to Cloudinary
const uploadToCloudinary = async (file: File) => {
  const credentials = await getSignature()
  const formData = prepareUpload(file, credentials)
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${credentials.cloudName}/video/upload`,
    {
      method: 'POST',
      body: formData
    }
  )
  
  return await response.json()
}
```

#### Upload Process
1. Client requests upload signature from your server
2. Server generates a signed request using your Cloudinary secret
3. Client uses the signature to upload directly to Cloudinary
4. Cloudinary processes the video according to the preset configuration
5. Cloudinary sends a webhook notification to your server
6. Server creates video and review records
7. Client can poll or receive websocket updates for processing status

#### Security Features
- Signatures expire after timestamp + 1 hour
- Each signature is unique to the upload parameters
- Upload presets restrict:
  - File types (mp4, webm, mov, avi)
  - Maximum file size
  - Processing options
  - Storage location
  - Access control

#### Error Handling
```typescript
{
  error: {
    code: string,
    message: string,
    details?: {
      signature?: string,    // Invalid or expired signature
      timestamp?: string,    // Invalid or expired timestamp
      preset?: string,      // Invalid or missing upload preset
      credentials?: string  // Invalid or missing API credentials
    }
  }
}
```

Common Errors:
- 400: Invalid or expired signature
- 400: Invalid timestamp
- 401: Invalid API key
- 403: Invalid upload preset
- 500: Signature generation failed

### Cloudinary Webhook (Internal)
```http
POST /videos/webhook
Content-Type: application/json
```

Request:
```ts
{
  notification_type: 'upload' | 'eager'
  asset_id: string
  public_id: string
  version: number
  width: number
  height: number
  format: string
  resource_type: 'video'
  created_at: string
  bytes: number
  type: string
  url: string
  secure_url: string
  eager?: Array<{
    transformation: string
    width: number
    height: number
    bytes: number
    format: string
    url: string
    secure_url: string
  }>
  status?: string
  error?: {
    message: string
  }
}
```

Response (Upload):
```ts
{
  message: 'Video upload processed',
  video: Video,
  review: Review
}
```

Response (Processing):
```ts
{
  message: 'Video processing completed',
  video: Video,
  review: Review
}
```

### Cloudinary Configuration
The system automatically processes uploaded videos with the following configurations:

- **Storage**
  - Folder: `reviews/`
  - Allowed formats: mp4, webm, mov, avi
  - Secure URLs only

- **Video Processing**
  1. HLS Streaming (m3u8)
     - HD streaming profile
     - Adaptive quality
     - H.264 video codec
     - AAC audio codec

  2. HD Quality
     - 1920x1080 max resolution
     - Auto quality (good)
     - H.264 video codec
     - AAC audio codec

  3. SD Quality
     - 1280x720 max resolution
     - Auto quality (eco)
     - H.264 video codec
     - AAC audio codec

  4. Mobile Quality
     - 854x480 max resolution
     - Auto quality (low)
     - H.264 video codec
     - AAC audio codec

## Error Responses

```ts
{
  error: {
    code: string,
    message: string
  }
}
```

Common errors:
- 400: No video file provided
- 400: Invalid file format
- 413: File too large
- 500: Upload failed

## CORS

Allowed origins:
- `https://critech.ashermorse.org`
- `http://localhost:5173`

## Common Response Formats

### Success (200/201)
```ts
{
  data: object | object[],
  meta?: {
    pagination?: {
      page: number,
      limit: number,
      total: number
    }
  }
}
```

## Resources

### Videos
```ts
type Video = {
  id: number
  cloudinaryId: string
  publicId: string
  duration?: number
  videoUrl: string
  status: string
  metadata: {
    format?: string
    codec?: string
    bitRate?: number
    width?: number
    height?: number
    fps?: number
  }
  secure: boolean
  createdAt: string
  updatedAt: string
}
```

### Reviews
```ts
type Review = {
  id: number
  videoId: number
  title?: string
  description?: string
  pros?: string[]
  cons?: string[]
  altLinks?: string[]
  tags?: string[]
  status: 'video_uploaded' | 'draft' | 'in_review' | 'published' | 'archived' | 'deleted'
  statusHistory?: Array<{
    status: string
    timestamp: string
    note?: string
  }>
  isVideoReady: boolean
  publishedAt?: string
  archivedAt?: string
  createdAt: string
  updatedAt: string
}
```

## Query Parameters

### Pagination
- `page`: number (default: 1)
- `limit`: number (default: 20)

### Filtering
- `status`: string
- `tags`: string[]

### Sorting
- `sort`: string (format: `field:asc|desc`)

## Common Headers
```http
Content-Type: application/json
Accept: application/json
```

## Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 500: Server Error

## Rate Limiting

API requests are limited to:
- 100 requests per minute per IP address
- 1000 requests per hour per user

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Data Formats

- All timestamps are returned in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- All IDs are integers
- Boolean values are returned as `true` or `false`
- Arrays are returned as JSON arrays
- Objects are returned as JSON objects

## Versioning

The API version is included in the URL path:

```
/api/v1/resources
```

Current version: `v1`

## API Health Check

```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-03-21T12:00:00.000Z",
  "version": "1.0.0"
}
```

## Review Endpoints

### Get All Reviews
```http
GET /reviews
```

Response:
```ts
{
  data: Array<{
    id: number
    videoId: number
    title?: string
    description?: string
    pros?: string[]
    cons?: string[]
    altLinks?: string[]
    tags?: string[]
    status: 'video_uploaded' | 'draft' | 'in_review' | 'published' | 'archived' | 'deleted'
    statusHistory: Array<{
      status: string
      timestamp: string
    }>
    isVideoReady: boolean
    publishedAt?: string
    archivedAt?: string
    createdAt: string
    updatedAt: string
  }>
}
```

### Get Review by ID
```http
GET /reviews/:id
```

Response:
```ts
{
  id: number
  videoId: number
  title?: string
  description?: string
  pros?: string[]
  cons?: string[]
  altLinks?: string[]
  tags?: string[]
  status: 'video_uploaded' | 'draft' | 'in_review' | 'published' | 'archived' | 'deleted'
  statusHistory: Array<{
    status: string
    timestamp: string
  }>
  isVideoReady: boolean
  publishedAt?: string
  archivedAt?: string
  createdAt: string
  updatedAt: string
}
```

### Create Review from Video
```http
POST /reviews/from-video
Content-Type: application/json
```

Request:
```ts
{
  videoId: number  // ID of the uploaded video
}
```

Response:
```ts
{
  id: number
  videoId: number
  pros: []
  cons: []
  tags: []
  status: 'video_uploaded'
  statusHistory: [{
    status: 'video_uploaded'
    timestamp: string
  }]
  isVideoReady: boolean
  createdAt: string
  updatedAt: string
}
```

### Update Review
```http
PUT /reviews/:id
Content-Type: application/json
```

Request:
```ts
{
  title?: string
  description?: string
  pros?: string[]
  cons?: string[]
  tags?: string[]
  status?: 'video_uploaded' | 'draft' | 'in_review' | 'published' | 'archived' | 'deleted'
}
```

Response:
```ts
{
  id: number
  videoId: number
  title?: string
  description?: string
  pros?: string[]
  cons?: string[]
  altLinks?: string[]
  tags?: string[]
  status: 'video_uploaded' | 'draft' | 'in_review' | 'published' | 'archived' | 'deleted'
  statusHistory: Array<{
    status: string
    timestamp: string
  }>
  isVideoReady: boolean
  publishedAt?: string
  archivedAt?: string
  createdAt: string
  updatedAt: string
}
```

### Delete Review
```http
DELETE /reviews/:id
```

Response:
```ts
{
  message: 'Review deleted successfully'
}
```

#### Review Status Transitions
1. `video_uploaded`: Initial state when video is uploaded
2. `draft`: When title and description are first added
3. `in_review`: When submitted for review
4. `published`: When review is made public
5. `archived`: When review is archived
6. `deleted`: When review is marked for deletion

#### Error Responses
- 400: Invalid ID format
- 400: Missing required fields
- 404: Review not found
- 500: Server error 