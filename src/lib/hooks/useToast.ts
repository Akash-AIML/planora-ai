"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { UI_CONFIG } from "@/lib/constants/config";

/**
 * Clean, lightweight hook managing temporary toast notifications
 */
export function useToast() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((message: string, durationMs = UI_CONFIG.TOAST_DURATION_MS) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToastMessage(message);
    timerRef.current = setTimeout(() => {
      setToastMessage(null);
      timerRef.current = null;
    }, durationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    toast: toastMessage,
    showToast,
  };
}
