/**
 * visualizer.js — Multi-mode audio visualization renderer
 * Modes: circular, bars, wave, particles
 * Reads CSS custom properties from the active theme.
 */

let currentMode = 'circular';
let particles = [];
const PARTICLE_COUNT = 200;
let canvasW = 0;
let canvasH = 0;

// Transition state
let prevMode = null;
let transitionAlpha = 1;

/**
 * Set the active visualization mode.
 * @param {'circular'|'bars'|'wave'|'particles'} mode
 */
export function setVisualizerMode(mode) {
  if (mode === currentMode) return;
  prevMode = currentMode;
  currentMode = mode;
  transitionAlpha = 0;

  // Re-initialize particles if switching to particles mode
  if (mode === 'particles') {
    initParticles();
  }
}

/**
 * Get the current visualization mode.
 */
export function getVisualizerMode() {
  return currentMode;
}

/**
 * Main render function — called each frame by the audio loop.
 * @param {Float32Array} data - Smoothed frequency data
 * @param {object} stats - Audio stats { db, frequency, peak }
 */
export function renderVisualization(data, stats) {
  const canvas = document.getElementById('waveform');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  canvasW = canvas.width / dpr;
  canvasH = canvas.height / dpr;

  // Clear
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // Read theme colors from CSS
  const style = getComputedStyle(document.documentElement);
  const barH = parseFloat(style.getPropertyValue('--theme-bar-h')) || 270;
  const barS = style.getPropertyValue('--theme-bar-s')?.trim() || '80%';
  const barL = style.getPropertyValue('--theme-bar-l')?.trim() || '60%';
  const glowColor = style.getPropertyValue('--theme-glow')?.trim() || 'rgba(108,92,231,0.4)';
  const particleColor = style.getPropertyValue('--theme-particle')?.trim() || '#a29bfe';

  const theme = { barH, barS, barL, glowColor, particleColor };

  // Fade transition
  if (transitionAlpha < 1) {
    transitionAlpha = Math.min(1, transitionAlpha + 0.04);
  }

  ctx.globalAlpha = transitionAlpha;

  // Render current mode
  switch (currentMode) {
    case 'circular':
      drawCircular(ctx, data, stats, theme);
      break;
    case 'bars':
      drawBars(ctx, data, stats, theme);
      break;
    case 'wave':
      drawWave(ctx, data, stats, theme);
      break;
    case 'particles':
      drawParticles(ctx, data, stats, theme);
      break;
    default:
      drawCircular(ctx, data, stats, theme);
  }

  ctx.globalAlpha = 1;
}

/* ================================================================
   MODE 1: CIRCULAR
   ================================================================ */
