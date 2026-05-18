"use client";

import { AlertCircle, X } from "lucide-react";
import { useEffect } from "react";

type AlertDialogProps = {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export function AlertDialog({ open, title, message, onClose }: AlertDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-message"
        className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start gap-3 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id="alert-dialog-title" className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            <p id="alert-dialog-message" className="mt-1.5 text-sm text-slate-600 leading-relaxed">
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-end border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
