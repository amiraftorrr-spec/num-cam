// Renders a number as text on an offscreen canvas, then samples the pixel
// coordinates that fall inside the glyph. Those points become the "target"
// positions the particles animate toward.
export function getDigitPoints(label, width, height, sampleGap = 5) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const fontSize = Math.floor(height * (String(label).length > 1 ? 0.6 : 0.78))
  ctx.font = `900 ${fontSize}px Arial, "Segoe UI", sans-serif`
  ctx.fillText(String(label), width / 2, height / 2 + fontSize * 0.04)

  const { data } = ctx.getImageData(0, 0, width, height)
  const points = []

  for (let y = 0; y < height; y += sampleGap) {
    for (let x = 0; x < width; x += sampleGap) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha > 128) points.push({ x, y })
    }
  }

  return points
}
