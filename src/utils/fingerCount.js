// MediaPipe Hand Landmarker indices:
// 0 wrist, 4 thumb tip, 8 index tip, 12 middle tip, 16 ring tip, 20 pinky tip
const TIP = { index: 8, middle: 12, ring: 16, pinky: 20 }
const PIP = { index: 6, middle: 10, ring: 14, pinky: 18 }

// Counts how many fingers are extended on a single hand.
// `handedness` is "Left" or "Right" as reported by MediaPipe, needed
// because the thumb opens sideways instead of up/down.
export function countFingers(landmarks, handedness) {
  let count = 0

  // Index / middle / ring / pinky: extended when the tip is above (smaller y)
  // than the middle knuckle (PIP joint).
  for (const finger of ['index', 'middle', 'ring', 'pinky']) {
    if (landmarks[TIP[finger]].y < landmarks[PIP[finger]].y) {
      count++
    }
  }

  // Thumb: compare x position of tip vs. the joint below it (landmark 3).
  const thumbTip = landmarks[4]
  const thumbIp = landmarks[3]
  const isRight = handedness === 'Right'

  if (isRight ? thumbTip.x < thumbIp.x : thumbTip.x > thumbIp.x) {
    count++
  }

  return count
}
