// Neural Network Particle Animation - Canvas 2D (no WebGL required)
import { useRef, useEffect } from 'react';

interface NeuralParticlesProps {
  isProcessing?: boolean;
  particleCount?: number;
  connectionDistance?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  g: number;
  b: number;
}

export function NeuralParticles({ 
  isProcessing = false, 
  particleCount = 80,
  connectionDistance = 120
}: NeuralParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const processingRef = useRef(isProcessing);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    processingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Init particles
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: 50 + Math.random() * 80,
        g: 150 + Math.random() * 80,
        b: 200 + Math.random() * 55,
      });
    }
    particlesRef.current = particles;

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      const w = canvas.width;
      const h = canvas.height;
      const processing = processingRef.current;
      const speed = processing ? 2.5 : 1.0;
      const dist = connectionDistance * (processing ? 1.3 : 1.0);

      ctx.clearRect(0, 0, w, h);

      // Update & draw particles
      for (const p of particles) {
        p.x += p.vx * speed;
        p.y += p.vy * speed;
        if (p.x > w) p.x = 0;
        if (p.x < 0) p.x = w;
        if (p.y > h) p.y = 0;
        if (p.y < 0) p.y = h;

        const size = processing ? 3 + Math.sin(Date.now() * 0.005) * 1.5 : 2.5;
        const opacity = processing ? 0.8 + Math.sin(Date.now() * 0.003) * 0.2 : 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${opacity})`;
        ctx.fill();
      }

      // Draw connections
      const connOpacity = processing ? 0.15 : 0.06;
      ctx.strokeStyle = `rgba(0,221,255,${connOpacity})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          if (Math.abs(dx) < dist && Math.abs(dy) < dist) {
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < dist) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [particleCount, connectionDistance]);

  return (
    <canvas 
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
