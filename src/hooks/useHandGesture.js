import { useEffect, useRef, useState } from 'react'
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { analyzeFingers } from '../utils/fingerCount'

// Hand landmark connections for drawing skeleton
const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [5, 9], [9, 13], [13, 17]
]

// Tip landmark indices mapped to finger names
const TIP_INDEX_MAP = {
  4: 'thumb',
  8: 'index',
  12: 'middle',
  16: 'ring',
  20: 'pinky'
}

// Requests the camera, loads MediaPipe's HandLandmarker model, and runs
// a detection loop that turns the visible fingers (across up to 2 hands)
// into a number from 0 to 10. Also draws landmarks onto debug canvas.
export function useHandGesture() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const landmarkerRef = useRef(null)
  const rafRef = useRef(null)

  const [number, setNumber] = useState(0)
  const [isClapped, setIsClapped] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  const lastClapTimeRef = useRef(0)
  const wasTenRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        )

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })

        if (cancelled) return
        landmarkerRef.current = landmarker

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        })

        if (cancelled) return
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        setReady(true)
        loop()
      } catch (err) {
        console.error(err)
        setError('دسترسی به دوربین یا بارگذاری مدل با خطا مواجه شد')
      }
    }

    function loop() {
      const video = videoRef.current
      const canvas = canvasRef.current
      const landmarker = landmarkerRef.current

      if (video && landmarker && video.readyState >= 2) {
        const result = landmarker.detectForVideo(video, performance.now())

        let ctx = null
        if (canvas) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640
            canvas.height = video.videoHeight || 480
          }
          ctx = canvas.getContext('2d')
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }

        if (result.landmarks && result.landmarks.length > 0) {
          let total = 0

          result.landmarks.forEach((landmarks) => {
            const { count, status } = analyzeFingers(landmarks)
            total += count

            // Draw skeleton & joints on debug canvas
            if (ctx && canvas) {
              const cw = canvas.width
              const ch = canvas.height

              // 1. Draw connections
              ctx.lineWidth = 3
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
              for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
                const p1 = landmarks[startIdx]
                const p2 = landmarks[endIdx]
                ctx.beginPath()
                ctx.moveTo(p1.x * cw, p1.y * ch)
                ctx.lineTo(p2.x * cw, p2.y * ch)
                ctx.stroke()
              }

              // 2. Draw landmark points
              landmarks.forEach((lm, idx) => {
                const x = lm.x * cw
                const y = lm.y * ch
                const fingerName = TIP_INDEX_MAP[idx]
                const isTip = Boolean(fingerName)
                const isExtended = isTip && status[fingerName]

                ctx.beginPath()
                ctx.arc(x, y, isTip ? 6 : 4, 0, 2 * Math.PI)

                if (isTip) {
                  // Green for open finger tip, red for closed finger tip
                  ctx.fillStyle = isExtended ? '#22c55e' : '#ef4444'
                  ctx.strokeStyle = '#ffffff'
                  ctx.lineWidth = 2
                  ctx.fill()
                  ctx.stroke()
                } else {
                  // White/cyan for inner joints
                  ctx.fillStyle = '#38bdf8'
                  ctx.fill()
                }
              })
            }
          })

          const finalNumber = Math.min(total, 10)
          setNumber(finalNumber)

          // Check if both hands are detected and ready for a clap detection
          if (finalNumber === 10) {
            wasTenRef.current = true
          }

          // Detect clap when 2 hands come very close together after 10
          if (result.landmarks.length >= 2) {
            const wrist1 = result.landmarks[0][0]
            const wrist2 = result.landmarks[1][0]
            const palm1 = result.landmarks[0][9]
            const palm2 = result.landmarks[1][9]

            const distWrists = Math.hypot(wrist1.x - wrist2.x, wrist1.y - wrist2.y)
            const distPalms = Math.hypot(palm1.x - palm2.x, palm1.y - palm2.y)

            const now = performance.now()
            // If palms come very close (< 0.18 normalized distance) and was recently 10
            if (wasTenRef.current && (distPalms < 0.16 || distWrists < 0.2)) {
              if (now - lastClapTimeRef.current > 1000) {
                lastClapTimeRef.current = now
                setIsClapped(true)
                wasTenRef.current = false
                // Reset clap state after triggering
                setTimeout(() => setIsClapped(false), 200)
              }
            }
          }
        } else {
          setNumber(0)
        }
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    init()

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      landmarkerRef.current?.close()
      const stream = videoRef.current?.srcObject
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return { videoRef, canvasRef, number, isClapped, ready, error }
}
