/**
 * audioProcessor.js — Audio capture, analysis, and stats
 * Handles microphone access, gain/sensitivity, FFT analysis,
 * and exports real-time audio statistics.
 */

let audioContext = null;
let analyser = null;
let source = null;
let gainNode = null;
let dataArray = null;
let animationId = null;
let stream = null;

// Audio stats (exported)
export const audioStats = {
  db: -Infinity,
  frequency: 0,
  peak: 0,
  peakDecay: 0,
  isActive: false,
};

// Smoothed data for visuals
let smoothedData = null;

/**
 * Setup the audio pipeline: mic → gain → analyser → animation loop.
 * @param {Function} renderCallback - Called each frame with (dataArray, audioStats)
 * @returns {Promise<void>}
 */
export async function setupAudio(renderCallback) {
  const canvas = document.getElementById('waveform');
  resizeCanvas(canvas);

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    console.error('Microphone access error:', err);
    throw new Error('Microphone permission denied');
  }

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  source = audioContext.createMediaStreamSource(stream);

  // Gain node for sensitivity control
  gainNode = audioContext.createGain();
  gainNode.gain.value = 1.5;

  // Analyser
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.82;

  source.connect(gainNode);
  gainNode.connect(analyser);

  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  smoothedData = new Float32Array(bufferLength);

  audioStats.isActive = true;

  function tick() {
    analyser.getByteFrequencyData(dataArray);

    // Smooth data for visuals
    for (let i = 0; i < bufferLength; i++) {
      smoothedData[i] += (dataArray[i] - smoothedData[i]) * 0.3;
    }

    // Calculate stats
    computeStats(dataArray, bufferLength);

    // Pass smoothed data to render
    renderCallback(smoothedData, audioStats);

    animationId = requestAnimationFrame(tick);
  }

  tick();
}

/**
 * Stop audio processing and release resources.
 */
export function stopAudio() {
  audioStats.isActive = false;

  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }

  if (audioContext) {
    audioContext.close().catch(() => { });
    audioContext = null;
  }

  source = null;
  analyser = null;
  gainNode = null;
  dataArray = null;
  smoothedData = null;
}

/**
 * Set the microphone sensitivity (gain).
 * @param {number} value - Gain multiplier (0.5 – 3.0)
 */
export function setSensitivity(value) {
  if (gainNode) {
    gainNode.gain.setTargetAtTime(value, audioContext.currentTime, 0.05);
  }
}

/* ---- Internal helpers ---- */

/**
 * Compute dB level, dominant frequency, and peak from FFT data.
 */
function computeStats(data, length) {
  // RMS → dB
  let sum = 0;
  for (let i = 0; i < length; i++) {
    const v = data[i] / 255;
    sum += v * v;
  }
  const rms = Math.sqrt(sum / length);
  audioStats.db = rms > 0 ? 20 * Math.log10(rms) : -Infinity;

  // Dominant frequency (index of max FFT bin)
  let maxVal = 0;
  let maxIndex = 0;
  for (let i = 0; i < length; i++) {
    if (data[i] > maxVal) {
      maxVal = data[i];
      maxIndex = i;
    }
  }
  if (audioContext) {
    const nyquist = audioContext.sampleRate / 2;
    audioStats.frequency = Math.round((maxIndex / length) * nyquist);
  }

  // Peak with decay
  const normalizedPeak = maxVal / 255;
  if (normalizedPeak > audioStats.peak) {
    audioStats.peak = normalizedPeak;
  } else {
    audioStats.peak *= 0.97; // decay
  }
}

/**
 * Resize the canvas to fit the window, accounting for DPI.
 */
function resizeCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;

  function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }

  resize();
  window.addEventListener('resize', resize);
}
