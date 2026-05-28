"use client";

import { useRef } from "react";
import { Download, Eraser } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export function SignaturePad({
  canvasRef,
  onSigned,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onSigned: (signed: boolean) => void;
}) {
  const { t } = useLanguage();
  const drawing = useRef(false);
  const hasStrokes = useRef(false);

  const getPos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    e.preventDefault();
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e3a5f";
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasStrokes.current = true;
    onSigned(true);
  };

  const endDraw = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    hasStrokes.current = false;
    onSigned(false);
  };

  const exportSig = () => {
    const canvas = canvasRef.current!;
    const off = document.createElement("canvas");
    off.width = canvas.width;
    off.height = canvas.height;
    const ctx = off.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, off.width, off.height);
    ctx.drawImage(canvas, 0, 0);
    const a = document.createElement("a");
    a.download = "esignature.png";
    a.href = off.toDataURL("image/png");
    a.click();
  };

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={700}
          height={160}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="w-48 h-px bg-stone-300" />
          <p className="text-center text-[10px] text-stone-400 mt-0.5 tracking-wide">
            {t("components", "signHere")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-rose-600 transition-colors"
        >
          <Eraser className="w-3.5 h-3.5" /> {t("components", "clear")}
        </button>
        <button
          type="button"
          onClick={exportSig}
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-primary-600 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> {t("components", "exportPng")}
        </button>
      </div>
    </div>
  );
}
