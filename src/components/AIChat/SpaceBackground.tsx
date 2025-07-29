import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  speed: number;
  color: string;
}

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize stars
    const initStars = () => {
      starsRef.current = [];
      for (let i = 0; i < 400; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 1000,
          size: Math.random() * 2 + 1,
          speed: Math.random() * 0.5 + 0.1,
          color: `hsl(${Math.random() * 60 + 200}, 100%, ${Math.random() * 50 + 50}%)`
        });
      }
    };

    initStars();

    // Animation loop
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      starsRef.current.forEach(star => {
        // Move star
        star.z -= star.speed;
        
        // Reset star if it goes off screen
        if (star.z <= 0) {
          star.z = 1000;
          star.x = Math.random() * canvas.width;
          star.y = Math.random() * canvas.height;
        }

        // Calculate 3D position
        const x = (star.x - canvas.width / 2) * (1000 / star.z) + canvas.width / 2;
        const y = (star.y - canvas.height / 2) * (1000 / star.z) + canvas.height / 2;
        const size = star.size * (1000 / star.z);
        const opacity = 1 - star.z / 1000;

        // Draw star
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = star.color.replace(')', `, ${opacity})`).replace('hsl', 'hsla');
        ctx.fill();

        // Add glow effect for closer stars
        if (star.z < 200) {
          ctx.beginPath();
          ctx.arc(x, y, size * 2, 0, Math.PI * 2);
          ctx.fillStyle = star.color.replace(')', `, ${opacity * 0.3})`).replace('hsl', 'hsla');
          ctx.fill();
        }
      });

      // Draw neural network connections
      ctx.strokeStyle = 'rgba(0, 200, 255, 0.1)';
      ctx.lineWidth = 1;
      
      for (let i = 0; i < starsRef.current.length; i += 20) {
        const star1 = starsRef.current[i];
        const star2 = starsRef.current[i + 10];
        
        if (star1 && star2 && star1.z < 500 && star2.z < 500) {
          const x1 = (star1.x - canvas.width / 2) * (1000 / star1.z) + canvas.width / 2;
          const y1 = (star1.y - canvas.height / 2) * (1000 / star1.z) + canvas.height / 2;
          const x2 = (star2.x - canvas.width / 2) * (1000 / star2.z) + canvas.width / 2;
          const y2 = (star2.y - canvas.height / 2) * (1000 / star2.z) + canvas.height / 2;
          
          const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
          
          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
      style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)' }}
    />
  );
}