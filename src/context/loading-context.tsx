"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Home } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Phases                                                             */
/* ------------------------------------------------------------------ */
/*
   knocking → fn() runs while the door rattles
   opening  → door swings open, home zooms in
   fading   → overlay fades while next page renders behind
*/

type Phase = "idle" | "knocking" | "opening" | "fading";

const OPEN_DURATION = 1100; // door open + home zoom (ms)
const FADE_DURATION = 550;  // overlay fade-out (ms)

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface LoadingCtx {
  startLoading: (label?: string) => void;
  stopLoading: () => Promise<void>;
  withLoading: <T>(fn: () => Promise<T>, label?: string) => Promise<T>;
}

const Ctx = createContext<LoadingCtx | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [label, setLabel] = useState("Processing…");

  const startLoading = useCallback((l = "Processing…") => {
    setLabel(l);
    setPhase("knocking");
  }, []);

  const stopLoading = useCallback(() => {
    return new Promise<void>((resolve) => {
      // Begin door-open + home-zoom animation
      setPhase("opening");
      window.setTimeout(() => {
        // Animation done → kick off fade and resolve so caller can navigate
        setPhase("fading");
        resolve();
        window.setTimeout(() => setPhase("idle"), FADE_DURATION);
      }, OPEN_DURATION);
    });
  }, []);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>, l = "Processing…"): Promise<T> => {
      startLoading(l);
      try {
        const result = await fn();
        await stopLoading();
        return result;
      } catch (err) {
        await stopLoading();
        throw err;
      }
    },
    [startLoading, stopLoading]
  );

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */

  const visible = phase !== "idle";
  const knocking = phase === "knocking";
  const opening = phase === "opening";
  const fading = phase === "fading";

  return (
    <Ctx.Provider value={{ startLoading, stopLoading, withLoading }}>
      {children}

      {visible && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center"
          style={{
            background: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            opacity: fading ? 0 : 1,
            transition: `opacity ${FADE_DURATION}ms ease-out`,
            pointerEvents: opening || fading ? "none" : "auto",
          }}
        >
          <div
            className="flex flex-col items-center gap-6"
            style={{
              animation: opening
                ? `scene-zoom ${OPEN_DURATION}ms cubic-bezier(0.55, 0, 0.5, 1) forwards`
                : "none",
            }}
          >
            {/* ───── Door scene ───── */}
            <div
              className="relative w-44 h-60"
              style={{ perspective: "1000px", perspectiveOrigin: "center" }}
            >
              {/* Warm light spilling out — visible while door opens */}
              <div
                className="absolute inset-0 m-2 rounded-t-[80px]"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(254, 243, 199, 0.95) 0%, rgba(251, 191, 36, 0.65) 35%, rgba(251, 191, 36, 0.15) 70%, transparent 100%)",
                  opacity: opening ? 1 : 0,
                  transition: "opacity 300ms ease-in",
                }}
              />

              {/* Home icon — zooms from inside the doorway */}
              {opening && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    animation: `home-zoom-in ${OPEN_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                    transformOrigin: "center",
                  }}
                >
                  <Home
                    className="w-16 h-16 text-amber-700 drop-shadow-lg"
                    strokeWidth={1.5}
                    fill="rgba(245, 158, 11, 0.55)"
                  />
                </div>
              )}

              {/* Door frame */}
              <div
                className="absolute inset-0 rounded-t-[88px] pointer-events-none"
                style={{
                  border: "3px solid rgba(251, 191, 36, 0.55)",
                  boxShadow:
                    "0 0 50px rgba(251, 191, 36, 0.3), inset 0 0 25px rgba(0, 0, 0, 0.4)",
                  background:
                    "linear-gradient(135deg, rgba(120, 53, 15, 0.45) 0%, rgba(0, 0, 0, 0.35) 100%)",
                }}
              />

              {/* The door itself */}
              <div
                className="absolute inset-2 rounded-t-[80px]"
                style={{
                  background:
                    "linear-gradient(135deg, #92400e 0%, #78350f 50%, #92400e 100%)",
                  boxShadow:
                    "inset 0 0 30px rgba(0,0,0,0.6), inset 0 -10px 20px rgba(0,0,0,0.5)",
                  transformOrigin: "left center",
                  transformStyle: "preserve-3d",
                  animation: knocking
                    ? "door-rattle 0.5s ease-in-out infinite"
                    : opening
                      ? `door-open ${OPEN_DURATION}ms cubic-bezier(0.34, 0.7, 0.5, 1) forwards`
                      : "none",
                }}
              >
                {/* Wood panels */}
                <div className="absolute top-7 left-1/2 -translate-x-1/2 w-3/4 h-14 border-2 border-amber-950/70 rounded-md" />
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-20 border-2 border-amber-950/70 rounded-md" />

                {/* Door knob */}
                <div
                  className="absolute right-3.5 top-1/2 w-3.5 h-3.5 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, #fef3c7 0%, #f59e0b 70%, #b45309 100%)",
                    boxShadow:
                      "0 0 8px rgba(251, 191, 36, 0.9), 0 1px 2px rgba(0,0,0,0.6)",
                    animation: knocking
                      ? "knob-jiggle 0.4s ease-in-out infinite"
                      : "none",
                    transform: "translateY(-50%)",
                  }}
                />
              </div>
            </div>

            {/* ───── Label + dots ───── */}
            <div
              className="text-center min-h-[3rem] transition-opacity duration-300"
              style={{ opacity: opening || fading ? 0 : 1 }}
            >
              <p className="text-white font-semibold text-base tracking-wide drop-shadow-md">
                {label}
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-2.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-amber-300"
                    style={{
                      animation: "bounce 1.2s ease-in-out infinite",
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useLoading() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLoading must be inside LoadingProvider");
  return ctx;
}
