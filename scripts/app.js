import { setupAudio, stopAudio } from './audioProcessor.js';
import { setVisualizerMode } from './visualizer.js'; // Optional, if using themes
import { setupScreenshot } from './screenshot.js'; // ✅ Add this line

window.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const themeSelector = document.getElementById('themeSelector');

  startBtn.onclick = () => {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    setupAudio(); // Start microphone + visualizer
  };

  stopBtn.onclick = () => {
    stopAudio(); // Stop visualizer + mic stream
    stopBtn.disabled = true;
    startBtn.disabled = false;
  };

  themeSelector.onchange = (e) => {
    document.body.className = e.target.value;
    setVisualizerMode(e.target.value); // If you're using visualizer mode
  };

  setupScreenshot(); // 👈 Initialize screenshot functionality
});
