import { Router, Request, Response } from 'express'
import { UIGeneratorService, GenerateUIRequest } from '../llm/ui-generator.js'
import { validateGeneratedCode } from '../security/sanitizer.js'
import { logger } from '../utils/logger.js'

const router = Router()
const uiGeneratorService = new UIGeneratorService()

// POST /api/generate-ui - 生成UI代码
router.post('/generate-ui', async (req: Request, res: Response) => {
  try {
    const requestData: GenerateUIRequest = req.body
    
    // 验证请求参数
    if (!requestData.message || typeof requestData.message !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Message parameter is required and must be a string'
      })
    }
    
    // 记录请求日志
    logger.info('Generating UI for request', {
      message: requestData.message.substring(0, 100) + (requestData.message.length > 100 ? '...' : ''),
      componentType: requestData.componentType || 'auto'
    })
    
    // 生成UI代码
    const response = await uiGeneratorService.generateUI(requestData)
    
    // 验证生成的代码
    const validation = validateGeneratedCode(response.uiCode)
    if (!validation.isValid) {
      logger.warn('Generated UI code failed validation', { errors: validation.errors })
      return res.status(500).json({
        error: 'Generated UI code failed security validation',
        message: '生成的UI代码存在安全风险，请重试'
      })
    }
    
    // 返回成功响应
    logger.info('UI generation completed successfully', {
      componentType: response.componentType,
      codeLength: response.uiCode.length
    })
    
    res.status(200).json({
      success: true,
      ...response
    })
    
  } catch (error) {
    logger.error('Error generating UI', { error: error instanceof Error ? error.message : 'Unknown error' })
    
    res.status(500).json({
      error: 'Internal server error',
      message: '生成UI时发生错误，请稍后重试',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    })
  }
})

// GET /api/components - 获取支持的组件类型
router.get('/components', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    components: [
      { type: 'auto', name: '自动检测' },
      { type: 'form', name: '表单' },
      { type: 'table', name: '表格' },
      { type: 'card', name: '卡片' },
      { type: 'chart', name: '图表' },
      { type: 'navigation', name: '导航菜单' },
      { type: 'modal', name: '模态框' },
      { type: 'dashboard', name: '仪表盘' }
    ]
  })
})

export default router