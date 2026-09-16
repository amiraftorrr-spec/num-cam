// MediaPipe Hand Landmarker indices:
// 0: Wrist
// Thumb: 1 CMC, 2 MCP, 3 IP, 4 TIP
// Index: 5 MCP, 6 PIP, 7 DIP, 8 TIP
// Middle: 9 MCP, 10 PIP, 11 DIP, 12 TIP
// Ring: 13 MCP, 14 PIP, 15 DIP, 16 TIP
// Pinky: 17 MCP, 18 PIP, 19 DIP, 20 TIP

function getDistance(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y)
}

// Highly reliable finger & thumb detector that accurately ignores folded/tucked thumbs
export function analyzeFingers(landmarks) {
  const wrist = landmarks[0]

  const thumbCmc = landmarks[1]
  const thumbMcp = landmarks[2]
  const thumbIp = landmarks[3]
  const thumbTip = landmarks[4]

  const indexMcp = landmarks[5]
  const indexPip = landmarks[6]
  const indexDip = landmarks[7]
  const indexTip = landmarks[8]

  const middleMcp = landmarks[9]
  const middlePip = landmarks[10]
  const middleDip = landmarks[11]
  const middleTip = landmarks[12]

  const ringMcp = landmarks[13]
  const ringPip = landmarks[14]
  const ringDip = landmarks[15]
  const ringTip = landmarks[16]

  const pinkyMcp = landmarks[17]
  const pinkyPip = landmarks[18]
  const pinkyDip = landmarks[19]
  const pinkyTip = landmarks[20]

  // Hand reference measurements
  const palmWidth = getDistance(indexMcp, pinkyMcp) || 0.08
  const handLength = getDistance(wrist, middleMcp) || 0.14
  const palmCenter = {
    x: (wrist.x + middleMcp.x) / 2,
    y: (wrist.y + middleMcp.y) / 2,
  }

  const status = {
    thumb: false,
    index: false,
    middle: false,
    ring: false,
    pinky: false,
  }

  // --- 1. FOUR FINGERS (Index, Middle, Ring, Pinky) ---
  const isExtendedFinger = (tip, dip, pip, mcp) => {
    const distTipWrist = getDistance(tip, wrist)
    const distPipWrist = getDistance(pip, wrist)
    const distTipMcp = getDistance(tip, mcp)
    const distPipMcp = getDistance(pip, mcp)
    const distDipMcp = getDistance(dip, mcp)

    // A finger is extended when tip is further from MCP and wrist than PIP and DIP
    const isUncurled = distTipMcp > distPipMcp * 1.2 && distTipMcp > distDipMcp * 1.05
    const isFarFromWrist = distTipWrist > distPipWrist * 1.06

    // Upright hand fallback when looking straight on
    const isUpright = tip.y < pip.y && tip.y < dip.y && distTipWrist > handLength * 0.88

    return (isUncurled && isFarFromWrist) || isUpright
  }

  status.index = isExtendedFinger(indexTip, indexDip, indexPip, indexMcp)
  status.middle = isExtendedFinger(middleTip, middleDip, middlePip, middleMcp)
  status.ring = isExtendedFinger(ringTip, ringDip, ringPip, ringMcp)
  status.pinky = isExtendedFinger(pinkyTip, pinkyDip, pinkyPip, pinkyMcp)

  // --- 2. THUMB DETECTION (Strict check: if tucked/inside, DO NOT count) ---
  const distTipPinky = getDistance(thumbTip, pinkyMcp)
  const distIpPinky = getDistance(thumbIp, pinkyMcp)
  const distMcpPinky = getDistance(thumbMcp, pinkyMcp)
  const distTipIndex = getDistance(thumbTip, indexMcp)
  const distTipMiddle = getDistance(thumbTip, middleMcp)
  const distTipPalmCenter = getDistance(thumbTip, palmCenter)
  const distTipWrist = getDistance(thumbTip, wrist)
  const distIpWrist = getDistance(thumbIp, wrist)
  const distMcpWrist = getDistance(thumbMcp, wrist)
  const distTipCmc = getDistance(thumbTip, thumbCmc)
  const distIpCmc = getDistance(thumbIp, thumbCmc)
  const distTipMcp = getDistance(thumbTip, thumbMcp)
  const distIpMcp = getDistance(thumbIp, thumbMcp)

  // Critical "Thumb is Inside / Folded" conditions:
  // 1. Tip is tucked against index finger or middle finger
  const isTuckedNearIndexOrMiddle = distTipIndex < palmWidth * 0.72 || distTipMiddle < palmWidth * 0.65
  // 2. Tip is placed inside palm center or across towards pinky
  const isTuckedInPalm = distTipPalmCenter < palmWidth * 0.78 || distTipPinky < distIpPinky * 0.98 || distTipPinky < distMcpPinky * 0.95
  // 3. Tip is curled back towards CMC/MCP (bent thumb)
  const isBentThumb = distTipCmc < distIpCmc * 1.12 || distTipMcp < distIpMcp * 1.05

  const isThumbInside = isTuckedNearIndexOrMiddle || isTuckedInPalm || isBentThumb

  // Valid Open Thumb conditions:
  // A. Extended outwards (open hand or spread thumb)
  const isOutwardSpread =
    !isThumbInside &&
    distTipPinky > distIpPinky * 1.06 &&
    distTipPinky > palmWidth * 1.32 &&
    distTipIndex > palmWidth * 0.75 &&
    distTipPalmCenter > palmWidth * 0.88 &&
    distTipCmc > distIpCmc * 1.18

  // B. Thumbs-up gesture (pointing up and away from hand)
  const isThumbsUp =
    !isBentThumb &&
    thumbTip.y < thumbIp.y &&
    thumbTip.y < thumbMcp.y &&
    distTipWrist > distMcpWrist * 1.25 &&
    distTipIndex > palmWidth * 0.62

  status.thumb = isOutwardSpread || isThumbsUp

  // --- SPECIAL MAGIC GESTURES ---
  // 1. Single middle finger (FUCK YOU)
  const isMiddleFingerOnly =
    status.middle && !status.index && !status.ring && !status.pinky && !status.thumb

  // 2. Fist / Energy Ball (✊ All fingers closed)
  const isFist = !status.thumb && !status.index && !status.middle && !status.ring && !status.pinky

  // 3. Peace sign (✌️ Index + Middle open, others closed)
  const isPeace = status.index && status.middle && !status.ring && !status.pinky && !status.thumb

  // 4. Rock on (🤘 Index + Pinky open, middle & ring closed)
  const isRock = status.index && status.pinky && !status.middle && !status.ring

  // 5. OK sign (👌 Thumb tip and Index tip touching, other 3 fingers open)
  const distThumbTipIndexTip = getDistance(thumbTip, indexTip)
  const isOkSign = distThumbTipIndexTip < palmWidth * 0.38 && status.middle && status.ring

  // 6. Spider-Man Web Shooter (🤟 Thumb + Index + Pinky open, Middle + Ring closed tightly)
  const isSpiderman =
    status.thumb &&
    status.index &&
    status.pinky &&
    !status.middle &&
    !status.ring &&
    distTipPalmCenter > palmWidth * 0.9

  // 7. Finger Gun (👉 Thumb + Index extended, Middle, Ring, Pinky curled)
  const isGun =
    status.index &&
    status.thumb &&
    !status.middle &&
    !status.ring &&
    !status.pinky

  // 8. Alien Vulcan Salute (🖖 Live Long and Prosper - Index+Middle together, Ring+Pinky together, gap between Middle & Ring)
  const distIndexMiddle = getDistance(indexTip, middleTip)
  const distRingPinky = getDistance(ringTip, pinkyTip)
  const distMiddleRing = getDistance(middleTip, ringTip)
  const isVulcan =
    status.index &&
    status.middle &&
    status.ring &&
    status.pinky &&
    distIndexMiddle < palmWidth * 0.55 &&
    distRingPinky < palmWidth * 0.55 &&
    distMiddleRing > palmWidth * 0.75

  // 9. Pinch Drawing Mode (🤏 Index tip & Thumb tip very close together)
  const isPinch = distThumbTipIndexTip < palmWidth * 0.42

  // 10. Single Index Pointing (☝️ Only Index extended)
  const isIndexOnly = status.index && !status.middle && !status.ring && !status.pinky && !status.thumb

  let specialGesture = null
  if (isMiddleFingerOnly) specialGesture = 'FUCK YOU'
  else if (isPeace) specialGesture = 'HEART'
  else if (isRock) specialGesture = 'LIGHTNING'
  else if (isOkSign) specialGesture = 'VORTEX'
  else if (isSpiderman) specialGesture = 'SPIDER'
  else if (isVulcan) specialGesture = 'ALIEN'
  else if (isGun) specialGesture = 'GUN'
  else if (isFist) specialGesture = 'FIST'

  const count = Object.values(status).filter(Boolean).length
  return {
    count,
    status,
    specialGesture,
    isFist,
    isGun,
    isPinch,
    isIndexOnly,
    palmCenter,
    indexTip,
    thumbTip,
  }
}

export function countFingers(landmarks) {
  return analyzeFingers(landmarks).count
}


