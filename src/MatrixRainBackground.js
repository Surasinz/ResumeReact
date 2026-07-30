import { useEffect, useRef } from 'react';
import { useTheme } from './ThemeSystem';

const CHARACTERS = '01{}[]<>/\\$#*+アイウエオカキクケコ';

export default function MatrixRainBackground({ enabled }) {
  const canvasRef = useRef(null);
  const { theme } = useTheme();
  const rainColor = theme === 'dark' ? '#ff35a2' : '#39ff14';
  const fadeColor =
    theme === 'dark'
      ? 'rgba(10, 10, 15, 0.12)'
      : 'rgba(255, 255, 255, 0.12)';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return undefined;

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return undefined;

    const fontSize = 16;
    const frameInterval = 50;
    let animationFrame;
    let lastFrameTime = 0;
    let drops = [];

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      drops = Array.from(
        { length: Math.ceil(width / fontSize) },
        () => Math.floor(Math.random() * -(height / fontSize))
      );
    };

    const drawFrame = (timestamp) => {
      animationFrame = window.requestAnimationFrame(drawFrame);
      if (timestamp - lastFrameTime < frameInterval) return;
      lastFrameTime = timestamp;

      context.fillStyle = fadeColor;
      context.fillRect(0, 0, window.innerWidth, window.innerHeight);
      context.fillStyle = rainColor;
      context.font = `600 ${fontSize}px monospace`;

      drops.forEach((drop, index) => {
        const character =
          CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        context.fillText(character, index * fontSize, drop * fontSize);

        if (drop * fontSize > window.innerHeight && Math.random() > 0.975) {
          drops[index] = 0;
        } else {
          drops[index] += 1;
        }
      });
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    animationFrame = window.requestAnimationFrame(drawFrame);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resizeCanvas);
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [enabled, fadeColor, rainColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`matrix-background${enabled ? ' is-enabled' : ''}`}
      data-rain-color={rainColor}
      aria-hidden="true"
    />
  );
}
