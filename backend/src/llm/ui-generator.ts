import { getOpenAIClient, openaiConfig } from './openai.js'
import { sanitizeHtml } from '../security/sanitizer.js'

export interface GenerateUIRequest {
  message: string
  context?: string[]
  componentType?: string
}

export interface GenerateUIResponse {
  message: string
  uiCode: string
  componentType: string
  generatedAt: Date
}

export class UIGeneratorService {
  async generateUI(request: GenerateUIRequest): Promise<GenerateUIResponse> {
    try {
      const { message, context = [], componentType = 'auto' } = request

      const client = getOpenAIClient()

      const systemPrompt = this.getSystemPrompt()
      const userPrompt = this.buildPrompt(message, context, componentType)

      const response = await client.chat.completions.create({
        model: openaiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: openaiConfig.maxTokens,
        temperature: openaiConfig.temperature,
      })

      console.log('OpenAI response:', JSON.stringify(response, null, 2))

      const aiResponse = response.choices?.[0]?.message?.content || ''

      if (!aiResponse) {
        throw new Error('AI response is empty')
      }

      const { explanation, uiCode } = this.parseAIResponse(aiResponse)
      const sanitizedCode = sanitizeHtml(uiCode)

      return {
        message: explanation || 'UI生成完成',
        uiCode: sanitizedCode,
        componentType: this.detectComponentType(sanitizedCode, componentType),
        generatedAt: new Date()
      }
    } catch (error) {
      console.error('Error generating UI:', error)
      throw new Error('Failed to generate UI: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  private buildPrompt(message: string, context: string[], componentType: string): string {
    const contextStr = context.length > 0 
      ? `\n\n对话历史:\n${context.map((msg, idx) => `${idx + 1}. ${msg}`).join('\n')}`
      : ''
    
    const typeHint = componentType !== 'auto' 
      ? `\n\n请优先生成${componentType}类型的组件。` 
      : ''
    
    return `根据用户需求生成一个美观、功能完整的HTML界面代码。用户需求是：${message}${contextStr}${typeHint}\n\n请严格按照以下格式输出：\n1. 先提供一段中文说明（50字以内）\n2. 然后提供完整的HTML/CSS/JS代码\n\n示例输出：\n这是一个简单的登录表单\n<!DOCTYPE html>\n<html>\n<head>\n<style>\n/* CSS样式 */\n</style>\n</head>\n<body>\n<!-- HTML内容 -->\n<script>\n// JavaScript代码\n</script>\n</body>\n</html>`
  }

  private getSystemPrompt(): string {
    return `你是一个专业的UI设计师和前端开发工程师，擅长根据用户需求生成美观、功能完整的HTML/CSS/JS代码。

要求：
1. 生成的界面必须美观、响应式，适配不同屏幕尺寸
2. CSS必须内联在HTML中，使用现代CSS特性（如Flexbox、Grid、CSS变量等）
3. JavaScript必须简洁高效，实现必要的交互功能
4. 代码必须完整、可直接运行
5. 避免使用外部依赖，所有资源必须内联
6. 界面必须符合现代设计美学，色彩搭配合理
7. 代码结构清晰，注释适当
8. 使用现代Web标准和最佳实践
9. 确保界面在不同浏览器中都能正常显示
10. 添加适当的动画和过渡效果，提升用户体验

设计原则：
- 保持简洁，避免过度设计
- 使用合适的间距和对齐
- 选择易读的字体和字号
- 使用一致的颜色方案
- 确保良好的对比度和可访问性
- 添加有意义的交互反馈

请按照用户要求的格式输出，先提供中文说明，然后是完整的HTML代码。`
  }

  private parseAIResponse(response: string): { uiCode: string; explanation: string } {
    const parts = response.split(/<!DOCTYPE html>|<html>|<head>/)
    
    if (parts.length < 2) {
      const codeMatch = response.match(/```(html|\s*)([\s\S]*?)```/)
      if (codeMatch) {
        return {
          explanation: parts[0].trim() || 'UI生成完成',
          uiCode: this.wrapInHTML(codeMatch[2].trim())
        }
      }
      return {
        explanation: 'UI生成完成',
        uiCode: this.wrapInHTML(response)
      }
    }
    
    const explanation = parts[0].trim()
    const codeStart = response.indexOf(parts[0]) + parts[0].length
    let uiCode = response.substring(codeStart).trim()
    
    if (!uiCode.startsWith('<!DOCTYPE html>') && !uiCode.startsWith('<html>')) {
      uiCode = this.wrapInHTML(uiCode)
    }
    
    return {
      explanation: explanation || 'UI生成完成',
      uiCode
    }
  }

  private wrapInHTML(content: string): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated UI</title>
</head>
<body>
${content}
</body>
</html>`
  }

  private detectComponentType(code: string, requestedType: string): string {
    if (requestedType !== 'auto') return requestedType
    
    if (code.includes('form') && (code.includes('input') || code.includes('button'))) {
      return 'form'
    }
    if (code.includes('table') || code.includes('tr') || code.includes('td')) {
      return 'table'
    }
    if (code.includes('chart') || code.includes('graph') || code.includes('canvas')) {
      return 'chart'
    }
    if (code.includes('card') && code.includes('div')) {
      return 'card'
    }
    if (code.includes('menu') || code.includes('nav') || code.includes('ul')) {
      return 'navigation'
    }
    
    return 'general'
  }
}
