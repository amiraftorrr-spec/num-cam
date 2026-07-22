import { useEffect, useRef, useState } from 'react'
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { countFingers } from '../utils/fingerCount'

// Requests the camera, loads MediaPipe's HandLandmarker model, and runs
// a detection loop that turns the visible fingers (across up to 2 hands)
// into a number from 0 to 10.
export function useHandGesture() {
  const videoRef = useRef(null)
  const landmarkerRef = useRef(null)
  const rafRef = useRef(null)

  const [number, setNumber] = useState(0)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

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
      const landmarker = landmarkerRef.current

      if (video && landmarker && video.readyState >= 2) {
        const result = landmarker.detectForVideo(video, performance.now())

        if (result.landmarks && result.landmarks.length > 0) {
          let total = 0
          result.landmarks.forEach((landmarks, i) => {
            const handedness =
              result.handedness?.[i]?.[0]?.categoryName || 'Right'
            total += countFingers(landmarks, handedness)
          })
          setNumber(Math.min(total, 10))
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

  return { videoRef, number, ready, error }
}
