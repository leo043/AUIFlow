import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import generateUIRoutes from './routes/generate-ui.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api', generateUIRoutes)

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'AUIFlow Backend is running' })
})

app.listen(PORT, () => {
  console.log(`🚀 AUIFlow Backend is running on http://localhost:${PORT}`)
  console.log(`📡 Health check: http://localhost:${PORT}/health`)
  console.log(`🔧 API endpoints: http://localhost:${PORT}/api`)
})
