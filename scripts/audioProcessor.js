import { drawCircularWaveform } from './visualizer.js';

let audioContext;
let analyser;
let source;
let dataArray;
let animationId;

/**
 * Setup the audio context, microphone stream, and visualization.
 */
export function setupAudio() {
  const canvas = document.getElementById('waveform');
  const ctx = canvas.getContext('2d');
  resizeCanvas(canvas);

  applySelectedTheme(); // Apply theme on audio setup

  // Access the microphone and setup the audio stream
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      source = audioContext.createMediaStreamSource(stream);

      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);

      function draw() {
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCircularWaveform(ctx, dataArray);
        animationId = requestAnimationFrame(draw);
      }

      draw();
    })
    .catch((err) => {
      console.error('Microphone access error:', err);
      alert("Microphone permission is required.");
    });
}

/**
 * Stop the audio context and clean up resources.
 */
export function stopAudio() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  if (source?.mediaStream) {
    source.mediaStream.getTracks().forEach(track => track.stop());
  }

  if (audioContext) {
    audioContext.close().catch(err => {
      console.error("Error closing audio context:", err);
    });
    audioContext = null;
  }
}

/**
 * Resize the canvas to fit the window dimensions.
 * @param {HTMLCanvasElement} canvas - The canvas element to resize.
 */
function resizeCanvas(canvas) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

/**
 * Apply the currently selected theme from the dropdown to the body.
 */
function applySelectedTheme() {
  const themeSelector = document.getElementById('themeSelector');
  if (themeSelector) {
    const selectedTheme = themeSelector.value;
    document.body.className = selectedTheme; // Update body class to match theme
  }

  // Listen for future theme changes
  themeSelector?.addEventListener('change', () => {
    document.body.className = themeSelector.value;
  });
}
