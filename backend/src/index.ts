import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import generateUIRoutes from './routes/generate-ui.js'

// 加载环境变量
dotenv.config({ path: '../../config/.env' })

// 创建Express应用
const app = express()
const PORT = process.env.PORT || 5000

// 配置中间件
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))

// 配置路由
app.use('/api', generateUIRoutes)

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'AUIFlow Backend is running' })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 AUIFlow Backend is running on http://localhost:${PORT}`)
  console.log(`📡 Health check: http://localhost:${PORT}/health`)
  console.log(`🔧 API endpoints: http://localhost:${PORT}/api`)
})