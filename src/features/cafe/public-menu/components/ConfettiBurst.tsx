"use client";

import React, { useEffect, useRef } from "react";

interface ConfettiBurstProps {
  themeColor?: string;
  className?: string;
}

export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({
  themeColor = "#30AFFF",
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = (rect.width || 360) * dpr;
    canvas.height = (rect.height || 300) * dpr;
    ctx.scale(dpr, dpr);

    const colors = [
      themeColor,
      "#FF5A5F",
      "#FFB400",
      "#10B981",
      "#3B82F6",
      "#8B5CF6",
      "#EC4899",
      "#F59E0B",
    ];

    // Generate 50 lively confetti particles bursting upward & outward
    const particles = Array.from({ length: 50 }).map(() => {
      const angle = (Math.random() * Math.PI) / 1.1 + Math.PI / 16; // upward arc
      const speed = Math.random() * 9 + 4;
      return {
        x: (rect.width || 360) / 2 + (Math.random() - 0.5) * 40,
        y: (rect.height || 300) * 0.35,
        w: Math.random() * 7 + 4,
        h: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: Math.cos(angle) * (Math.random() > 0.5 ? 1 : -1) * speed,
        vy: -Math.sin(angle) * speed - Math.random() * 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.28,
        friction: 0.985,
        opacity: 1,
        shape: Math.random() > 0.35 ? "rect" : "circle",
      };
    });

    const startTime = Date.now();

    const render = () => {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, rect.width || 360, rect.height || 300);

      let anyAlive = false;
      particles.forEach((p) => {
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (elapsed > 1200) {
          p.opacity -= 0.022;
        }

        if (p.opacity > 0 && p.y < (rect.height || 300) + 20) {
          anyAlive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;

          if (p.shape === "circle") {
            ctx.beginPath();
            ctx.arc(0, 0, p.w / 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          }

          ctx.restore();
        }
      });

      if (anyAlive && elapsed < 3200) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [themeColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none z-20 ${className}`}
    />
  );
};
