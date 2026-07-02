import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'chimneyM-blog-secret-key-2026'

export function generateToken() {
  return jwt.sign({ user: 'chimneyM' }, JWT_SECRET, { expiresIn: '7d' })
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' })
  }
  try {
    jwt.verify(header.slice(7), JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: '登录已过期' })
  }
}
