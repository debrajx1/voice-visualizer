export function getColor(index, total) {
    const hue = (index / total) * 360;
    return `hsla(${hue}, 100%, 60%, 0.9)`;
  }
  