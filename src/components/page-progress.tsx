"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function PageProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPathRef.current) return;
    prevPathRef.current = pathname;

    // Start bar
    setProgress(10);
    setVisible(true);

    // Animate to ~85% quickly
    let p = 10;
    timerRef.current = setInterval(() => {
      p += Math.random() * 18 + 6;
      if (p >= 85) {
        p = 85;
        clearInterval(timerRef.current!);
      }
      setProgress(p);
    }, 80);

    // Complete on timeout
    const done = setTimeout(() => {
      clearInterval(timerRef.current!);
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 350);
    }, 600);

    return () => {
      clearInterval(timerRef.current!);
      clearTimeout(done);
    };
  }, [pathname]);

  if (!visible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none">
      <div
        className="h-full transition-all duration-200 ease-out rounded-r-full"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, #0f766e, #0d9488, #14b8a6)",
          boxShadow: "0 0 8px rgba(13, 148, 136, 0.35)",
          opacity: visible ? 1 : 0,
          transition: progress === 100 ? "width 0.2s ease-out, opacity 0.35s 0.2s" : "width 0.2s ease-out",
        }}
      />
      {/* Glowing head */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
        style={{
          left: `calc(${progress}% - 8px)`,
          background: "#0d9488",
          boxShadow: "0 0 6px 2px rgba(13, 148, 136, 0.4)",
          opacity: visible ? 1 : 0,
          transition: "left 0.2s ease-out",
        }}
      />
    </div>
  );
}
