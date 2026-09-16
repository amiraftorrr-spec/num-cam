// Advanced Particle Engine with 11 rich interactive simulation modes
import { useEffect, useRef } from 'react'
import { getDigitPoints } from '../utils/shapePoints'
import { sound } from '../utils/soundFX'

const PARTICLE_COUNT = 850
const EASE = 0.13

export const THEME_PALETTES = {
  cyber: ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#34d399', '#fbbf24', '#22d3ee'],
  matrix: ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#15803d', '#10b981'],
  fire: ['#f97316', '#ef4444', '#facc15', '#ea580c', '#dc2626', '#fbbf24'],
}

// Pentatonic Scale for Theremin Synth
const PENTATONIC_NOTES = [
  { name: 'C3', freq: 130.81 },
  { name: 'D3', freq: 146.83 },
  { name: 'E3', freq: 164.81 },
  { name: 'G3', freq: 196.0 },
  { name: 'A3', freq: 220.0 },
  { name: 'C4', freq: 261.63 },
  { name: 'D4', freq: 293.66 },
  { name: 'E4', freq: 329.63 },
  { name: 'G4', freq: 392.0 },
  { name: 'A4', freq: 440.0 },
  { name: 'C5', freq: 523.25 },
  { name: 'D5', freq: 587.33 },
  { name: 'E5', freq: 659.25 },
]

