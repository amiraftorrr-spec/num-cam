import { useEffect, useRef } from 'react'
import { getDigitPoints } from '../utils/shapePoints'

const PARTICLE_COUNT = 1400
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

// Renders and animates the particle field. When `number` is 0 the dots
// float around freely (like the reference clip); when it's 1-10 they
// ease into the shape of that digit.
export default function ParticleField({ number }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const numberRef = useRef(number)

  useEffect(() => {
    numberRef.current = number
  }, [number])

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
      size: Math.random() * 2 + 1,
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
      ctx.globalCompositeOperation = 'lighter'

      for (const p of particlesRef.current) {
        if (p.tx !== null) {
          p.x += (p.tx - p.x) * EASE
          p.y += (p.ty - p.y) * EASE
        } else {
          p.x += p.vx
          p.y += p.vy
          if (p.x < 0 || p.x > width) p.vx *= -1
          if (p.y < 0 || p.y > height) p.vy *= -1
        }

        ctx.beginPath()
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.85
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
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

  return <canvas ref={canvasRef} className="absolute inset-0 block" />
}
