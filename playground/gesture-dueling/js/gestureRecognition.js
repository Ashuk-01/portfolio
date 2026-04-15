/* ============================================
   GESTURE RECOGNITION
   Classify hand landmarks into spells
   ============================================ */

const GestureRecognition = (() => {
  const SPELLS = {
    FIRE: 'fire',       // Rock
    SHIELD: 'shield',   // Paper
    LIGHTNING: 'lightning', // Scissors
    HEAL: 'heal',
    NONE: 'none'
  };

  let lastGesture = SPELLS.NONE;
  let gestureFrameCount = 0;
  const STABILITY_THRESHOLD = 8;
  let lockedSpell = null;

  // Debug info (visible during calibration/casting)
  let debugInfo = '';

  function dist(a, b) {
    return Math.sqrt(
      (a.x - b.x) ** 2 +
      (a.y - b.y) ** 2 +
      (a.z - b.z) ** 2
    );
  }

  // Check if finger is extended by comparing angles
  // When curled: TIP is close to or behind PIP relative to MCP
  // When extended: TIP is far ahead of PIP relative to MCP
  function fingerCurl(landmarks, tip, dip, pip, mcp) {
    // Method: compare TIP-to-WRIST distance vs MCP-to-WRIST distance
    // Extended finger: tip is farther from wrist than mcp
    // Curled finger: tip is closer to wrist than mcp (or similar)
    const wrist = landmarks[0];
    const tipToWrist = dist(landmarks[tip], wrist);
    const mcpToWrist = dist(landmarks[mcp], wrist);

    if (mcpToWrist === 0) return 0;
    return tipToWrist / mcpToWrist;
  }

  function thumbCurl(landmarks) {
    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    const thumbMcp = landmarks[2];
    const indexMcp = landmarks[5];
    const middleMcp = landmarks[9];

    // Check if thumb tip is far from the palm center
    // Palm center approximated by average of index and middle MCP
    const palmX = (indexMcp.x + middleMcp.x) / 2;
    const palmY = (indexMcp.y + middleMcp.y) / 2;
    const palmZ = (indexMcp.z + middleMcp.z) / 2;
    const palm = { x: palmX, y: palmY, z: palmZ };

    const tipToPalm = dist(thumbTip, palm);
    const mcpToPalm = dist(thumbMcp, palm);

    if (mcpToPalm === 0) return 0;
    return tipToPalm / mcpToPalm;
  }

  function classifyGesture(landmarks) {
    if (!landmarks || landmarks.length < 21) return SPELLS.NONE;

    // Get curl ratios (higher = more extended)
    const indexR = fingerCurl(landmarks, 8, 7, 6, 5);
    const middleR = fingerCurl(landmarks, 12, 11, 10, 9);
    const ringR = fingerCurl(landmarks, 16, 15, 14, 13);
    const pinkyR = fingerCurl(landmarks, 20, 19, 18, 17);
    const thumbR = thumbCurl(landmarks);

    // Thresholds: when finger tip is farther from wrist than MCP
    // Extended: ratio > 1.3 (tip is 30% farther than MCP from wrist)
    // Curled: ratio < 1.1 (tip is about same distance as MCP or closer)
    const EXT = 1.3;
    const CURL = 1.1;

    const indexUp = indexR > EXT;
    const middleUp = middleR > EXT;
    const ringUp = ringR > EXT;
    const pinkyUp = pinkyR > EXT;
    const thumbUp = thumbR > 1.5;

    const indexDown = indexR < CURL;
    const middleDown = middleR < CURL;
    const ringDown = ringR < CURL;
    const pinkyDown = pinkyR < CURL;

    const countUp = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean).length;
    const countDown = [indexDown, middleDown, ringDown, pinkyDown].filter(Boolean).length;

    // Debug
    debugInfo = `I:${indexR.toFixed(2)} M:${middleR.toFixed(2)} R:${ringR.toFixed(2)} P:${pinkyR.toFixed(2)} T:${thumbR.toFixed(2)} | Up:${countUp} Dn:${countDown}`;

    // ---- SCISSORS (✌️): index + middle extended, ring + pinky NOT ----
    if (indexUp && middleUp && !pinkyUp && !ringUp) {
      return SPELLS.LIGHTNING;
    }
    // Lenient: index + middle clearly above ring + pinky
    if (indexUp && middleUp && ringR < EXT && pinkyR < EXT) {
      return SPELLS.LIGHTNING;
    }

    // ---- PAPER (🖐): 4 fingers extended ----
    if (countUp >= 4) {
      return SPELLS.SHIELD;
    }
    if (countUp >= 3 && thumbUp) {
      return SPELLS.SHIELD;
    }

    // ---- THUMBS UP (👍): thumb out, all fingers curled ----
    if (thumbUp && countDown >= 3 && !indexUp && !middleUp) {
      return SPELLS.HEAL;
    }

    // ---- ROCK (✊): all fingers curled ----
    if (countDown >= 3 && !indexUp && !middleUp) {
      return SPELLS.FIRE;
    }
    if (countUp === 0) {
      return SPELLS.FIRE;
    }

    return SPELLS.NONE;
  }

  function getDebugInfo() {
    return debugInfo;
  }

  function update(landmarks) {
    if (lockedSpell) return lockedSpell;

    const currentGesture = classifyGesture(landmarks);

    if (currentGesture === lastGesture && currentGesture !== SPELLS.NONE) {
      gestureFrameCount++;
    } else {
      lastGesture = currentGesture;
      gestureFrameCount = currentGesture !== SPELLS.NONE ? 1 : 0;
    }

    return {
      currentGesture,
      isStable: gestureFrameCount >= STABILITY_THRESHOLD,
      progress: Math.min(gestureFrameCount / STABILITY_THRESHOLD, 1),
      lockedSpell
    };
  }

  function lockSpell() {
    if (gestureFrameCount >= STABILITY_THRESHOLD && lastGesture !== SPELLS.NONE) {
      lockedSpell = lastGesture;
      return lockedSpell;
    }
    return null;
  }

  function reset() {
    lastGesture = SPELLS.NONE;
    gestureFrameCount = 0;
    lockedSpell = null;
  }

  function getLockedSpell() {
    return lockedSpell;
  }

  return { SPELLS, update, lockSpell, reset, getLockedSpell, classifyGesture, getDebugInfo };
})();
