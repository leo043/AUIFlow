import { OpenAI } from 'openai'

// 初始化OpenAI客户端
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 2,
})

// 配置默认参数
export const openaiConfig = {
  model: process.env.OPENAI_MODEL || 'gpt-4',
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
}