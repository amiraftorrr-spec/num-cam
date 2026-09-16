import { useEffect, useRef, useState } from 'react'
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { analyzeFingers } from '../utils/fingerCount'
import { sound } from '../utils/soundFX'

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

export function useHandGesture(currentMode = 'magic', drawSkeleton = true) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const landmarkerRef = useRef(null)
  const rafRef = useRef(null)
  const modeRef = useRef(currentMode)
  const drawSkeletonRef = useRef(drawSkeleton)

  useEffect(() => {
    modeRef.current = currentMode
  }, [currentMode])

  useEffect(() => {
    drawSkeletonRef.current = drawSkeleton
  }, [drawSkeleton])

  const [number, setNumber] = useState(0)
  const [specialGesture, setSpecialGesture] = useState(null)
  const [handPhysics, setHandPhysics] = useState({ hands: [], isFist: false })
  const [isClapped, setIsClapped] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  const lastClapTimeRef = useRef(0)
  const wasTenRef = useRef(false)
  const wasFistRef = useRef(false)
  const gestureHistoryRef = useRef([])
  const stableGestureRef = useRef(0)

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
          video: {
            width: { ideal: 480 },
            height: { ideal: 360 },
            frameRate: { ideal: 30, max: 30 },
          },
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

    let lastVideoTime = -1
    let debugContext = null

    function loop() {
      if (cancelled) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const landmarker = landmarkerRef.current

      if (video && landmarker && video.readyState >= 2) {
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime
          const result = landmarker.detectForVideo(video, performance.now())

          let ctx = debugContext
          if (canvas) {
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
              canvas.width = video.videoWidth || 480
              canvas.height = video.videoHeight || 360
              debugContext = canvas.getContext('2d')
              ctx = debugContext
            }
            if (!debugContext) {
              debugContext = canvas.getContext('2d')
              ctx = debugContext
            }
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
          }

          if (result.landmarks && result.landmarks.length > 0) {
            let total = 0
            let special = null
            let fistDetected = false
            const handsData = []

            for (let i = 0; i < result.landmarks.length; i++) {
              const landmarks = result.landmarks[i]
              const {
                count,
                status,
                specialGesture: sg,
                isFist,
                isGun,
                isPinch,
                isIndexOnly,
                palmCenter,
                indexTip,
                thumbTip,
              } = analyzeFingers(landmarks)
              total += count

              if (modeRef.current === 'magic' && result.landmarks.length === 1 && sg === 'FUCK YOU') {
                special = sg
              }
              if (isFist && !['magic', 'game'].includes(modeRef.current)) {
                fistDetected = true
              }

              // Save hand center in normalized coordinates for magnet / forcefield physics
              // Note: camera is mirrored horizontally
              handsData.push({
                x: 1 - palmCenter.x,
                y: palmCenter.y,
                wristX: 1 - landmarks[0].x,
                wristY: landmarks[0].y,
                indexX: 1 - indexTip.x,
                indexY: indexTip.y,
                thumbX: 1 - thumbTip.x,
                thumbY: thumbTip.y,
                count,
                status,
                isFist,
                isGun,
                isPinch,
                isIndexOnly,
              })

              // Draw skeleton & joints on debug canvas
              if (drawSkeletonRef.current && ctx && canvas) {
                const cw = canvas.width
                const ch = canvas.height

                ctx.lineWidth = 2.5
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
                ctx.beginPath()
                for (let c = 0; c < HAND_CONNECTIONS.length; c++) {
                  const conn = HAND_CONNECTIONS[c]
                  const p1 = landmarks[conn[0]]
                  const p2 = landmarks[conn[1]]
                  ctx.moveTo(p1.x * cw, p1.y * ch)
                  ctx.lineTo(p2.x * cw, p2.y * ch)
                }
                ctx.stroke()

                for (let idx = 0; idx < landmarks.length; idx++) {
                  const lm = landmarks[idx]
                  const x = lm.x * cw
                  const y = lm.y * ch
                  const fingerName = TIP_INDEX_MAP[idx]
                  const isTip = Boolean(fingerName)
                  const isExtended = isTip && status[fingerName]

                  ctx.beginPath()
                  ctx.arc(x, y, isTip ? 5 : 3, 0, 2 * Math.PI)

                  if (isTip) {
                    ctx.fillStyle = isExtended ? '#22c55e' : '#ef4444'
                    ctx.fill()
                  } else {
                    ctx.fillStyle = '#38bdf8'
                    ctx.fill()
                  }
                }
              }
            }

            // Energy ball burst: If previously a fist and now opened to 5 or 10 -> Explosion blast!
            if (wasFistRef.current && (total >= 4 || total === 10)) {
              if (['magic'].includes(modeRef.current)) {
                sound.playExplosion()
              }
              setIsClapped(true)
              wasFistRef.current = false
              setTimeout(() => setIsClapped(false), 250)
            }
            if (fistDetected) {
              wasFistRef.current = true
            }

            let twoHandsDist = null
            let twoHandsCenter = null
            if (handsData.length >= 2) {
              const h1 = handsData[0]
              const h2 = handsData[1]
              twoHandsDist = Math.hypot(h1.x - h2.x, h1.y - h2.y)
              twoHandsCenter = {
                x: (h1.x + h2.x) / 2,
                y: (h1.y + h2.y) / 2,
              }
            }

            setHandPhysics({
              hands: handsData,
              isFist: fistDetected,
              twoHandsDist,
              twoHandsCenter,
            })

            const rawValue = special ? special : Math.min(total, 10)

            const history = gestureHistoryRef.current
            history.push(rawValue)
            if (history.length > 2) history.shift()

            if (history.length === 1 || history[0] === history[1]) {
              if (rawValue !== stableGestureRef.current) {
                stableGestureRef.current = rawValue
                setNumber(rawValue)
                setSpecialGesture(special)
              }
            }

            if (rawValue === 10) {
              wasTenRef.current = true
            }

            // Clap Detection (when 2 hands come close after 10)
            if (result.landmarks.length >= 2) {
              const wrist1 = result.landmarks[0][0]
              const wrist2 = result.landmarks[1][0]
              const palm1 = result.landmarks[0][9]
              const palm2 = result.landmarks[1][9]

              const distWrists = Math.hypot(wrist1.x - wrist2.x, wrist1.y - wrist2.y)
              const distPalms = Math.hypot(palm1.x - palm2.x, palm1.y - palm2.y)

              const now = performance.now()
              if (wasTenRef.current && (distPalms < 0.16 || distWrists < 0.2)) {
                if (now - lastClapTimeRef.current > 1000) {
                  lastClapTimeRef.current = now
                  if (['magic'].includes(modeRef.current)) {
                    sound.playExplosion()
                  }
                  setIsClapped(true)
                  wasTenRef.current = false
                  setTimeout(() => setIsClapped(false), 250)
                }
              }
            }
          } else {
            setHandPhysics({ hands: [], isFist: false })
            gestureHistoryRef.current.push(0)
            if (gestureHistoryRef.current.length > 2) gestureHistoryRef.current.shift()
            if (stableGestureRef.current !== 0) {
              stableGestureRef.current = 0
              setNumber(0)
              setSpecialGesture(null)
            }
          }
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

  return { videoRef, canvasRef, number, specialGesture, handPhysics, isClapped, ready, error }
}
