/* ============================================
   HAND TRACKING — MediaPipe Hands Setup
   Single stream, reused across screens
   ============================================ */

const HandTracking = (() => {
  let hands = null;
  let stream = null;
  let activeVideo = null;
  let activeCanvas = null;
  let activeCanvasCtx = null;
  let onResultsCallback = null;
  let isRunning = false;
  let animFrameId = null;
  let scriptsLoaded = false;

  async function loadScripts() {
    if (scriptsLoaded) return;
    const scripts = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
    ];

    for (const src of scripts) {
      await new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    scriptsLoaded = true;
  }

  // Initialize MediaPipe + get camera stream (called once)
  async function init(onResults) {
    onResultsCallback = onResults;

    await loadScripts();

    if (!hands) {
      hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
      });

      hands.onResults(handleResults);
    }

    // Get camera stream once
    if (!stream) {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
    }
  }

  // Attach stream to a video element and start processing
  function attachTo(video, canvas) {
    activeVideo = video;
    activeCanvas = canvas;
    activeCanvasCtx = canvas.getContext('2d');

    // Attach the shared stream to this video element
    if (activeVideo.srcObject !== stream) {
      activeVideo.srcObject = stream;
    }

    if (!isRunning) {
      isRunning = true;
      processFrame();
    }
  }

  async function processFrame() {
    if (!isRunning || !activeVideo || !hands) return;

    if (activeVideo.readyState >= 2) {
      await hands.send({ image: activeVideo });
    }

    animFrameId = requestAnimationFrame(processFrame);
  }

  function handleResults(results) {
    if (!activeCanvas || !activeCanvasCtx) return;

    activeCanvas.width = activeCanvas.clientWidth;
    activeCanvas.height = activeCanvas.clientHeight;

    activeCanvasCtx.save();
    activeCanvasCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);

    // Mirror the canvas
    activeCanvasCtx.translate(activeCanvas.width, 0);
    activeCanvasCtx.scale(-1, 1);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(activeCanvasCtx, landmarks, HAND_CONNECTIONS, {
          color: 'rgba(74, 158, 255, 0.4)',
          lineWidth: 2
        });
        drawLandmarks(activeCanvasCtx, landmarks, {
          color: 'rgba(74, 158, 255, 0.8)',
          lineWidth: 1,
          radius: 3
        });
      }
    }

    activeCanvasCtx.restore();

    if (onResultsCallback) {
      onResultsCallback(results);
    }
  }

  // Stop processing frames (but keep the stream alive)
  function pause() {
    isRunning = false;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  // Fully stop and release camera (only on menu/gameover)
  function stop() {
    pause();
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    if (activeVideo) {
      activeVideo.srcObject = null;
    }
  }

  return { init, attachTo, pause, stop };
})();
