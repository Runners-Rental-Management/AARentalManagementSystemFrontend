/**
 * Client-only: draws a stable “handwritten” stroke from the signer’s name so
 * authority review always shows a bitmap, even when auto-counter-sign runs.
 */
export function proceduralSignatureDataUrl(
  fullName: string,
  variant: "tenant" | "landlord"
): string {
  if (typeof document === "undefined") return "";
  const w = 340;
  const h = 108;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  let h0 = 0;
  for (let i = 0; i < fullName.length; i++) {
    h0 = (h0 << 5) - h0 + fullName.charCodeAt(i);
    h0 |= 0;
  }
  const salt = variant === "tenant" ? 0x5a5a5a5a : 0x3c3c3c3c;
  const seed = Math.abs(h0 ^ salt);
  const rnd = (i: number) => {
    const x = Math.sin(seed * 0.001 + i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  ctx.strokeStyle = "#1e3a5f";
  ctx.lineWidth = 2.1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const baseY = h * 0.52;
  let px = 16;
  ctx.beginPath();
  ctx.moveTo(px, baseY + (rnd(0) - 0.5) * 14);

  const segments = 14;
  for (let i = 1; i <= segments; i++) {
    px += 20 + rnd(i) * 12;
    const wave =
      Math.sin(i * 0.85 + seed * 0.02) * (14 + rnd(i + 20) * 10) +
      (rnd(i + 40) - 0.5) * 8;
    const py = baseY + wave * (variant === "landlord" ? 0.85 : 1);
    ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Second lighter pass for ink variation
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  px = 20;
  ctx.moveTo(px, baseY + 6 + (rnd(50) - 0.5) * 6);
  for (let i = 1; i <= 10; i++) {
    px += 26;
    ctx.lineTo(px, baseY + 4 + Math.sin(i + seed * 0.01) * 12);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  return canvas.toDataURL("image/png");
}

export function exportCanvasSignaturePng(canvas: HTMLCanvasElement | null): string | undefined {
  if (!canvas || typeof document === "undefined") return undefined;
  const off = document.createElement("canvas");
  off.width = canvas.width;
  off.height = canvas.height;
  const c = off.getContext("2d");
  if (!c) return undefined;
  c.fillStyle = "#ffffff";
  c.fillRect(0, 0, off.width, off.height);
  c.drawImage(canvas, 0, 0);
  return off.toDataURL("image/png");
}
