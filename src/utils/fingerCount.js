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

// Analyzes landmarks for a single hand and determines which fingers are extended.
export function analyzeFingers(landmarks) {
  const wrist = landmarks[0]

  const thumbCmc = landmarks[1]
  const thumbMcp = landmarks[2]
  const thumbIp = landmarks[3]
  const thumbTip = landmarks[4]

  const indexMcp = landmarks[5]
  const indexPip = landmarks[6]
  const indexTip = landmarks[8]

  const middleMcp = landmarks[9]
  const middlePip = landmarks[10]
  const middleTip = landmarks[12]

  const ringMcp = landmarks[13]
  const ringPip = landmarks[14]
  const ringTip = landmarks[16]

  const pinkyMcp = landmarks[17]
  const pinkyPip = landmarks[18]
  const pinkyTip = landmarks[20]

  // Hand reference scales
  // 1. Palm width (index MCP to pinky MCP)
  const palmWidth = getDistance(indexMcp, pinkyMcp) || 0.08
  // 2. Hand height (wrist to middle MCP)
  const handHeight = getDistance(wrist, middleMcp) || 0.1

  const status = {
    thumb: false,
    index: false,
    middle: false,
    ring: false,
    pinky: false,
  }

  // --- 1. FOUR FINGERS (Index, Middle, Ring, Pinky) ---
  const checkFinger = (tip, pip, mcp) => {
    const distTipMcp = getDistance(tip, mcp)
    const distPipMcp = getDistance(pip, mcp)
    const distTipWrist = getDistance(tip, wrist)
    const distPipWrist = getDistance(pip, wrist)

    // When extended, tip is significantly further from MCP and wrist than PIP
    const isExtendedRatio = distTipMcp > distPipMcp * 1.15
    const isTipFurtherThanPip = distTipWrist > distPipWrist * 0.95
    // Upright hand fallback
    const isUpward = tip.y < pip.y && distTipWrist > handHeight * 0.9

    return (isExtendedRatio && isTipFurtherThanPip) || isUpward
  }

  status.index = checkFinger(indexTip, indexPip, indexMcp)
  status.middle = checkFinger(middleTip, middlePip, middleMcp)
  status.ring = checkFinger(ringTip, ringPip, ringMcp)
  status.pinky = checkFinger(pinkyTip, pinkyPip, pinkyMcp)

  // --- 2. THUMB ---
  // Key distances for thumb analysis
  const distThumbTipToPinky = getDistance(thumbTip, pinkyMcp)
  const distThumbTipToIndex = getDistance(thumbTip, indexMcp)
  const distThumbTipToMiddle = getDistance(thumbTip, middleMcp)
  const distThumbTipToCmc = getDistance(thumbTip, thumbCmc)
  const distThumbIpToCmc = getDistance(thumbIp, thumbCmc)
  const distThumbTipToMcp = getDistance(thumbTip, thumbMcp)
  const distThumbIpToMcp = getDistance(thumbIp, thumbMcp)
  const distThumbTipToWrist = getDistance(thumbTip, wrist)
  const distThumbMcpToWrist = getDistance(thumbMcp, wrist)

  // A: Thumb is straightened / uncurled from its joints
  const isThumbStraight =
    distThumbTipToCmc > distThumbIpToCmc * 1.08 &&
    distThumbTipToMcp > distThumbIpToMcp * 1.02

  // B: Direction check: thumb tip must point outward (away from pinky side), not tucked inside/across the palm
  // Distance from thumb tip to pinky MCP must be greater than distance from thumb MCP/IP to pinky MCP
  const distThumbIpToPinky = getDistance(thumbIp, pinkyMcp)
  const distThumbMcpToPinky = getDistance(thumbMcp, pinkyMcp)
  const isPointingOutward =
    distThumbTipToPinky > distThumbIpToPinky &&
    distThumbTipToPinky > distThumbMcpToPinky

  // C: Thumb is clearly spread away from palm (not resting on index or curled inward into fist)
  const isThumbAwayFromPalm =
    distThumbTipToPinky > palmWidth * 1.25 &&
    distThumbTipToIndex > palmWidth * 0.58 &&
    distThumbTipToMiddle > palmWidth * 0.75

  // D: Thumbs-up (pointing clearly upward and outward from wrist)
  const isThumbUpward =
    thumbTip.y < thumbIp.y &&
    thumbTip.y < thumbMcp.y &&
    distThumbTipToWrist > distThumbMcpToWrist * 1.15 &&
    distThumbTipToIndex > palmWidth * 0.5

  // E: In a fist or folded inside palm, thumb is never counted
  const isFoldedInside =
    !isPointingOutward ||
    distThumbTipToIndex < palmWidth * 0.52 ||
    distThumbTipToPinky < palmWidth * 1.18

  const thumbExtended =
    !isFoldedInside &&
    isThumbStraight &&
    (isThumbAwayFromPalm || isThumbUpward)

  status.thumb = thumbExtended

  const count = Object.values(status).filter(Boolean).length
  return { count, status }
}

export function countFingers(landmarks) {
  return analyzeFingers(landmarks).count
}


