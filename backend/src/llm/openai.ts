import { OpenAI } from 'openai'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

let openaiClient: OpenAI | null = null

export const openaiConfig = {
  model: process.env.OPENAI_MODEL || 'gpt-4o',
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
}

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    
    console.log('Initializing OpenAI client with baseURL:', baseURL)
    
    openaiClient = new OpenAI({
      apiKey,
      baseURL,
      timeout: 60000,
      maxRetries: 3,
    })
  }
  
  return openaiClient
}

export function resetOpenAIClient(): void {
  openaiClient = null
}
