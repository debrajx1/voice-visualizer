import { stopAudio } from './audioProcessor.js';
import { setVisualizerMode } from './visualizer.js'; // <-- ADD THIS

export function setupControls(startAudioCallback) {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const themeSelector = document.getElementById('themeSelector');
  const modeSelector = document.getElementById('modeSelector'); // <-- ADD THIS

  startBtn.onclick = () => {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    startAudioCallback();
  };

  stopBtn.onclick = () => {
    stopBtn.disabled = true;
    startBtn.disabled = false;
    stopAudio();
  };

  themeSelector.onchange = (e) => {
    document.body.className = e.target.value;
  };

  if (modeSelector) {
    modeSelector.onchange = (e) => {
      setVisualizerMode(e.target.value); // Update waveform drawing mode
    };
  }
}
