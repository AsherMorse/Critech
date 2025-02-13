import { Router } from 'express'
import { Request, Response, NextFunction } from 'express'
import { OpenAI } from 'openai'
import { verifyAuth } from '../middleware/auth'
import { RequestHandler } from 'express'

const router = Router()

// Apply auth middleware to all routes
router.use(verifyAuth as RequestHandler)

// Interface for the request bodies
interface GenerateProsConsRequest {
  transcript: string;
}

interface GenerateProsConsResponse {
  pros: string[];
  cons: string[];
}

interface GenerateTagsRequest {
  transcript: string;
  title?: string;
  description?: string;
}

interface GenerateTagsResponse {
  tags: string[];
}

interface GenerateAltLinksRequest {
  transcript: string;
  title?: string;
  description?: string;
}

interface GenerateAltLinksResponse {
  altLinks: Array<{ name: string; url: string; }>;
}

interface Review {
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  transcript?: string;
}

interface GenerateMarketSummaryRequest {
  topicName: string;
  reviews: Review[];
}

interface MarketSummaryResponse {
  summary: string;
  overallPros: string[];
  overallCons: string[];
  marketTrends: {
    trend: string;
    description: string;
  }[];
  priceRange: {
    min: string;
    max: string;
    note: string;
  };
  recommendedAudience: string[];
}

// Simple test endpoint
router.get('/list-models', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    const models = await openai.models.list()

    res.json({
      status: 'success',
      message: 'OpenAI connection successful',
      availableModels: models.data.map(model => model.id)
    })
  } catch (error) {
    next(error)
  }
})

// Generate pros and cons from transcript
const generateProsCons: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { transcript } = req.body as GenerateProsConsRequest

    if (!transcript || transcript.trim().length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'Transcript is required'
      })
      return
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    const systemPrompt = `You are an expert at analyzing tech review video transcripts and extracting key pros and cons. 
        Your task is to analyze the given review transcript and provide a concise list of pros and cons.
        Focus on the most important and impactful points.
        Limit the response to at most 5 pros and 5 cons.
        Each point should be clear and specific.
        Only respond with the pros and cons, no other text.
        If there are no pros or cons, respond with an empty array.
        The only response should be the JSON object, either empty or containing the pros and cons.
        The response should be in JSON format.
        The JSON should be formatted as follows:
        {
            "pros": ["pro1", "pro2", "pro3", "pro4", "pro5"],
            "cons": ["con1", "con2", "con3", "con4", "con5"]
        }`

    const userPrompt = `Please analyze this review transcript and provide the pros and cons:\n\n${transcript}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    })

    const response = JSON.parse(completion.choices[0].message.content || '{}') as GenerateProsConsResponse

    if (!Array.isArray(response.pros) || !Array.isArray(response.cons)) {
      throw new Error('Invalid response format from OpenAI')
    }

    res.json({
      status: 'success',
      data: {
        pros: response.pros,
        cons: response.cons
      }
    })
  } catch (error) {
    console.error('Error generating pros and cons:', error)
    next(error)
  }
}

// Generate tags from transcript and metadata
const generateTags: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { transcript, title, description } = req.body as GenerateTagsRequest

    if (!transcript || transcript.trim().length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'Transcript is required'
      })
      return
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    const systemPrompt = `You are an expert at analyzing tech review content and generating relevant tags.
        Your task is to analyze the given content and generate appropriate tags.
        Focus on key technologies, brands, product categories, and features mentioned.
        Generate between 3-7 tags.
        Tags should be single words or short phrases, all lowercase.
        Common tags might include: gaming, productivity, apple, android, laptop, budget, etc.
        The response should be in JSON format with only the tags array.
        Example response format:
        {
            "tags": ["gaming", "4k", "premium", "desktop"]
        }`

    const userPrompt = `Please generate relevant tags for this tech review:\n\nTitle: ${title || 'N/A'}\nDescription: ${description || 'N/A'}\nTranscript: ${transcript}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    })

    const response = JSON.parse(completion.choices[0].message.content || '{}') as GenerateTagsResponse

    if (!Array.isArray(response.tags)) {
      throw new Error('Invalid response format from OpenAI')
    }

    res.json({
      status: 'success',
      data: {
        tags: response.tags
      }
    })
  } catch (error) {
    console.error('Error generating tags:', error)
    next(error)
  }
}

// Generate alternative links from transcript and metadata
const generateAltLinks: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { transcript, title, description } = req.body as GenerateAltLinksRequest

    if (!transcript || transcript.trim().length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'Transcript is required'
      })
      return
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    const systemPrompt = `You are an expert at analyzing tech reviews and suggesting relevant alternative resources.
        Your task is to suggest 2-4 alternative links that would be helpful for users interested in this product.
        Each link should have a descriptive name explaining what it is.
        Always include actual URLs, not just the site name but an actual product page.
        Follow the example link style below.
        The response should be in JSON format.
        Example response format:
        {
            "altLinks": [
                {"name": "Amazon Product Page", "url": "https://www.amazon.com/dp/B08N5L5R3Y"},
                {"name": "CNET Full Review", "url": "https://www.cnet.com/tech/computing/acer-nitro-5-review/"},
                {"name": "Best Buy Store Page", "url": "https://www.bestbuy.com/site/acer-nitro-5-gaming-laptop-intel-core-i5-16gb-memory-1tb-ssd-nvidia-geforce-rtx-3060-165hz-15-6-inch-full-hd-1920-x-1080-display-black/6429400.p?skuId=6429400"}
            ]
        }`

    const userPrompt = `Please suggest alternative links for this tech review:\n\nTitle: ${title || 'N/A'}\nDescription: ${description || 'N/A'}\nTranscript: ${transcript}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    })

    const response = JSON.parse(completion.choices[0].message.content || '{}') as GenerateAltLinksResponse

    if (!Array.isArray(response.altLinks)) {
      throw new Error('Invalid response format from OpenAI')
    }

    res.json({
      status: 'success',
      data: {
        altLinks: response.altLinks
      }
    })
  } catch (error) {
    console.error('Error generating alternative links:', error)
    next(error)
  }
}

// Generate market summary from multiple reviews
const generateMarketSummary: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { topicName, reviews } = req.body as GenerateMarketSummaryRequest

    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'At least one review is required'
      })
      return
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    const systemPrompt = `You are an expert market analyst specializing in tech products.
        Your task is to analyze multiple reviews of products in the same category/topic and provide a comprehensive market summary.
        Focus on identifying common patterns, overall pros and cons, market trends, and target audience.
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

    const userPrompt = `Please analyze these reviews for ${topicName} and provide a market summary:\n\n${JSON.stringify(reviews, null, 2)}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })

    const response = JSON.parse(completion.choices[0].message.content || '{}') as MarketSummaryResponse

    // Validate response structure
    if (!response.summary || !Array.isArray(response.overallPros) || !Array.isArray(response.overallCons)) {
      throw new Error('Invalid response format from OpenAI')
    }

    res.json({
      status: 'success',
      data: response
    })
  } catch (error) {
    console.error('Error generating market summary:', error)
    next(error)
  }
}

router.post('/generate-pros-cons', generateProsCons)
router.post('/generate-tags', generateTags)
router.post('/generate-alt-links', generateAltLinks)
router.post('/generate-market-summary', generateMarketSummary)

export default router