import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  baseAlpha: number
  alpha: number
  twinkle: number
  twinkleSpeed: number
  colorIdx: number
}

type RGB = [number, number, number]

// 深色模式：明亮多色星空（冷蓝为主，少量青/紫/暖白点缀）
const DARK_COLORS: RGB[] = [
  [129, 140, 248], // indigo
  [129, 140, 248], // indigo（权重高）
  [96, 165, 250],  // blue
  [94, 234, 212],  // teal（少量）
  [196, 181, 253], // violet（少量）
  [254, 243, 199], // 暖白星（稀有）
]
// 浅色模式：深色实心点
const LIGHT_COLORS: RGB[] = [
  [37, 99, 235],  // blue-600
  [37, 99, 235],
  [79, 70, 229],  // indigo-600
  [14, 165, 233], // sky-500
]
const DARK_LINE: RGB = [129, 140, 248]
const LIGHT_LINE: RGB = [99, 102, 241]

const CONFIG = {
  maxDpr: 2,
  connectDistance: 140,
  mouseRadius: 160,
  mouseForce: 0.45,
  maxSpeed: 1.0,
  damping: 0.97,
  // 提高密度让星空更丰富
  particleDensity: 0.00018,
  minParticles: 60,
  maxParticles: 160,
  spriteSize: 64,
}