export default function ParticleField({
  number,
  isClapped,
  mode = 'magic',
  theme = 'cyber',
  handPhysics = { hands: [], isFist: false },
  onSlicerScore,
  onGunScore,
  onHockeyScore,
  onSynthNote,
}) {
  const canvasRef = useRef(null)
  const cursorCanvasRef = useRef(null)
  const particlesRef = useRef([])
  const numberRef = useRef(number)
  const modeRef = useRef(mode)
  const themeRef = useRef(theme)
  const handPhysicsRef = useRef(handPhysics)
  const cursorRef = useRef([])

  // Arcade state refs
  const slicerTargetsRef = useRef([])
  const gunTargetsRef = useRef([])
  const gunSparksRef = useRef([])
  const laserBeamsRef = useRef([])
  const lastLaserTimeRef = useRef([])

  // Kamehameha state
  const kamehamehaRef = useRef({
    charge: 0,
    charging: false,
    beamTimer: 0,
    beamMaxTimer: 55,
    beamOrigin: { x: 0, y: 0 },
    beamDir: { x: 1, y: 0 },
    sparks: [],
    lastDist: null,
    chargeVelocity: 0,
  })

  // Air Hockey state
  const hockeyRef = useRef({
    puck: { x: 0, y: 0, vx: 0, vy: 0, r: 20 },
    p1Score: 0,
    p2Score: 0,
    goalText: '',
    goalTimer: 0,
    trail: [],
    aiY: 300,
    initialized: false,
    prevP1: { x: 0, y: 0, vx: 0, vy: 0 },
    prevP2: { x: 0, y: 0, vx: 0, vy: 0 },
    paddle1: null,
    paddle2: null,
  })

  // Synth state
  const synthRef = useRef({
    wavePhase: 0,
    lastNote: '',
  })

  useEffect(() => {
    numberRef.current = number
  }, [number])

  useEffect(() => {
    modeRef.current = mode
    // Clear targets and stop continuous sounds on mode change
    sound.stopChargeHum()
    sound.stopTheremin()

    if (!['magic', 'game'].includes(mode)) {
      const particles = particlesRef.current
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.tx = null
        p.ty = null
        if (p.vx === 0 && p.vy === 0) {
          p.vx = (Math.random() - 0.5) * 1.5
          p.vy = (Math.random() - 0.5) * 1.5
        }
      }
    }
  }, [mode])

  useEffect(() => {
    return () => {
      sound.stopChargeHum()
      sound.stopTheremin()
    }
  }, [])

  useEffect(() => {
    themeRef.current = theme
  }, [theme])

  useEffect(() => {
    handPhysicsRef.current = handPhysics
  }, [handPhysics])

  // Trigger explosion / scatter effect
  useEffect(() => {
    if (isClapped && particlesRef.current.length > 0) {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      const particles = particlesRef.current

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.tx = null
        p.ty = null
        const angle = Math.atan2(p.y - centerY, p.x - centerX) + (Math.random() - 0.5) * 0.9
        const speed = Math.random() * 26 + 12
        p.vx = Math.cos(angle) * speed
        p.vy = Math.sin(angle) * speed
      }
    }
  }, [isClapped])

  useEffect(() => {
    const canvas = canvasRef.current
    const cursorCanvas = cursorCanvasRef.current
    if (!canvas || !cursorCanvas) return

    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
    const cursorCtx = cursorCanvas.getContext('2d', { alpha: true, desynchronized: true })
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)
    cursorCanvas.width = width
    cursorCanvas.height = height

    const palette = THEME_PALETTES[theme] || THEME_PALETTES.cyber

    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      tx: null,
      ty: null,
      size: Math.random() * 1.5 + 1.2,
      color: palette[Math.floor(Math.random() * palette.length)],
      angle: Math.random() * Math.PI * 2,
    }))

    slicerTargetsRef.current = []
    gunTargetsRef.current = []
    gunSparksRef.current = []
    laserBeamsRef.current = []

    // Setup Air Hockey puck at center
    hockeyRef.current.puck = {
      x: width / 2,
      y: height / 2,
      vx: (Math.random() > 0.5 ? 1 : -1) * 6,
      vy: (Math.random() - 0.5) * 6,
      r: 20,
    }
    hockeyRef.current.initialized = true

    let currentShapeNumber = -1

    function applyShape(num) {
      currentShapeNumber = num
      const particles = particlesRef.current

      if (!num || num === 0 || num === '0') {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i]
          p.tx = null
          p.ty = null
          if (p.vx === 0 && p.vy === 0) {
            p.vx = (Math.random() - 0.5) * 0.6
            p.vy = (Math.random() - 0.5) * 0.6
          }
        }
        return
      }

      const points = getDigitPoints(num, width, height, PARTICLE_COUNT)
      if (!points.length) return

      const len = Math.min(particles.length, points.length)
      for (let i = 0; i < len; i++) {
        particles[i].tx = points[i].x
        particles[i].ty = points[i].y
      }
    }

    function resize() {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      cursorCanvas.width = width
      cursorCanvas.height = height
      if (currentShapeNumber && currentShapeNumber !== 0) {
        applyShape(currentShapeNumber)
      }
    }
    window.addEventListener('resize', resize)

    let raf
    let frameCount = 0

    function tick() {
      frameCount++
      const currentMode = modeRef.current
      const currentTheme = themeRef.current
      const colors = THEME_PALETTES[currentTheme] || THEME_PALETTES.cyber

      ctx.save()

      // Screen Shake from Kamehameha / Explosions
      if (kamehamehaRef.current.beamTimer > 0) {
        const factor = kamehamehaRef.current.beamTimer / kamehamehaRef.current.beamMaxTimer
        const shakeX = (Math.random() - 0.5) * 16 * factor
        const shakeY = (Math.random() - 0.5) * 16 * factor
        ctx.translate(shakeX, shakeY)
      }

      // Background clear
      if (currentTheme === 'matrix') {
        ctx.fillStyle = 'rgba(3, 10, 5, 0.25)'
        ctx.fillRect(0, 0, width, height)
      } else {
        ctx.fillStyle = '#030308'
        ctx.fillRect(0, 0, width, height)
      }

      // Magic / Game Shapes
      if (['magic', 'game'].includes(currentMode)) {
        if (numberRef.current !== currentShapeNumber) {
          applyShape(numberRef.current)
        }
      } else {
        currentShapeNumber = -1
      }

      const hp = handPhysicsRef.current
      const particles = particlesRef.current
      const count = particles.length

      // ==========================================
      // 1. SLICER & GUN TARGET SPAWNERS
      // ==========================================
      if (currentMode === 'slicer') {
        if (frameCount % 45 === 0 && slicerTargetsRef.current.length < 8) {
          slicerTargetsRef.current.push({
            id: Math.random(),
            x: Math.random() * (width - 200) + 100,
            y: height + 30,
            vx: (Math.random() - 0.5) * 3,
            vy: -(Math.random() * 6 + 10),
            radius: Math.random() * 18 + 26,
            color: colors[Math.floor(Math.random() * colors.length)],
            points: Math.floor(Math.random() * 3) + 1,
          })
        }
      }

      if (currentMode === 'gun') {
        if (frameCount % 50 === 0 && gunTargetsRef.current.length < 7) {
          gunTargetsRef.current.push({
            id: Math.random(),
            x: Math.random() * (width - 150) + 75,
            y: Math.random() * (height * 0.6) + 60,
            vx: (Math.random() - 0.5) * 2.5,
            vy: (Math.random() - 0.5) * 2,
            radius: Math.random() * 16 + 24,
            color: colors[Math.floor(Math.random() * colors.length)],
            hp: 1,
            pulse: 0,
          })
        }
      }

      // ==========================================
      // 2. KAMEHAMEHA MECHANICS
      // ==========================================
      if (currentMode === 'kamehameha') {
        const km = kamehamehaRef.current
        const hands = hp.hands || []

        let chargePos = null
        let isCharging = false

        if (hands.length >= 2) {
          const h1 = hands[0]
          const h2 = hands[1]
          const p1 = { x: h1.x * width, y: h1.y * height }
          const p2 = { x: h2.x * width, y: h2.y * height }
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y)
          const midX = (p1.x + p2.x) / 2
          const midY = (p1.y + p2.y) / 2

          // Dynamic distance delta for thrust fire
          if (km.lastDist !== null) {
            km.chargeVelocity = dist - km.lastDist
          }
          km.lastDist = dist

          if (dist < width * 0.38) {
            isCharging = true
            chargePos = { x: midX, y: midY }
          } else if (km.charge > 0.2 && km.chargeVelocity > 14 && km.beamTimer <= 0) {
            // Sudden push apart fires beam
            km.beamTimer = km.beamMaxTimer
            sound.playMegaBeam()
            const dx = (midX - width / 2) || 1
            const dy = (midY - height / 2) || 0
            const len = Math.hypot(dx, dy) || 1
            km.beamDir = { x: dx / len, y: dy / len }
          }
        } else if (hands.length === 1 && (hands[0].isFist || hands[0].count <= 2)) {
          isCharging = true
          chargePos = { x: hands[0].x * width, y: hands[0].y * height }
          km.lastDist = null
        } else {
          km.lastDist = null
        }

        if (isCharging && chargePos) {
          km.charge = Math.min(1.0, km.charge + 0.02)
          km.charging = true
          km.beamOrigin = chargePos
          sound.startChargeHum()
          sound.setChargeIntensity(km.charge)

          // Electric charging sparks around the core
          const sparkCount = Math.floor(1 + km.charge * 4)
          for (let sc = 0; sc < sparkCount; sc++) {
            const a = Math.random() * Math.PI * 2
            const r = 25 + km.charge * 80 + Math.random() * 20
            km.sparks.push({
              x: chargePos.x + Math.cos(a) * r,
              y: chargePos.y + Math.sin(a) * r,
              tx: chargePos.x,
              ty: chargePos.y,
              life: 1.0,
            })
          }
        } else {
          // Release / Fire beam!
          if (km.charge > 0.28 && km.beamTimer <= 0) {
            km.beamTimer = km.beamMaxTimer
            sound.playMegaBeam()
            if (hands.length >= 1) {
              const h = hands[0]
              const dx = (h.indexX - h.x) * width
              const dy = (h.indexY - h.y) * height
              const len = Math.hypot(dx, dy) || 1
              km.beamDir = { x: dx / len, y: dy / len }
            } else {
              km.beamDir = { x: 0, y: -1 }
            }
          }
          km.charge = Math.max(0, km.charge - 0.05)
          km.charging = false
          sound.stopChargeHum()
        }

        // Draw Charging Aura & Orb
        if (km.charge > 0.05 && chargePos) {
          const orbR = 30 + km.charge * 90
          // Pulsing outer aura
          const pulse = Math.sin(frameCount * 0.3) * 6
          const auraGrad = ctx.createRadialGradient(
            chargePos.x,
            chargePos.y,
            orbR * 0.4,
            chargePos.x,
            chargePos.y,
            orbR + pulse + 25
          )
          auraGrad.addColorStop(0, 'rgba(147, 197, 253, 0.9)')
          auraGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.6)')
          auraGrad.addColorStop(0.7, 'rgba(37, 99, 235, 0.35)')
          auraGrad.addColorStop(1, 'rgba(29, 78, 216, 0)')

          ctx.fillStyle = auraGrad
          ctx.beginPath()
          ctx.arc(chargePos.x, chargePos.y, orbR + pulse + 25, 0, Math.PI * 2)
          ctx.fill()

          // Core hot orb
          const coreGrad = ctx.createRadialGradient(
            chargePos.x,
            chargePos.y,
            0,
            chargePos.x,
            chargePos.y,
            orbR * 0.75
          )
          coreGrad.addColorStop(0, '#ffffff')
          coreGrad.addColorStop(0.5, '#67e8f9')
          coreGrad.addColorStop(1, '#2563eb')

          ctx.fillStyle = coreGrad
          ctx.beginPath()
          ctx.arc(chargePos.x, chargePos.y, orbR * 0.75, 0, Math.PI * 2)
          ctx.fill()
        }

        // Draw Sparks / Lightning arcs
        for (let s = km.sparks.length - 1; s >= 0; s--) {
          const sp = km.sparks[s]
          sp.x += (sp.tx - sp.x) * 0.28
          sp.y += (sp.ty - sp.y) * 0.28
          sp.life -= 0.09
          ctx.strokeStyle = '#a5f3fc'
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.moveTo(sp.x, sp.y)
          ctx.lineTo(sp.tx + (Math.random() - 0.5) * 15, sp.ty + (Math.random() - 0.5) * 15)
          ctx.stroke()
          if (sp.life <= 0) km.sparks.splice(s, 1)
        }

        // Draw Mega Beam Blast
        if (km.beamTimer > 0) {
          km.beamTimer--
          const progress = km.beamTimer / km.beamMaxTimer
          const beamWidth = 70 + progress * 110
          const startX = km.beamOrigin.x
          const startY = km.beamOrigin.y
          const endX = startX + km.beamDir.x * width * 2
          const endY = startY + km.beamDir.y * width * 2

          // Shock rings along beam
          ctx.strokeStyle = `rgba(125, 211, 252, ${progress * 0.7})`
          ctx.lineWidth = 4
          for (let ring = 1; ring <= 4; ring++) {
            const rx = startX + (km.beamDir.x * width * ring * 0.25)
            const ry = startY + (km.beamDir.y * width * ring * 0.25)
            ctx.beginPath()
            ctx.arc(rx, ry, beamWidth * (0.6 + ring * 0.15), 0, Math.PI * 2)
            ctx.stroke()
          }

          // Beam outer glow
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)'
          ctx.lineWidth = beamWidth * 1.5
          ctx.beginPath()
          ctx.moveTo(startX, startY)
          ctx.lineTo(endX, endY)
          ctx.stroke()

          // Beam main body
          ctx.strokeStyle = '#38bdf8'
          ctx.lineWidth = beamWidth
          ctx.beginPath()
          ctx.moveTo(startX, startY)
          ctx.lineTo(endX, endY)
          ctx.stroke()

          // Beam intense white core
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = beamWidth * 0.5
          ctx.beginPath()
          ctx.moveTo(startX, startY)
          ctx.lineTo(endX, endY)
          ctx.stroke()
        }
      }

      // ==========================================
      // 3. NEON AIR HOCKEY GAME
      // ==========================================
      if (currentMode === 'hockey') {
        const hk = hockeyRef.current
        const puck = hk.puck
        const hands = hp.hands || []

        // Table boundaries
        const left = 70
        const right = width - 70
        const top = 90
        const bottom = height - 70
        const goalTop = height * 0.33
        const goalBottom = height * 0.67

        // Initialize puck at center if not ready
        if (!hk.initialized || puck.x === 0) {
          puck.x = width / 2
          puck.y = height / 2
          puck.vx = 0
          puck.vy = 0
          hk.initialized = true
        }

        // Draw Neon Court
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)'
        ctx.lineWidth = 4
        ctx.strokeRect(left, top, right - left, bottom - top)

        // Center line & center circle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.setLineDash([10, 10])
        ctx.beginPath()
        ctx.moveTo(width / 2, top)
        ctx.lineTo(width / 2, bottom)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(width / 2, height / 2, 75, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])

        // Goal Openings (Neon)
        ctx.strokeStyle = '#22c55e'
        ctx.lineWidth = 8
        ctx.beginPath()
        ctx.moveTo(left, goalTop)
        ctx.lineTo(left, goalBottom)
        ctx.stroke()
        ctx.strokeStyle = '#ef4444'
        ctx.beginPath()
        ctx.moveTo(right, goalTop)
        ctx.lineTo(right, goalBottom)
        ctx.stroke()

        // Paddles calculation with true velocity tracking
        let targetP1 = { x: left + 90, y: height / 2, r: 36 }
        let targetP2 = { x: right - 90, y: height / 2, r: 36 }

        if (hands.length >= 2) {
          const hA = hands[0].x < hands[1].x ? hands[0] : hands[1]
          const hB = hands[0].x < hands[1].x ? hands[1] : hands[0]
          targetP1.x = Math.min(width / 2 - 45, Math.max(left + 40, hA.x * width))
          targetP1.y = Math.min(bottom - 40, Math.max(top + 40, hA.y * height))
          targetP2.x = Math.max(width / 2 + 45, Math.min(right - 40, hB.x * width))
          targetP2.y = Math.min(bottom - 40, Math.max(top + 40, hB.y * height))
        } else if (hands.length === 1) {
          const h = hands[0]
          targetP1.x = Math.min(width / 2 - 45, Math.max(left + 40, h.x * width))
          targetP1.y = Math.min(bottom - 40, Math.max(top + 40, h.y * height))

          // AI Bot with smarter prediction
          const aiTargetY = puck.x > width * 0.4 ? puck.y + puck.vy * 4 : height / 2
          hk.aiY += (aiTargetY - hk.aiY) * 0.12
          targetP2.x = right - 90
          targetP2.y = Math.min(bottom - 40, Math.max(top + 40, hk.aiY))
        }

        const smoothPaddle = (target, key) => {
          const previous = hk[key] || { x: target.x, y: target.y }
          const next = {
            x: previous.x + (target.x - previous.x) * 0.24,
            y: previous.y + (target.y - previous.y) * 0.24,
            r: target.r,
          }
          hk[key] = next
          return next
        }

        targetP1 = smoothPaddle(targetP1, 'paddle1')
        targetP2 = smoothPaddle(targetP2, 'paddle2')

        // Cap paddle velocity so tracking spikes cannot launch the puck.
        const limitVelocity = (current, previous) => {
          const vx = current.x - previous.x
          const vy = current.y - previous.y
          const speed = Math.hypot(vx, vy)
          const scale = speed > 18 ? 18 / speed : 1
          return { vx: vx * scale, vy: vy * scale }
        }
        const p1Velocity = limitVelocity(targetP1, hk.prevP1)
        const p2Velocity = limitVelocity(targetP2, hk.prevP2)
        const p1Vx = p1Velocity.vx
        const p1Vy = p1Velocity.vy
        const p2Vx = p2Velocity.vx
        const p2Vy = p2Velocity.vy

        hk.prevP1 = { x: targetP1.x, y: targetP1.y, vx: p1Vx, vy: p1Vy }
        hk.prevP2 = { x: targetP2.x, y: targetP2.y, vx: p2Vx, vy: p2Vy }

        // Draw Paddles
        ctx.fillStyle = '#06b6d4'
        ctx.beginPath()
        ctx.arc(targetP1.x, targetP1.y, targetP1.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3
        ctx.stroke()

        ctx.fillStyle = '#f43f5e'
        ctx.beginPath()
        ctx.arc(targetP2.x, targetP2.y, targetP2.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3
        ctx.stroke()

        // Puck Physics: Sub-stepping for collision precision
        const SUB_STEPS = 4
        for (let step = 0; step < SUB_STEPS; step++) {
          puck.x += puck.vx / SUB_STEPS
          puck.y += puck.vy / SUB_STEPS

          // Top/Bottom wall bounce
          if (puck.y - puck.r < top) {
            puck.y = top + puck.r
            puck.vy = Math.abs(puck.vy) * 0.95
            sound.playHockeyHit()
          } else if (puck.y + puck.r > bottom) {
            puck.y = bottom - puck.r
            puck.vy = -Math.abs(puck.vy) * 0.95
            sound.playHockeyHit()
          }

          // Goal or Left Wall
          if (puck.x - puck.r < left) {
            if (puck.y >= goalTop && puck.y <= goalBottom) {
              hk.p2Score++
              hk.goalText = '⚽ گل حریف!'
              hk.goalTimer = 60
              sound.playGoal()
              if (onHockeyScore) onHockeyScore(hk.p1Score, hk.p2Score)
              puck.x = width / 2
              puck.y = height / 2
              puck.vx = 4
              puck.vy = (Math.random() - 0.5) * 4
              break
            } else {
              puck.x = left + puck.r
              puck.vx = Math.abs(puck.vx) * 0.95
              sound.playHockeyHit()
            }
          }

          // Goal or Right Wall
          if (puck.x + puck.r > right) {
            if (puck.y >= goalTop && puck.y <= goalBottom) {
              hk.p1Score++
              hk.goalText = '🔥 گل زدی!'
              hk.goalTimer = 60
              sound.playGoal()
              if (onHockeyScore) onHockeyScore(hk.p1Score, hk.p2Score)
              puck.x = width / 2
              puck.y = height / 2
              puck.vx = -4
              puck.vy = (Math.random() - 0.5) * 4
              break
            } else {
              puck.x = right - puck.r
              puck.vx = -Math.abs(puck.vx) * 0.95
              sound.playHockeyHit()
            }
          }

          // Paddle Collision with Momentum Transfer
          const checkPaddle = (pad, padV) => {
            const dx = puck.x - pad.x
            const dy = puck.y - pad.y
            const dist = Math.hypot(dx, dy)
            const minDist = puck.r + pad.r

            if (dist < minDist) {
              const nx = dx / (dist || 1)
              const ny = dy / (dist || 1)
              puck.x = pad.x + nx * (minDist + 1)
              puck.y = pad.y + ny * (minDist + 1)

              const relativeVx = puck.vx - padV.vx
              const relativeVy = puck.vy - padV.vy
              const approachSpeed = relativeVx * nx + relativeVy * ny

              if (approachSpeed < 0) {
                const bouncedVx = relativeVx - 2 * approachSpeed * nx
                const bouncedVy = relativeVy - 2 * approachSpeed * ny
                const speed = Math.min(20, Math.max(5, Math.hypot(bouncedVx, bouncedVy) * 0.92))
                const bounceLength = Math.hypot(bouncedVx, bouncedVy) || 1
                puck.vx = padV.vx + (bouncedVx / bounceLength) * speed
                puck.vy = padV.vy + (bouncedVy / bounceLength) * speed
                sound.playHockeyHit()
              }
            }
          }

          checkPaddle(targetP1, hk.prevP1)
          checkPaddle(targetP2, hk.prevP2)
        }

        // Natural Table Friction
        puck.vx *= 0.997
        puck.vy *= 0.997

        // Draw Puck & Glowing Trail
        hk.trail.push({ x: puck.x, y: puck.y })
        if (hk.trail.length > 10) hk.trail.shift()

        for (let t = 0; t < hk.trail.length; t++) {
          const tp = hk.trail[t]
          ctx.fillStyle = `rgba(56, 189, 248, ${(t / hk.trail.length) * 0.35})`
          ctx.beginPath()
          ctx.arc(tp.x, tp.y, puck.r * (t / hk.trail.length), 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(puck.x, puck.y, puck.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#38bdf8'
        ctx.lineWidth = 3
        ctx.stroke()

        // Scoreboard
        ctx.font = 'bold 36px monospace'
        ctx.fillStyle = '#38bdf8'
        ctx.fillText(`${hk.p1Score}`, width / 2 - 70, top - 20)
        ctx.fillStyle = '#f43f5e'
        ctx.fillText(`${hk.p2Score}`, width / 2 + 45, top - 20)

        // Goal Banner
        if (hk.goalTimer > 0) {
          hk.goalTimer--
          ctx.font = 'bold 44px sans-serif'
          ctx.fillStyle = '#facc15'
          ctx.textAlign = 'center'
          ctx.fillText(hk.goalText, width / 2, height / 2 - 90)
          ctx.textAlign = 'start'
        }
      }

      // ==========================================
      // 4. THEREMIN AIR SYNTH
      // ==========================================
      if (currentMode === 'synth') {
        const sy = synthRef.current
        sy.wavePhase += 0.08
        const hands = hp.hands || []

        if (hands.length > 0) {
          const h = hands[0]
          const handX = h.x * width
          const handY = h.y * height

          // Height determines frequency & note
          const noteIndex = Math.floor(
            Math.max(0, Math.min(1, 1 - h.y)) * (PENTATONIC_NOTES.length - 1)
          )
          const targetNote = PENTATONIC_NOTES[noteIndex]
          const volume = Math.min(0.25, Math.max(0.05, h.x * 0.3))

          sound.updateTheremin(targetNote.freq, volume)
          sy.lastNote = targetNote.name

          if (onSynthNote) {
            onSynthNote(targetNote.name, Math.round(targetNote.freq))
          }

          // Draw Live Waveform Ribbon
          ctx.strokeStyle = '#a855f7'
          ctx.lineWidth = 3
          ctx.beginPath()
          for (let x = 0; x < width; x += 12) {
            const waveY =
              handY +
              Math.sin(x * 0.02 + sy.wavePhase) * (40 * (1 - h.y)) * Math.sin(x / width * Math.PI)
            if (x === 0) ctx.moveTo(x, waveY)
            else ctx.lineTo(x, waveY)
          }
          ctx.stroke()

          // Draw Glowing Sound Node on Hand
          ctx.fillStyle = '#c084fc'
          ctx.beginPath()
          ctx.arc(handX, handY, 18, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.stroke()

          // Note indicator label
          ctx.font = 'bold 26px sans-serif'
          ctx.fillStyle = '#ffffff'
          ctx.fillText(`🎵 ${targetNote.name} (${Math.round(targetNote.freq)} Hz)`, handX + 25, handY - 10)
        } else {
          sound.stopTheremin()
        }
      }

      // Hand logic for cutting and shooting (Slicer & Gun)
      if (hp.hands && hp.hands.length > 0) {
        for (let h = 0; h < hp.hands.length; h++) {
          const hand = hp.hands[h]
          const hx = hand.x * width
          const hy = hand.y * height
          const ix = hand.indexX * width
          const iy = hand.indexY * height

          // Slicer Sword
          if (currentMode === 'slicer') {
            for (let t = slicerTargetsRef.current.length - 1; t >= 0; t--) {
              const target = slicerTargetsRef.current[t]
              const dist = Math.hypot(ix - target.x, iy - target.y)
              if (dist < target.radius + 35) {
                sound.playSlash()
                if (onSlicerScore) onSlicerScore(target.points * 10)
                slicerTargetsRef.current.splice(t, 1)
              }
            }
          }

          // Finger Gun Laser
          if (currentMode === 'gun' && hand.isGun) {
            const now = performance.now()
            if (now - (lastLaserTimeRef.current[h] || 0) > 180) {
              lastLaserTimeRef.current[h] = now
              sound.playLaser()

              const aimX = ix - hx
              const aimY = iy - hy
              const aimLength = Math.hypot(aimX, aimY) || 1
              const beam = {
                x: ix,
                y: iy,
                vx: (aimX / aimLength) * 18,
                vy: (aimY / aimLength) * 18,
                life: 1.0,
                color: colors[Math.floor(Math.random() * colors.length)],
              }
              laserBeamsRef.current.push(beam)
            }
          }
        }
      }

      // Only draw the ambient particles (small dots) in magic, forcefield, and game modes
      const showAmbientParticles = ['magic', 'forcefield', 'game'].includes(currentMode)

      if (showAmbientParticles) {
        const groups = {}
        for (let i = 0; i < colors.length; i++) {
          groups[colors[i]] = []
        }

        for (let i = 0; i < count; i++) {
          const p = particles[i]

          // Fist / Forcefield physics
          if (hp.hands && hp.hands.length > 0) {
            for (let h = 0; h < hp.hands.length; h++) {
              const hand = hp.hands[h]
              const hx = hand.x * width
              const hy = hand.y * height
              const dx = hx - p.x
              const dy = hy - p.y
              const dist = Math.hypot(dx, dy)

              if (hand.isFist && !['magic', 'game'].includes(currentMode)) {
                p.tx = null
                p.ty = null
                const normalizedDistance = Math.min(dist / 260, 1)
                const pull = 0.018 * (1 - normalizedDistance) + 0.004
                p.vx += dx * pull
                p.vy += dy * pull
                p.x += (hx - p.x) * 0.055
                p.y += (hy - p.y) * 0.055
              } else if (currentMode === 'forcefield' && dist < 230) {
                p.tx = null
                p.ty = null
                const angle = Math.atan2(dy, dx)
                const force = (230 - dist) / 230
                p.vx -= Math.cos(angle) * force * 4.5 - Math.sin(angle) * force * 5.5
                p.vy -= Math.sin(angle) * force * 4.5 + Math.cos(angle) * force * 5.5
              }
            }
          }

          // Mode specific particle update
          if (['magic', 'game'].includes(currentMode)) {
            if (p.tx !== null && (currentMode !== 'magic' || !hp.isFist)) {
              p.x += (p.tx - p.x) * EASE
              p.y += (p.ty - p.y) * EASE
            } else {
              if (currentTheme === 'matrix') {
                p.vy += 0.05
                p.y += p.vy
                p.x += p.vx * 0.3
                if (p.y > height) {
                  p.y = 0
                  p.x = Math.random() * width
                  p.vy = Math.random() * 2 + 1
                }
              } else {
                if (Math.abs(p.vx) > 0.8 || Math.abs(p.vy) > 0.8) {
                  p.vx *= 0.95
                  p.vy *= 0.95
                }
                p.x += p.vx
                p.y += p.vy
                if (p.x < 0) { p.x = 0; p.vx *= -1 }
                else if (p.x > width) { p.x = width; p.vx *= -1 }
                if (p.y < 0) { p.y = 0; p.vy *= -1 }
                else if (p.y > height) { p.y = height; p.vy *= -1 }
              }
            }
          } else {
            p.x += p.vx
            p.y += p.vy
            if (p.x < 0) { p.x = 0; p.vx *= -1 }
            else if (p.x > width) { p.x = width; p.vx *= -1 }
            if (p.y < 0) { p.y = 0; p.vy *= -1 }
            else if (p.y > height) { p.y = height; p.vy *= -1 }
          }

          const clr = p.color || colors[i % colors.length]
          if (groups[clr]) {
            groups[clr].push(p)
          } else {
            groups[colors[0]].push(p)
          }
        }

        // Draw particle batches
        for (const clr in groups) {
          const list = groups[clr]
          if (!list || list.length === 0) continue

          ctx.fillStyle = clr
          ctx.beginPath()
          for (let j = 0; j < list.length; j++) {
            const p = list[j]
            const sz = p.size
            ctx.rect(p.x - sz, p.y - sz, sz * 2, sz * 2)
          }
          ctx.fill()
        }
      }

      // Slicer fruit rendering
      if (currentMode === 'slicer') {
        for (let t = slicerTargetsRef.current.length - 1; t >= 0; t--) {
          const target = slicerTargetsRef.current[t]
          target.x += target.vx
          target.y += target.vy
          target.vy += 0.28

          ctx.beginPath()
          ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2)
          ctx.fillStyle = target.color
          ctx.fill()

          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(target.x, target.y, target.radius * 0.5, 0, Math.PI * 2)
          ctx.stroke()

          if (target.y > height + 60 && target.vy > 0) {
            slicerTargetsRef.current.splice(t, 1)
          }
        }
      }

      // Gun targets & lasers
      if (currentMode === 'gun') {
        for (let t = gunTargetsRef.current.length - 1; t >= 0; t--) {
          const target = gunTargetsRef.current[t]
          target.x += target.vx
          target.y += target.vy
          target.pulse += 0.05
          if (target.x < 50 || target.x > width - 50) target.vx *= -1
          if (target.y < 50 || target.y > height * 0.7) target.vy *= -1

          const r = target.radius + Math.sin(target.pulse) * 3
          ctx.beginPath()
          ctx.arc(target.x, target.y, r, 0, Math.PI * 2)
          ctx.fillStyle = target.color
          ctx.fill()

          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.strokeRect(target.x - r - 4, target.y - r - 4, (r + 4) * 2, (r + 4) * 2)
        }

        for (let b = laserBeamsRef.current.length - 1; b >= 0; b--) {
          const beam = laserBeamsRef.current[b]
          beam.x += beam.vx
          beam.y += beam.vy
          beam.life -= 0.025

          ctx.strokeStyle = beam.color
          ctx.lineWidth = 6
          ctx.beginPath()
          ctx.moveTo(beam.x, beam.y)
          ctx.lineTo(beam.x - beam.vx * 2, beam.y - beam.vy * 2)
          ctx.stroke()

          let hit = false
          for (let t = gunTargetsRef.current.length - 1; t >= 0; t--) {
            const target = gunTargetsRef.current[t]
            const d = Math.hypot(beam.x - target.x, beam.y - target.y)
            if (d < target.radius + 15) {
              hit = true
              sound.playExplosion()
              if (onGunScore) onGunScore(25)

              for (let k = 0; k < 25; k++) {
                const angle = Math.random() * Math.PI * 2
                const speed = Math.random() * 14 + 4
                gunSparksRef.current.push({
                  x: target.x,
                  y: target.y,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  color: target.color,
                  life: 1.0,
                })
              }

              gunTargetsRef.current.splice(t, 1)
              break
            }
          }

          if (hit || beam.life <= 0 || beam.y < -50) {
            laserBeamsRef.current.splice(b, 1)
          }
        }

        // Draw and update gun explosion sparks
        for (let s = gunSparksRef.current.length - 1; s >= 0; s--) {
          const sp = gunSparksRef.current[s]
          sp.x += sp.vx
          sp.y += sp.vy
          sp.vx *= 0.94
          sp.vy *= 0.94
          sp.life -= 0.04

          ctx.fillStyle = sp.color
          ctx.beginPath()
          ctx.arc(sp.x, sp.y, Math.max(1, 3.5 * sp.life), 0, Math.PI * 2)
          ctx.fill()

          if (sp.life <= 0) {
            gunSparksRef.current.splice(s, 1)
          }
        }
      }

      cursorCtx.clearRect(0, 0, width, height)

      // Keep aim cursors visible during pointer-driven games. In other modes,
      // show them only while the hand is close enough to the navbar to select.
      const handsForCursor = hp.hands || []
      const alwaysVisibleCursorModes = ['gun', 'slicer', 'forcefield']
      const cursorIsNearNavbar = (hand) =>
        alwaysVisibleCursorModes.includes(currentMode) || hand.indexY * height <= 150

      for (let h = 0; h < handsForCursor.length; h++) {
        const hand = handsForCursor[h]
        if (!cursorIsNearNavbar(hand)) continue

        const targetX = hand.indexX * width
        const targetY = hand.indexY * height
        const previous = cursorRef.current[h] || { x: targetX, y: targetY }
        const distance = Math.hypot(targetX - previous.x, targetY - previous.y)
        const follow = distance > 120 ? 1 : 0.82
        const cursor = {
          x: previous.x + (targetX - previous.x) * follow,
          y: previous.y + (targetY - previous.y) * follow,
        }
        cursorRef.current[h] = cursor

        cursorCtx.beginPath()
        cursorCtx.arc(cursor.x, cursor.y, 11, 0, Math.PI * 2)
        cursorCtx.strokeStyle = hand.isPinch ? '#6ee7b7' : '#67e8f9'
        cursorCtx.lineWidth = 2.5
        cursorCtx.shadowColor = cursorCtx.strokeStyle
        cursorCtx.shadowBlur = 12
        cursorCtx.stroke()
        cursorCtx.shadowBlur = 0

        cursorCtx.beginPath()
        cursorCtx.arc(cursor.x, cursor.y, 3, 0, Math.PI * 2)
        cursorCtx.fillStyle = hand.isPinch ? '#a7f3d0' : '#cffafe'
        cursorCtx.fill()
      }

      cursorRef.current.length = handsForCursor.length

      ctx.restore()
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [theme])

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block touch-none"
      />
      <canvas
        ref={cursorCanvasRef}
        className="absolute inset-0 z-30 w-full h-full block pointer-events-none"
      />
    </>
  )
}
