export function setupScreenshot() {
  const screenshotBtn = document.getElementById('screenshotBtn');
  const canvas = document.getElementById('waveform');

  if (!screenshotBtn || !canvas) return;

  screenshotBtn.addEventListener('click', () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const link = document.createElement('a');
    link.download = `waveform-${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}
