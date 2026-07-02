import { Router } from 'express'
import { generateToken, authMiddleware } from '../middleware/auth.js'

const router = Router()

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'chimneyM'

router.post('/login', (req, res) => {
  const { password } = req.body
  if (password === ADMIN_PASSWORD) {
    const token = generateToken()
    return res.json({ token, user: 'chimneyM' })
  }
  return res.status(401).json({ error: '密码错误' })
})

router.get('/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, user: 'chimneyM' })
})

export default router
