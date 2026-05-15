"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, Loader2 } from "lucide-react";

export type SnackbarType = "success" | "error" | "info" | "loading";

interface SnackbarProps {
  open: boolean;
  message: string;
  type?: SnackbarType;
  duration?: number;
  onClose: () => void;
}

export function Snackbar({ open, message, type = "success", duration = 5000, onClose }: SnackbarProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setExiting(false);
    } else {
      setExiting(true);
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (open && type !== "loading" && duration > 0) {
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          onClose();
          setVisible(false);
        }, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, type, onClose]);

  if (!visible) return null;

  const configs = {
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-500",
      icon: <CheckCircle className="text-emerald-500" size={20} />,
      text: "text-emerald-800",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-500",
      icon: <AlertCircle className="text-red-500" size={20} />,
      text: "text-red-800",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-500",
      icon: <Info className="text-blue-500" size={20} />,
      text: "text-blue-800",
    },
    loading: {
      bg: "bg-amber-50",
      border: "border-amber-500",
      icon: <Loader2 className="text-amber-500 animate-spin" size={20} />,
      text: "text-amber-800",
    },
  };

  const config = configs[type];

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${exiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}
      `}
    >
      <div
        className={`
          ${config.bg} ${config.border} border-l-4
          rounded-lg shadow-lg p-4
          flex items-start gap-3
        `}
      >
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <p className={`${config.text} text-sm font-medium`}>{message}</p>
        </div>
        <button
          onClick={() => {
            setExiting(true);
            setTimeout(() => {
              onClose();
              setVisible(false);
            }, 300);
          }}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

interface ShowSnackbarParams {
  message: string;
  type?: SnackbarType;
  duration?: number;
}

type SetSnackbarParams = (params: ShowSnackbarParams | null) => void;

export function useSnackbar() {
  const [snackbar, setSnackbar] = useState<ShowSnackbarParams | null>(null);

  const showSnackbar = (params: ShowSnackbarParams) => {
    setSnackbar(params);
  };

  const hideSnackbar = () => {
    setSnackbar(null);
  };

  return { snackbar, showSnackbar, hideSnackbar };
}