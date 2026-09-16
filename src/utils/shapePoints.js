// Cache for precomputed digit/text particle target points
const pointsCache = new Map()

// Draw pre-set geometric vector icons for magical gestures (Heart, Lightning, Spiral, Star, etc.)
function drawSpecialIcon(ctx, iconType, size) {
  const cx = size / 2
  const cy = size / 2
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#ffffff'

  if (iconType === 'HEART') {
    // 2D Heart equation
    ctx.beginPath()
    const scale = size * 0.024
    for (let t = 0; t < Math.PI * 2; t += 0.05) {
      const x = 16 * Math.pow(Math.sin(t), 3)
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
      if (t === 0) ctx.moveTo(cx + x * scale, cy + y * scale)
      else ctx.lineTo(cx + x * scale, cy + y * scale)
    }
    ctx.closePath()
    ctx.fill()
  } else if (iconType === 'LIGHTNING') {
    // Lightning Bolt
    ctx.beginPath()
    ctx.moveTo(cx + size * 0.05, cy - size * 0.38)
    ctx.lineTo(cx - size * 0.22, cy - size * 0.02)
    ctx.lineTo(cx - size * 0.02, cy - size * 0.02)
    ctx.lineTo(cx - size * 0.12, cy + size * 0.38)
    ctx.lineTo(cx + size * 0.24, cy - size * 0.04)
    ctx.lineTo(cx + size * 0.04, cy - size * 0.04)
    ctx.closePath()
    ctx.fill()
  } else if (iconType === 'VORTEX') {
    // Doctor Strange Magic Spiral Rings
    ctx.lineWidth = 14
    for (let r = size * 0.12; r <= size * 0.38; r += size * 0.1) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
    }
  } else if (iconType === 'SPIDER') {
    // Spider-Man Web Symbol
    ctx.lineWidth = 6
    ctx.beginPath()
    // Spider body
    ctx.arc(cx, cy, size * 0.12, 0, Math.PI * 2)
    ctx.fill()
    // Spider legs
    for (let angle = -0.7; angle <= 0.7; angle += 0.45) {
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(angle) * size * 0.38, cy + Math.sin(angle) * size * 0.38)
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx - Math.cos(angle) * size * 0.38, cy + Math.sin(angle) * size * 0.38)
      ctx.stroke()
    }
  } else if (iconType === 'ALIEN') {
    // Alien Face Shape
    ctx.beginPath()
    ctx.ellipse(cx, cy, size * 0.28, size * 0.38, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (iconType === 'GUN') {
    // Crosshair Target Symbol
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.arc(cx, cy, size * 0.28, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx - size * 0.4, cy)
    ctx.lineTo(cx + size * 0.4, cy)
    ctx.moveTo(cx, cy - size * 0.4)
    ctx.lineTo(cx, cy + size * 0.4)
    ctx.stroke()
  }
}

// Renders numbers, text, or vector shapes into particles with organic jitter
export function getDigitPoints(label, width, height, targetCount = 700) {
  const str = String(label).trim()
  if (!str || str === '0') return []

  const cacheKey = `${str}_${Math.round(width)}_${Math.round(height)}_${targetCount}`
  if (pointsCache.has(cacheKey)) {
    return pointsCache.get(cacheKey)
  }

  const offSize = 280
  const canvas = document.createElement('canvas')
  canvas.width = offSize
  canvas.height = offSize
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, offSize, offSize)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (['HEART', 'LIGHTNING', 'VORTEX', 'SPIDER', 'ALIEN', 'GUN'].includes(str)) {
    drawSpecialIcon(ctx, str, offSize)
  } else if (str === 'FUCK YOU') {
    const fontSize = Math.floor(offSize * 0.25)
    ctx.font = `900 ${fontSize}px "Segoe UI", Arial, Roboto, system-ui, sans-serif`
    ctx.fillText('FUCK', offSize / 2, offSize * 0.35)
    ctx.fillText('YOU', offSize / 2, offSize * 0.65)
  } else if (str.length > 2) {
    const fontSize = Math.floor(offSize * 0.22)
    ctx.font = `900 ${fontSize}px "Segoe UI", Arial, Roboto, system-ui, sans-serif`
    ctx.fillText(str, offSize / 2, offSize / 2)
  } else {
    const fontSize = Math.floor(offSize * (str.length > 1 ? 0.52 : 0.72))
    ctx.font = `900 ${fontSize}px "Segoe UI", Arial, Roboto, system-ui, sans-serif`
    ctx.fillText(str, offSize / 2, offSize / 2 + fontSize * 0.03)
  }

  const imgData = ctx.getImageData(0, 0, offSize, offSize)
  const data = imgData.data

  let minX = offSize
  let maxX = 0
  let minY = offSize
  let maxY = 0
  const rawPoints = []

  // Fast 2px scan
  for (let y = 0; y < offSize; y += 2) {
    const rowOffset = y * offSize
    for (let x = 0; x < offSize; x += 2) {
      const alpha = data[(rowOffset + x) * 4 + 3]
      if (alpha > 70) {
        rawPoints.push({ x, y })
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (rawPoints.length === 0) return []

  // Accurate glyph bounds
  const glyphW = maxX - minX || 1
  const glyphH = maxY - minY || 1
  const glyphCenterX = (minX + maxX) / 2
  const glyphCenterY = (minY + maxY) / 2

  const maxBoxW = width * 0.75
  const maxBoxH = height * 0.75
  const scale = Math.min(maxBoxW / glyphW, maxBoxH / glyphH)

  const sampledPoints = []
  const step = rawPoints.length / targetCount
  const jitterAmount = Math.max(1.5, scale * 1.3)

  for (let i = 0; i < targetCount; i++) {
    const rawIdx = Math.floor(i * step) % rawPoints.length
    const p = rawPoints[rawIdx]

    const jx = (Math.random() - 0.5) * jitterAmount
    const jy = (Math.random() - 0.5) * jitterAmount

    sampledPoints.push({
      x: width / 2 + (p.x - glyphCenterX) * scale + jx,
      y: height / 2 + (p.y - glyphCenterY) * scale + jy,
    })
  }

  if (pointsCache.size > 50) {
    const firstKey = pointsCache.keys().next().value
    pointsCache.delete(firstKey)
  }
  pointsCache.set(cacheKey, sampledPoints)

  return sampledPoints
}
