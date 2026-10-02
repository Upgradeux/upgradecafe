"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "success" | "danger" | "error" | "warning" | "info";
}

interface ToastContextType {
  toast: (options: ToastOptions | string) => void;
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export interface ToastProviderProps {
  children: React.ReactNode;
  variant?: "default" | "compact_pill";
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  variant = "default",
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      if (variant === "compact_pill") {
        // Keep only latest toast in compact mode to prevent screen clutter
        setToasts([{ id, message, type }]);
        setTimeout(() => {
          removeToast(id);
        }, 2800);
      } else {
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
          removeToast(id);
        }, 4000);
      }
    },
    [removeToast, variant]
  );

  const success = useCallback((msg: string) => showToast(msg, "success"), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, "error"), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, "warning"), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, "info"), [showToast]);

  const toast = useCallback(
    (options: ToastOptions | string) => {
      if (typeof options === "string") {
        showToast(options, "info");
        return;
      }

      let msg = "";
      if (variant === "compact_pill") {
        // Compact single-line notification message
        msg = options.description || options.title || "";
      } else {
        msg = options.description
          ? options.title
            ? `${options.title}: ${options.description}`
            : options.description
          : options.title || "";
      }

      const toastType: ToastType =
        options.variant === "danger"
          ? "error"
          : options.variant === "success"
          ? "success"
          : options.variant === "warning"
          ? "warning"
          : "info";

      showToast(msg, toastType);
    },
    [showToast, variant]
  );

  return (
    <ToastContext.Provider value={{ toast, showToast, success, error, warning, info }}>
      {children}

      {variant === "compact_pill" ? (
        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           COMPACT DIGITAL MENU PILL TOAST
           - Positioned at top-center (doesn't obstruct bottom dock or cards)
           - Compact, sleek pill shape
           - Soft specular inset highlight & inner shadow
           - Clean ambient glow, NO heavy black box drop shadow
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
        <div className="fixed top-4 sm:top-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center pointer-events-none px-4 w-max max-w-[92vw]">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -16, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
                className="pointer-events-auto inline-flex items-center gap-2.5 py-2 px-4 rounded-full bg-[#121214]/95 backdrop-blur-xl border border-white/15 text-white text-xs font-medium shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.22),inset_0_-1px_1px_rgba(0,0,0,0.5),0_8px_24px_rgba(0,0,0,0.35)] cursor-pointer active:scale-95 transition-transform max-w-[90vw]"
                onClick={() => removeToast(toast.id)}
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    toast.type === "success"
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                      : toast.type === "error"
                      ? "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.9)]"
                      : toast.type === "warning"
                      ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                      : "bg-stone-300 shadow-[0_0_8px_rgba(214,211,209,0.9)]"
                  }`}
                />
                <span className="text-white text-xs leading-snug tracking-normal text-left">{toast.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Standard Dashboard Toast (bottom-right) */
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-[var(--radius-button)] shadow-[var(--shadow-dropdown)] border text-xs font-medium ${
                  toast.type === "success"
                    ? "bg-[var(--color-surface)] border-[var(--color-success)] text-[var(--color-foreground)]"
                    : toast.type === "error"
                    ? "bg-[var(--color-surface)] border-[var(--color-danger)] text-[var(--color-foreground)]"
                    : toast.type === "warning"
                    ? "bg-[var(--color-surface)] border-[var(--color-warning)] text-[var(--color-foreground)]"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-foreground)]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      toast.type === "success"
                        ? "bg-[var(--color-success)]"
                        : toast.type === "error"
                        ? "bg-[var(--color-danger)]"
                        : toast.type === "warning"
                        ? "bg-[var(--color-warning)]"
                        : "bg-[var(--color-primary)]"
                    }`}
                  />
                  <span>{toast.message}</span>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] ml-3 cursor-pointer"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: (opts: ToastOptions | string) => {
        if (typeof window !== "undefined") {
          const msg = typeof opts === "string" ? opts : `${opts.title || ""}: ${opts.description || ""}`;
          console.info("[Toast fallback]", msg);
        }
      },
      showToast: (msg: string) => console.info("[Toast fallback]", msg),
      success: (msg: string) => console.info("[Toast fallback]", msg),
      error: (msg: string) => console.error("[Toast fallback]", msg),
      warning: (msg: string) => console.warn("[Toast fallback]", msg),
      info: (msg: string) => console.info("[Toast fallback]", msg),
    };
  }
  return context;
};
