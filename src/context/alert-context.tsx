"use client";

import { AlertDialog } from "@/components/alert-dialog";
import { formatErrorForUser } from "@/lib/api-error";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type AlertState = {
  title: string;
  message: string;
};

type ShowErrorOptions = {
  titleKey?: string;
  namespace?: string;
};

type TranslateFn = (namespace: string, key: string) => string;

type AlertContextType = {
  showError: (error: unknown, t: TranslateFn, options?: ShowErrorOptions) => void;
  showAlert: (title: string, message: string) => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertState | null>(null);

  const close = useCallback(() => setAlert(null), []);

  const showAlert = useCallback((title: string, message: string) => {
    setAlert({ title, message });
  }, []);

  const showError = useCallback(
    (error: unknown, t: TranslateFn, options?: ShowErrorOptions) => {
      const translate: TranslateFn = (ns, key) => t(ns, key);
      const formatted = formatErrorForUser(error, translate, {
        namespace: options?.namespace ?? "common",
        titleKey: options?.titleKey ?? "errorTitle",
      });
      setAlert(formatted);
    },
    [],
  );

  return (
    <AlertContext.Provider value={{ showError, showAlert }}>
      {children}
      <AlertDialog
        open={!!alert}
        title={alert?.title ?? ""}
        message={alert?.message ?? ""}
        onClose={close}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return ctx;
}
