import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import authRoutes from './routes/auth.js'
import postRoutes from './routes/posts.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5179', credentials: true }))
app.use(express.json({ limit: '5mb' }))

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)

// Serve static frontend in production
const distPath = join(__dirname, '..', 'dist')
app.use(express.static(distPath))
// SPA fallback
const sendIndex = (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(join(distPath, 'index.html'))
  }
}
app.use(sendIndex)

app.listen(PORT, () => {
  console.log('Blog server running at http://localhost:' + PORT)
})
