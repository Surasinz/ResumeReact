import { useEffect, useRef } from 'react';

export const PIXEL_SIZE = 3;

const FRAME_INTERVAL = 1000 / 30;
const MAX_SMOKE_PUFFS = 48;
const AMBIENT_BLOBS = [
  { color: '0, 243, 255', radius: 0.3, speedX: 0.73, speedY: 0.51, phase: 0.2 },
  { color: '57, 255, 20', radius: 0.25, speedX: 0.47, speedY: 0.81, phase: 2.1 },
  { color: '0, 243, 255', radius: 0.22, speedX: 0.91, speedY: 0.39, phase: 4.2 },
];

function drawBlob(context, x, y, radius, color, intensity = 0.2) {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${color}, ${intensity})`);
  gradient.addColorStop(0.5, `rgba(${color}, ${intensity * 0.42})`);
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
    let lastPointer = null;
    let pendingPointer = null;
    let smokePuffs = [];

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

    const addSmokePuff = (x, y) => {
      smokePuffs.push({
        x,
        y,
        age: 0,
        life: 1800 + Math.random() * 900,
        radius: 14 + Math.random() * 8,
        driftX: (Math.random() - 0.5) * 0.006,
        driftY: -0.006 - Math.random() * 0.006,
        color: Math.random() > 0.45 ? '0, 243, 255' : '57, 255, 20',
      });

      if (smokePuffs.length > MAX_SMOKE_PUFFS) {
        smokePuffs.splice(0, smokePuffs.length - MAX_SMOKE_PUFFS);
      }
    };

    const handlePointerMove = (event) => {
      pendingPointer = {
        x: event.clientX / PIXEL_SIZE,
        y: event.clientY / PIXEL_SIZE,
      };
    };

    const emitPointerSmoke = () => {
      if (!pendingPointer) return;

      const pointer = pendingPointer;
      pendingPointer = null;
      if (!lastPointer) {
        addSmokePuff(pointer.x, pointer.y);
        lastPointer = pointer;
        return;
      }

      const distance = Math.hypot(
        pointer.x - lastPointer.x,
        pointer.y - lastPointer.y
      );
      const steps = Math.min(6, Math.max(1, Math.ceil(distance / 8)));

      for (let step = 1; step <= steps; step += 1) {
        const progress = step / steps;
        addSmokePuff(
          lastPointer.x + (pointer.x - lastPointer.x) * progress,
          lastPointer.y + (pointer.y - lastPointer.y) * progress
        );
      }

      lastPointer = pointer;
    };

    const resetPointer = () => {
      lastPointer = null;
      pendingPointer = null;
    };

    const drawFrame = (timestamp) => {
      animationFrame = window.requestAnimationFrame(drawFrame);
      if (timestamp - lastFrameTime < FRAME_INTERVAL) return;
      const delta = Math.min(timestamp - lastFrameTime, 64);
      lastFrameTime = timestamp;

      const width = buffer.width;
      const height = buffer.height;
      const shortestSide = Math.min(width, height);
      const time = timestamp * 0.00028;

      bufferContext.clearRect(0, 0, width, height);
      bufferContext.globalCompositeOperation = 'lighter';

      emitPointerSmoke();

      AMBIENT_BLOBS.forEach((blob) => {
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

        drawBlob(bufferContext, x, y, radius, blob.color, 0.1);
      });

      smokePuffs = smokePuffs.filter((puff) => {
        puff.age += delta;
        if (puff.age >= puff.life) return false;

        const progress = puff.age / puff.life;
        puff.x += puff.driftX * delta;
        puff.y += puff.driftY * delta;
        drawBlob(
          bufferContext,
          puff.x,
          puff.y,
          puff.radius * (1 + progress * 1.35),
          puff.color,
          0.72 * (1 - progress) ** 2
        );
        return true;
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
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', resetPointer, {
      passive: true,
    });
    animationFrame = window.requestAnimationFrame(drawFrame);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointermove', handlePointerMove);
      document.documentElement.removeEventListener('pointerleave', resetPointer);
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