function readTheme(): 'dark' | 'light' {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let animId = 0
    let running = false
    let width = 0
    let height = 0
    let dpr = 1
    let theme = readTheme()

    const mouse = { x: -9999, y: -9999, active: false }

    // 预渲染发光精灵（深色模式用），每个颜色一张离屏 canvas
    const sprites: HTMLCanvasElement[] = []
    const buildSprites = (colors: RGB[]) => {
      sprites.length = 0
      for (const c of colors) {
        const s = document.createElement('canvas')
        s.width = CONFIG.spriteSize
        s.height = CONFIG.spriteSize
        const sc = s.getContext('2d')!
        const half = CONFIG.spriteSize / 2
        const g = sc.createRadialGradient(half, half, 0, half, half, half)
        g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},1)`)
        g.addColorStop(0.25, `rgba(${c[0]},${c[1]},${c[2]},0.5)`)
        g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`)
        sc.fillStyle = g
        sc.fillRect(0, 0, CONFIG.spriteSize, CONFIG.spriteSize)
        sprites.push(s)
      }
    }
    buildSprites(theme === 'dark' ? DARK_COLORS : LIGHT_COLORS)

    let particles: Particle[] = []

    const createParticles = () => {
      const area = width * height
      let count = Math.floor(area * CONFIG.particleDensity)
      count = Math.max(CONFIG.minParticles, Math.min(CONFIG.maxParticles, count))
      const isDark = theme === 'dark'
      const colorPool = isDark ? DARK_COLORS : LIGHT_COLORS
      const arr: Particle[] = []
      for (let i = 0; i < count; i++) {
        // 少数大亮星 + 多数小暗星，分层感；浅色模式下整体更大更亮保证白底可见
        const isBright = Math.random() < (isDark ? 0.18 : 0.25)
        arr.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          size: isDark
            ? isBright
              ? Math.random() * 1.4 + 1.6
              : Math.random() * 0.9 + 0.5
            : isBright
              ? Math.random() * 1.8 + 2.6
              : Math.random() * 1.2 + 1.4,
          baseAlpha: isDark
            ? isBright
              ? Math.random() * 0.25 + 0.6
              : Math.random() * 0.25 + 0.35
            : isBright
              ? Math.random() * 0.2 + 0.7
              : Math.random() * 0.25 + 0.5,
          alpha: 0,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.012 + Math.random() * 0.025,
          colorIdx: Math.floor(Math.random() * colorPool.length),
        })
      }
      particles = arr
    }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      createParticles()
    }

    // 连线分桶批量 stroke
    const connectDist = CONFIG.connectDistance
    const connectDistSq = connectDist * connectDist
    const BUCKETS = 3
    const bucketLines: number[][] = Array.from({ length: BUCKETS }, () => [])
    const darkBucketAlpha = [0.22, 0.13, 0.06]
    const lightBucketAlpha = [0.18, 0.1, 0.04]

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      // 不画氛围底 —— 让 body 的 --bg 直接透出，干净深邃
      const isDark = theme === 'dark'
      const lineColor = isDark ? DARK_LINE : LIGHT_LINE
      const [lr, lg, lb] = lineColor
      const bucketAlpha = isDark ? darkBucketAlpha : lightBucketAlpha

      // 收集连线
      for (let b = 0; b < BUCKETS; b++) bucketLines[b].length = 0
      const n = particles.length
      for (let i = 0; i < n; i++) {
        const p = particles[i]
        for (let j = i + 1; j < n; j++) {
          const q = particles[j]
          const dx = p.x - q.x
          const dy = p.y - q.y
          const distSq = dx * dx + dy * dy
          if (distSq >= connectDistSq) continue
          const ratio = distSq / connectDistSq
          const bucket = ratio < 0.33 ? 0 : ratio < 0.66 ? 1 : 2
          const lines = bucketLines[bucket]
          lines.push(p.x, p.y, q.x, q.y)
        }
      }

      ctx.lineWidth = isDark ? 0.7 : 0.6
      for (let b = 0; b < BUCKETS; b++) {
        const lines = bucketLines[b]
        if (lines.length === 0) continue
        ctx.strokeStyle = `rgba(${lr},${lg},${lb},${bucketAlpha[b]})`
        ctx.beginPath()
        for (let k = 0; k < lines.length; k += 4) {
          ctx.moveTo(lines[k], lines[k + 1])
          ctx.lineTo(lines[k + 2], lines[k + 3])
        }
        ctx.stroke()
      }

      // 更新与绘制粒子
      const mr = CONFIG.mouseRadius
      const mrSq = mr * mr
      const maxSpeed = CONFIG.maxSpeed
      const damp = CONFIG.damping

      for (let i = 0; i < n; i++) {
        const p = particles[i]

        if (mouse.active) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const distSq = dx * dx + dy * dy
          if (distSq < mrSq && distSq > 0.01) {
            const dist = Math.sqrt(distSq)
            const force = (1 - dist / mr) * CONFIG.mouseForce
            p.vx += (dx / dist) * force
            p.vy += (dy / dist) * force
          }
        }

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed > maxSpeed) {
          p.vx = (p.vx / speed) * maxSpeed
          p.vy = (p.vy / speed) * maxSpeed
        }
        p.vx *= damp
        p.vy *= damp
        if (speed < 0.05) {
          p.vx += (Math.random() - 0.5) * 0.05
          p.vy += (Math.random() - 0.5) * 0.05
        }

        p.x += p.vx
        p.y += p.vy

        if (p.x < -30) p.x = width + 30
        else if (p.x > width + 30) p.x = -30
        if (p.y < -30) p.y = height + 30
        else if (p.y > height + 30) p.y = -30

        p.twinkle += p.twinkleSpeed
        p.alpha = p.baseAlpha + Math.sin(p.twinkle) * 0.18

        if (isDark) {
          // 深色：发光精灵，星空感
          const r = p.size * 5
          ctx.globalAlpha = Math.min(1, p.alpha)
          ctx.drawImage(sprites[p.colorIdx], p.x - r, p.y - r, r * 2, r * 2)
        } else {
          // 浅色：实心圆点，清晰锐利
          const c = LIGHT_COLORS[p.colorIdx]
          ctx.globalAlpha = p.alpha
          ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1

      if (running) animId = requestAnimationFrame(draw)
    }

    const start = () => {
      if (running) return
      running = true
      animId = requestAnimationFrame(draw)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(animId)
    }

    const onVisibility = () => {
      if (document.hidden) stop()
      else start()
    }

    let resizeTimer = 0
    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(resize, 150)
    }

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
    }
    const onMouseLeave = () => {
      mouse.active = false
      mouse.x = -9999
      mouse.y = -9999
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX
        mouse.y = e.touches[0].clientY
        mouse.active = true
      }
    }

    const themeObserver = new MutationObserver(() => {
      theme = readTheme()
      buildSprites(theme === 'dark' ? DARK_COLORS : LIGHT_COLORS)
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    resize()
    if (prefersReducedMotion) {
      running = false
      draw()
    } else {
      start()
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      themeObserver.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearTimeout(resizeTimer)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
