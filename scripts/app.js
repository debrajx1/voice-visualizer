/**
 * app.js — Application orchestrator
 * Manages permission flow, initializes all modules,
 * handles UI controls, keyboard shortcuts, and toasts.
 */

import { setupAudio, stopAudio, setSensitivity, audioStats } from './audioProcessor.js';
import { renderVisualization, setVisualizerMode, getVisualizerMode } from './visualizer.js';
import { setupScreenshot } from './screenshot.js';

/* ---- DOM References ---- */
const overlay = document.getElementById('permissionOverlay');
const permissionBtn = document.getElementById('permissionBtn');
const app = document.getElementById('app');

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const screenshotBtn = document.getElementById('screenshotBtn');

const modeSelector = document.getElementById('modeSelector');
const themeSelector = document.getElementById('themeSelector');
const sensitivitySlider = document.getElementById('sensitivitySlider');

const dbValue = document.getElementById('dbValue');
const freqValue = document.getElementById('freqValue');
const peakBar = document.getElementById('peakBar');

/* ---- State ---- */
let isRunning = false;
let statsUpdateCounter = 0;

/* ============================================================
   Toast System
   ============================================================ */
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast--out');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

// Expose globally for screenshot.js
window.__showToast = showToast;

/* ============================================================
   Permission Flow
   ============================================================ */
permissionBtn.addEventListener('click', async () => {
  permissionBtn.disabled = true;
  permissionBtn.innerHTML = '<span>Connecting…</span>';

  try {
    await startVisualization();
    // Hide overlay
    overlay.classList.add('overlay--hidden');
    app.style.display = 'flex';
    isRunning = true;
    updateButtonStates();
    showToast('🎤 Microphone connected', 'success');
  } catch (err) {
    permissionBtn.disabled = false;
    permissionBtn.innerHTML = '<span class="btn__icon">🎤</span><span>Allow Microphone</span>';
    showToast('Microphone access denied — please allow permission', 'error', 5000);
  }
});

/* ============================================================
   Start / Stop
   ============================================================ */
async function startVisualization() {
  await setupAudio((data, stats) => {
    renderVisualization(data, stats);
    updateStats(stats);
  });
  isRunning = true;
  updateButtonStates();
}

function stopVisualization() {
  stopAudio();
  isRunning = false;
  updateButtonStates();
  resetStats();
  showToast('⏹ Visualization stopped', 'info');
}

startBtn.addEventListener('click', async () => {
  startBtn.disabled = true;
  try {
    await startVisualization();
    showToast('▶ Visualization started', 'success');
  } catch {
    showToast('Could not start — microphone error', 'error');
    startBtn.disabled = false;
  }
});

stopBtn.addEventListener('click', stopVisualization);

/* ============================================================
   Button State Management
   ============================================================ */
function updateButtonStates() {
  startBtn.disabled = isRunning;
  stopBtn.disabled = !isRunning;
}

/* ============================================================
   Stats Display
   ============================================================ */
function updateStats(stats) {
  // Throttle UI updates to ~15fps for stats
  statsUpdateCounter++;
  if (statsUpdateCounter % 4 !== 0) return;

  // dB
  const db = stats.db;
  if (db === -Infinity) {
    dbValue.textContent = '—';
  } else {
    dbValue.textContent = `${Math.round(db)} dB`;
  }

  // Frequency
  freqValue.textContent = stats.frequency > 0 ? `${stats.frequency} Hz` : '—';

  // Peak bar
  const peakPercent = Math.min(100, Math.round(stats.peak * 100));
  peakBar.style.width = peakPercent + '%';
}

function resetStats() {
  dbValue.textContent = '—';
  freqValue.textContent = '—';
  peakBar.style.width = '0%';
}

/* ============================================================
   Controls: Mode, Theme, Sensitivity
   ============================================================ */
modeSelector.addEventListener('change', (e) => {
  setVisualizerMode(e.target.value);
  showToast(`Mode: ${e.target.value}`, 'info', 1500);
});

themeSelector.addEventListener('change', (e) => {
  document.body.className = e.target.value;
  showToast(`Theme: ${e.target.selectedOptions[0].textContent.trim()}`, 'info', 1500);
});

sensitivitySlider.addEventListener('input', (e) => {
  setSensitivity(parseFloat(e.target.value));
});

// Apply default theme on load
document.body.className = themeSelector.value;

/* ============================================================
   Keyboard Shortcuts
   ============================================================ */
document.addEventListener('keydown', (e) => {
  // Don't trigger shortcuts when typing in inputs
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

  switch (e.key.toLowerCase()) {
    case ' ':
      e.preventDefault();
      if (isRunning) {
        stopVisualization();
      } else {
        startBtn.click();
      }
      break;

    case 't': {
      // Cycle to next theme
      const idx = themeSelector.selectedIndex;
      themeSelector.selectedIndex = (idx + 1) % themeSelector.options.length;
      themeSelector.dispatchEvent(new Event('change'));
      break;
    }

    case 'm': {
      // Cycle to next mode
      const idx = modeSelector.selectedIndex;
      modeSelector.selectedIndex = (idx + 1) % modeSelector.options.length;
      modeSelector.dispatchEvent(new Event('change'));
      break;
    }
  }
});

/* ============================================================
   Screenshot Init
   ============================================================ */
setupScreenshot();