function drawCircular(ctx, data, stats, theme) {
  const cx = canvasW / 2;
  const cy = canvasH / 2;
  const baseRadius = Math.min(canvasW, canvasH) * 0.2;
  const bars = data.length;
  const intensity = stats.peak;

  // Inner glow ring
  const gradient = ctx.createRadialGradient(cx, cy, baseRadius * 0.3, cx, cy, baseRadius * 1.2);
  gradient.addColorStop(0, theme.glowColor);
  gradient.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.arc(cx, cy, baseRadius * 1.2, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Inner circle
  ctx.beginPath();
  ctx.arc(cx, cy, baseRadius * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${theme.barH}, ${theme.barS}, ${theme.barL}, 0.08)`;
  ctx.fill();
  ctx.strokeStyle = `hsla(${theme.barH}, ${theme.barS}, ${theme.barL}, 0.25)`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Bars
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.save();
  ctx.translate(cx, cy);

  for (let i = 0; i < bars; i++) {
    const amplitude = data[i];
    const angle = (i / bars) * 2 * Math.PI;
    const barLength = amplitude * 0.55;

    const x = Math.cos(angle) * baseRadius;
    const y = Math.sin(angle) * baseRadius;
    const xEnd = Math.cos(angle) * (baseRadius + barLength);
    const yEnd = Math.sin(angle) * (baseRadius + barLength);

    const hue = (theme.barH + (i / bars) * 60) % 360;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(xEnd, yEnd);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = `hsla(${hue}, ${theme.barS}, ${theme.barL}, ${0.5 + (amplitude / 255) * 0.5})`;
    ctx.shadowColor = theme.glowColor;
    ctx.shadowBlur = amplitude > 150 ? 8 : 0;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

/* ================================================================
   MODE 2: BARS
   ================================================================ */
function drawBars(ctx, data, stats, theme) {
  const bars = Math.min(data.length, 128);
  const gap = 2;
  const totalGap = gap * (bars - 1);
  const barWidth = (canvasW - totalGap) / bars;
  const maxHeight = canvasH * 0.65;

  for (let i = 0; i < bars; i++) {
    const amplitude = data[i] / 255;
    const barHeight = amplitude * maxHeight;
    const x = i * (barWidth + gap);
    const y = canvasH - barHeight;

    // Bar gradient
    const hue = (theme.barH + (i / bars) * 50) % 360;
    const grad = ctx.createLinearGradient(x, canvasH, x, y);
    grad.addColorStop(0, `hsla(${hue}, ${theme.barS}, 30%, 0.3)`);
    grad.addColorStop(1, `hsla(${hue}, ${theme.barS}, ${theme.barL}, ${0.6 + amplitude * 0.4})`);

    // Main bar with rounded top
    ctx.beginPath();
    const radius = Math.min(barWidth / 2, 4);
    ctx.moveTo(x, canvasH);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.lineTo(x + barWidth - radius, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
    ctx.lineTo(x + barWidth, canvasH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Glow on strong bars
    if (amplitude > 0.6) {
      ctx.shadowColor = theme.glowColor;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Reflection
    const reflGrad = ctx.createLinearGradient(x, canvasH, x, canvasH + barHeight * 0.3);
    reflGrad.addColorStop(0, `hsla(${hue}, ${theme.barS}, ${theme.barL}, 0.12)`);
    reflGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = reflGrad;
    ctx.fillRect(x, canvasH, barWidth, barHeight * 0.3);
  }
}

/* ================================================================
   MODE 3: WAVE
   ================================================================ */
function drawWave(ctx, data, stats, theme) {
  const sliceWidth = canvasW / (data.length - 1);
  const centerY = canvasH / 2;

  // Draw multiple overlapping waves
  for (let layer = 0; layer < 3; layer++) {
    const offset = layer * 0.2;
    const alpha = 0.7 - layer * 0.2;
    const amplitude = (0.3 + layer * 0.08) * canvasH * 0.4;

    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let i = 0; i < data.length; i++) {
      const v = (data[i] / 255) * amplitude;
      const x = i * sliceWidth;
      const y = centerY + (i % 2 === 0 ? -v : v) * (1 - offset);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = (i - 1) * sliceWidth;
        const prevV = (data[i - 1] / 255) * amplitude;
        const prevY = centerY + ((i - 1) % 2 === 0 ? -prevV : prevV) * (1 - offset);
        const cpx = (prevX + x) / 2;
        ctx.quadraticCurveTo(prevX + (x - prevX) * 0.5, prevY, cpx, (prevY + y) / 2);
      }
    }

    // Stroke
    const hue = (theme.barH + layer * 30) % 360;
    ctx.strokeStyle = `hsla(${hue}, ${theme.barS}, ${theme.barL}, ${alpha})`;
    ctx.lineWidth = 2.5 - layer * 0.5;
    ctx.shadowColor = theme.glowColor;
    ctx.shadowBlur = layer === 0 ? 12 : 0;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Fill gradient under wave
    if (layer === 0) {
      ctx.lineTo(canvasW, centerY);
      ctx.lineTo(canvasW, canvasH);
      ctx.lineTo(0, canvasH);
      ctx.closePath();
      const fillGrad = ctx.createLinearGradient(0, centerY, 0, canvasH);
      fillGrad.addColorStop(0, `hsla(${theme.barH}, ${theme.barS}, ${theme.barL}, 0.15)`);
      fillGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = fillGrad;
      ctx.fill();
    }
  }
}

/* ================================================================
   MODE 4: PARTICLES
   ================================================================ */
function initParticles() {
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * (canvasW || window.innerWidth),
      y: Math.random() * (canvasH || window.innerHeight),
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      radius: Math.random() * 2 + 1,
      baseRadius: Math.random() * 2 + 1,
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.02 + 0.005,
    });
  }
}

function drawParticles(ctx, data, stats, theme) {
  if (particles.length === 0) initParticles();

  const cx = canvasW / 2;
  const cy = canvasH / 2;
  const intensity = stats.peak;

  // Average amplitude for this frame
  let avgAmp = 0;
  for (let i = 0; i < data.length; i++) avgAmp += data[i];
  avgAmp = avgAmp / data.length / 255;

  // Center glow
  const glowRadius = 80 + intensity * 120;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
  glow.addColorStop(0, theme.glowColor);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Update & draw particles
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    // Orbit + noise driven by audio
    p.angle += p.speed * (1 + intensity * 3);
    const orbitRadius = 50 + (i / PARTICLE_COUNT) * Math.min(canvasW, canvasH) * 0.4;
    const targetX = cx + Math.cos(p.angle) * orbitRadius * (1 + avgAmp * 0.5);
    const targetY = cy + Math.sin(p.angle) * orbitRadius * (1 + avgAmp * 0.5);

    // Easing towards target
    p.x += (targetX - p.x) * 0.03;
    p.y += (targetY - p.y) * 0.03;

    // Add some explosion on peaks
    if (intensity > 0.7) {
      p.x += (Math.random() - 0.5) * intensity * 8;
      p.y += (Math.random() - 0.5) * intensity * 8;
    }

    // Size varies with audio
    p.radius = p.baseRadius * (1 + avgAmp * 2);

    // Draw
    const hue = (theme.barH + (i / PARTICLE_COUNT) * 60) % 360;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, ${theme.barS}, ${theme.barL}, ${0.4 + avgAmp * 0.6})`;
    ctx.fill();

    // Glow on bright particles
    if (p.radius > 2.5) {
      ctx.shadowColor = theme.particleColor;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // Connection lines between nearby particles
  ctx.strokeStyle = `hsla(${theme.barH}, ${theme.barS}, ${theme.barL}, ${0.04 + avgAmp * 0.06})`;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < Math.min(i + 10, particles.length); j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 80) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
}
