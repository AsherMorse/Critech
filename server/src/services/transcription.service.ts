import { db } from '../db/client'
import { videos } from '../db/schema'
import { eq } from 'drizzle-orm'
import { OpenAI } from 'openai'

class TranscriptionService {
    private openai: OpenAI

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        })
    }

    // Start transcription process for a video
    async startTranscription(videoId: number, audioUrl: string) {
        try {
            // Update status to processing
            await db.update(videos)
                .set({ transcriptStatus: 'processing' })
                .where(eq(videos.id, videoId))
                .execute()

            // Create transcription using Whisper API
            const transcription = await this.openai.audio.transcriptions.create({
                file: await this.fetchAudioFile(audioUrl),
                model: 'whisper-1',
            })

            // Generate summary using GPT-4 Turbo
            const summary = await this.generateSummary(transcription.text)

            // Update video with transcript and summary
            const [video] = await db.update(videos)
                .set({
                    transcript: transcription.text,
                    summary: summary,
                    transcriptStatus: 'completed'
                })
                .where(eq(videos.id, videoId))
                .returning()

            return video
        } catch (error) {
            // Update status to failed if there's an error
            await db.update(videos)
                .set({ transcriptStatus: 'failed' })
                .where(eq(videos.id, videoId))
                .execute()

            throw error
        }
    }

    // Generate summary using GPT-4 Turbo
    private async generateSummary(transcript: string): Promise<string> {
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: "system",
                    content: "You are an expert at summarizing audio transcripts, able to extract key points and present them in a concise and energetic manner."
                },
                {
                    role: "user",
                    content: `Please provide a concise summary of this transcript, highlighting the main points and key takeaways:\n\n${transcript}`
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        })

        return response.choices[0].message.content || ''
    }

    // Helper method to fetch audio file from URL
    private async fetchAudioFile(url: string): Promise<File> {
        // Convert to mp3 using Cloudinary's format transformation
        const mp3Url = url.replace('/upload/', '/upload/f_mp3/')
        console.log('Converting to MP3:', mp3Url)

        const response = await fetch(mp3Url)
        const blob = await response.blob()
        return new File([blob], 'audio.mp3', { type: 'audio/mp3' })
    }

    // Get transcription status and transcript for a video
    async getTranscription(videoId: number) {
        const video = await db.query.videos.findFirst({
            where: eq(videos.id, videoId),
            columns: {
                transcript: true,
                summary: true,
                transcriptStatus: true
            }
        })

        return video
    }
}

export default new TranscriptionService() 