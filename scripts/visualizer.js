let currentMode = 'default';

/**
 * Draw the circular waveform with enhanced visuals, gradients, and smooth transitions.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 * @param {Uint8Array} dataArray - The data array from the audio analyser.
 */
export function drawCircularWaveform(ctx, dataArray) {
  const { width, height } = ctx.canvas;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 180;
  const bars = dataArray.length;

  // Update mode based on selected theme
  const theme = document.body.className;
  setVisualizerMode(theme); // Set mode dynamically based on current body class

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.save();
  ctx.translate(centerX, centerY);

  for (let i = 0; i < bars; i++) {
    const amplitude = dataArray[i];
    const angle = (i / bars) * 2 * Math.PI;
    const barLength = amplitude * 0.6;

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const xEnd = Math.cos(angle) * (radius + barLength);
    const yEnd = Math.sin(angle) * (radius + barLength);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(xEnd, yEnd);
    ctx.lineWidth = 4;

    ctx.strokeStyle = getColor(i, bars, ctx); // Pass ctx for gradient support
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Dynamically generate the color for each bar, supporting different visual modes.
 * @param {number} i - The index of the current bar.
 * @param {number} total - The total number of bars.
 * @param {CanvasRenderingContext2D} ctx - Canvas context to use for gradients.
 * @returns {string|CanvasGradient} The color or gradient for the current bar.
 */
function getColor(i, total, ctx) {
  const hue = (i / total) * 360;

  switch (currentMode) {
    case 'neon':
      return `hsl(${hue}, 100%, 50%)`;
    case 'pastel':
      return `hsl(${hue}, 50%, 80%)`;
    case 'rainbow':
      return `hsl(${hue}, 100%, 60%)`;
    case 'gradient':
      return createGradient(hue, ctx);
    default:
      return `hsl(${hue}, 100%, 60%)`;
  }
}

/**
 * Create a linear gradient effect for the waveform.
 * @param {number} hue - The base hue for the gradient.
 * @param {CanvasRenderingContext2D} ctx - The canvas context to create the gradient on.
 * @returns {CanvasGradient} The gradient to be used as strokeStyle.
 */
function createGradient(hue, ctx) {
  const gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, ctx.canvas.height);
  gradient.addColorStop(0, `hsl(${hue}, 100%, 70%)`);
  gradient.addColorStop(1, `hsl(${(hue + 120) % 360}, 100%, 70%)`);
  return gradient;
}

/**
 * Set the visualizer mode (neon, pastel, rainbow, gradient, etc.).
 * @param {string} mode - The new mode for the visualizer.
 */
export function setVisualizerMode(mode) {
  currentMode = mode;
}
