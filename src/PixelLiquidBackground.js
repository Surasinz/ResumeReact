import { useEffect, useRef } from 'react';

export const PIXEL_SIZE = 3;

const FRAME_INTERVAL = 1000 / 30;
const BLOBS = [
  { color: '0, 243, 255', radius: 0.34, speedX: 0.73, speedY: 0.51, phase: 0.2 },
  { color: '57, 255, 20', radius: 0.28, speedX: 0.47, speedY: 0.81, phase: 1.7 },
  { color: '0, 243, 255', radius: 0.25, speedX: 0.91, speedY: 0.39, phase: 3.1 },
  { color: '57, 255, 20', radius: 0.3, speedX: 0.58, speedY: 0.67, phase: 4.4 },
  { color: '0, 243, 255', radius: 0.22, speedX: 0.36, speedY: 0.93, phase: 5.6 },
];

function drawBlob(context, x, y, radius, color) {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${color}, 0.48)`);
  gradient.addColorStop(0.48, `rgba(${color}, 0.2)`);
  gradient.addColorStop(1, `rgba(${color}, 0)`);
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

export default function PixelLiquidBackground({ enabled }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return undefined;

    const context = canvas.getContext('2d', { alpha: true });
    const buffer = document.createElement('canvas');
    const bufferContext = buffer.getContext('2d', { alpha: true });
    if (!context || !bufferContext) return undefined;

    let animationFrame;
    let lastFrameTime = -FRAME_INTERVAL;

    const resizeCanvas = () => {
      const renderWidth =
        Math.ceil(window.innerWidth / PIXEL_SIZE) * PIXEL_SIZE;
      const renderHeight =
        Math.ceil(window.innerHeight / PIXEL_SIZE) * PIXEL_SIZE;

      canvas.width = renderWidth;
      canvas.height = renderHeight;
      canvas.style.width = `${renderWidth}px`;
      canvas.style.height = `${renderHeight}px`;
      buffer.width = renderWidth / PIXEL_SIZE;
      buffer.height = renderHeight / PIXEL_SIZE;
      context.imageSmoothingEnabled = false;
    };

    const drawFrame = (timestamp) => {
      animationFrame = window.requestAnimationFrame(drawFrame);
      if (timestamp - lastFrameTime < FRAME_INTERVAL) return;
      lastFrameTime = timestamp;

      const width = buffer.width;
      const height = buffer.height;
      const shortestSide = Math.min(width, height);
      const time = timestamp * 0.00028;

      bufferContext.clearRect(0, 0, width, height);
      bufferContext.globalCompositeOperation = 'lighter';

      BLOBS.forEach((blob) => {
        const x =
          width *
          (0.5 +
            Math.sin(time * blob.speedX + blob.phase) * 0.32 +
            Math.sin(time * 0.27 + blob.phase) * 0.08);
        const y =
          height *
          (0.5 +
            Math.cos(time * blob.speedY + blob.phase * 1.3) * 0.34);
        const radius =
          shortestSide *
          blob.radius *
          (1 + Math.sin(time * 0.83 + blob.phase) * 0.12);

        drawBlob(bufferContext, x, y, radius, blob.color);
      });

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = false;
      context.drawImage(
        buffer,
        0,
        0,
        buffer.width,
        buffer.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    animationFrame = window.requestAnimationFrame(drawFrame);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resizeCanvas);
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [enabled]);

  return (
    <canvas
      ref={canvasRef}
      className={`pixel-liquid-background${enabled ? ' is-enabled' : ''}`}
      data-pixel-size={PIXEL_SIZE}
      aria-hidden="true"
    />
  );
}
