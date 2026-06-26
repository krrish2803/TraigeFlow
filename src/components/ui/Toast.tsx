"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

const TOAST_COLORS: Record<ToastType, { bg: string; border: string }> = {
  success: { bg: "rgba(0,212,170,0.15)", border: "var(--accent-success)" },
  error: { bg: "rgba(255,107,107,0.15)", border: "var(--accent-secondary)" },
  info: { bg: "rgba(108,99,255,0.15)", border: "var(--accent-primary)" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => {
            const colors = TOAST_COLORS[toast.type];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[280px] cursor-pointer"
                style={{ backgroundColor: colors.bg, borderLeft: `3px solid ${colors.border}` }}
                onClick={() => removeToast(toast.id)}
              >
                <span className="text-sm text-text-primary">{toast.message}</span>
                <div
                  className="absolute bottom-0 left-0 h-0.5 rounded-full"
                  style={{
                    backgroundColor: colors.border,
                    width: "100%",
                    animation: "shrink 4s linear forwards",
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
