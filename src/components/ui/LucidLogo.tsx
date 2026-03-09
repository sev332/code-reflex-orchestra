// Canvas-based animated logo for LUCID (WebGL-free fallback)
import { useEffect, useMemo, useRef, useState } from 'react';

interface LucidLogoProps {
  size?: number;
  className?: string;
}

function getThemeHue(): number {
  try {
    const primary = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary')
      .trim();
    // Expected format (shadcn): "222.2 47.4% 11.2%" (H S L)
    const hue = Number.parseFloat(primary.split(/\s+/)[0] ?? '');
    return Number.isFinite(hue) ? hue : 193;
  } catch {
    return 193;
  }
}

export function LucidLogo({ size = 40, className = '' }: LucidLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const hoverRef = useRef(false);
  const [isHovered, setIsHovered] = useState(false);

  const hueBase = useMemo(() => getThemeHue(), []);

  useEffect(() => {
    hoverRef.current = isHovered;
  }, [isHovered]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const r = size / 2;
    const rad = r - 1;

    const draw = (tMs: number) => {
      const t = tMs / 1000;
      const hover = hoverRef.current;

      ctx.clearRect(0, 0, size, size);

      // Soft outer glow
      ctx.save();
      ctx.globalAlpha = hover ? 0.9 : 0.55;
      ctx.filter = `blur(${hover ? 1.6 : 1.0}px)`;
      const glow = ctx.createRadialGradient(r, r, rad * 0.4, r, r, rad * 1.15);
      glow.addColorStop(0, `hsl(${(hueBase + t * 18) % 360} 95% 70% / 0.55)`);
      glow.addColorStop(0.55, `hsl(${(hueBase + 140 + t * 14) % 360} 95% 68% / 0.28)`);
      glow.addColorStop(1, `hsl(${(hueBase + 260 + t * 10) % 360} 95% 62% / 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(r, r, rad * 1.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Sphere body
      ctx.save();
      ctx.beginPath();
      ctx.arc(r, r, rad, 0, Math.PI * 2);
      ctx.clip();

      // Base gradient (multi-hue)
      const g = ctx.createLinearGradient(r - rad, r - rad, r + rad, r + rad);
      g.addColorStop(0, `hsl(${(hueBase + t * 22) % 360} 95% 62%)`);
      g.addColorStop(0.5, `hsl(${(hueBase + 120 + t * 18) % 360} 95% 58%)`);
      g.addColorStop(1, `hsl(${(hueBase + 250 + t * 16) % 360} 95% 60%)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);

      // Shading for depth
      const shade = ctx.createRadialGradient(r * 0.65, r * 0.55, rad * 0.1, r, r, rad * 1.1);
      shade.addColorStop(0, 'hsl(0 0% 100% / 0.45)');
      shade.addColorStop(0.4, 'hsl(0 0% 100% / 0.10)');
      shade.addColorStop(1, 'hsl(240 30% 8% / 0.70)');
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, size, size);

      // Rotating shimmer band
      ctx.save();
      ctx.translate(r, r);
      ctx.rotate(t * 0.65);
      const band = ctx.createLinearGradient(-rad, 0, rad, 0);
      band.addColorStop(0, 'hsl(0 0% 100% / 0)');
      band.addColorStop(0.35, 'hsl(0 0% 100% / 0.08)');
      band.addColorStop(0.5, `hsl(${(hueBase + 30 + t * 24) % 360} 95% 70% / ${hover ? 0.22 : 0.14})`);
      band.addColorStop(0.65, 'hsl(0 0% 100% / 0.06)');
      band.addColorStop(1, 'hsl(0 0% 100% / 0)');
      ctx.fillStyle = band;
      ctx.fillRect(-rad, -rad * 0.35, rad * 2, rad * 0.7);
      ctx.restore();

      // Edge highlight
      ctx.strokeStyle = 'hsl(0 0% 100% / 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(r, r, rad - 0.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [size, hueBase]);

  return (
    <div
      className={`cursor-pointer transition-transform duration-300 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        filter: isHovered
          ? 'drop-shadow(0 0 12px hsl(var(--primary) / 0.55)) drop-shadow(0 0 24px hsl(var(--accent) / 0.25))'
          : 'drop-shadow(0 0 6px hsl(var(--primary) / 0.35)) drop-shadow(0 0 12px hsl(var(--accent) / 0.18))',
        transition: 'filter 0.3s ease-in-out, transform 0.3s ease-in-out',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="LUCID - Intelligent AI System"
    >
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="sr-only">LUCID</span>
    </div>
  );
}
