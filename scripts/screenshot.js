/**
 * screenshot.js — Save current canvas as PNG
 * Includes theme name in filename and shows toast.
 */

export function setupScreenshot() {
  const screenshotBtn = document.getElementById('screenshotBtn');
  const canvas = document.getElementById('waveform');

  if (!screenshotBtn || !canvas) return;

  screenshotBtn.addEventListener('click', () => {
    try {
      const theme = document.body.className || 'default';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const link = document.createElement('a');
      link.download = `voice-visualizer_${theme}_${timestamp}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      if (window.__showToast) {
        window.__showToast('📸 Screenshot saved', 'success', 2000);
      }
    } catch (err) {
      console.error('Screenshot error:', err);
      if (window.__showToast) {
        window.__showToast('Screenshot failed', 'error');
      }
    }
  });
}
