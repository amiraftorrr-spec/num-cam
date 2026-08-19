import { useEffect, useRef } from 'react'
import { getDigitPoints } from '../utils/shapePoints'

const PARTICLE_COUNT = 1000
const EASE = 0.08
const COLORS = [
  '#7dd3fc',
  '#f0abfc',
  '#a5b4fc',
  '#fca5a5',
  '#fde68a',
  '#86efac',
  '#c4b5fd',
  '#fdba74',
]

// High performance particle field (no heavy canvas shadow/blur filters)
export default function ParticleField({ number, isClapped }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const numberRef = useRef(number)

  useEffect(() => {
    numberRef.current = number
  }, [number])

  // Trigger explosion / scatter effect when clapping after 10
  useEffect(() => {
    if (isClapped && particlesRef.current.length > 0) {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2

      particlesRef.current.forEach((p) => {
        // Reset target shape so they fly freely
        p.tx = null
        p.ty = null
        // Calculate outward angle from center
        const angle = Math.atan2(p.y - centerY, p.x - centerX) + (Math.random() - 0.5) * 0.5
        const speed = Math.random() * 22 + 10 // high burst speed
        p.vx = Math.cos(angle) * speed
        p.vy = Math.sin(angle) * speed
      })
    }
  }, [isClapped])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      tx: null,
      ty: null,
      size: Math.random() * 1.5 + 1.2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }))

    let currentShapeNumber = -1

    function applyShape(num) {
      currentShapeNumber = num
      const particles = particlesRef.current

      if (num <= 0) {
        particles.forEach((p) => {
          p.tx = null
          p.ty = null
        })
        return
      }

      const box = Math.min(width, height) * 0.9
      const points = getDigitPoints(num, box, box, 5)
      const offsetX = (width - box) / 2
      const offsetY = (height - box) / 2
      const shuffled = [...points].sort(() => Math.random() - 0.5)

      particles.forEach((p, i) => {
        const pt = shuffled[i % shuffled.length]
        p.tx = pt.x + offsetX
        p.ty = pt.y + offsetY
      })
    }

    function resize() {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      if (currentShapeNumber > 0) applyShape(currentShapeNumber)
    }
    window.addEventListener('resize', resize)

    let raf
    function tick() {
      if (numberRef.current !== currentShapeNumber) {
        applyShape(numberRef.current)
      }

      ctx.clearRect(0, 0, width, height)

      // Group draw calls by color to minimize context state changes
      const groups = {}
      for (const color of COLORS) {
        groups[color] = []
      }

      for (const p of particlesRef.current) {
        if (p.tx !== null) {
          p.x += (p.tx - p.x) * EASE
          p.y += (p.ty - p.y) * EASE
        } else {
          // If in explosion mode (high velocity), apply natural friction/drag
          if (Math.abs(p.vx) > 1 || Math.abs(p.vy) > 1) {
            p.vx *= 0.94
            p.vy *= 0.94
          }
          p.x += p.vx
          p.y += p.vy
          if (p.x < 0 || p.x > width) p.vx *= -1
          if (p.y < 0 || p.y > height) p.vy *= -1
        }

        if (groups[p.color]) {
          groups[p.color].push(p)
        }
      }

      for (const color in groups) {
        const list = groups[color]
        if (!list.length) continue
        ctx.fillStyle = color
        ctx.beginPath()
        for (const p of list) {
          ctx.moveTo(p.x + p.size, p.y)
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        }
        ctx.fill()
      }

      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 block bg-black" />
}
