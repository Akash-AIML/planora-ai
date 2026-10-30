"use client";

import { useCallback } from "react";
import type { EventDetail } from "@/lib/domain/types";
import { buildPlanoraExport, generateEventMarkdown } from "@/lib/domain/export";

interface ExportActionProps {
  currentEvent: EventDetail | null;
  showToast: (msg: string) => void;
}

export function useExportActions({ currentEvent, showToast }: ExportActionProps) {
  const handleDownloadExport = useCallback(() => {
    if (!currentEvent) return;
    const exportData = buildPlanoraExport(currentEvent);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `planora-${currentEvent.event.title.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Planora JSON specification downloaded!");
  }, [currentEvent, showToast]);

  const handleCopyMarkdown = useCallback(async () => {
    if (!currentEvent) return;
    try {
      await navigator.clipboard.writeText(generateEventMarkdown(currentEvent));
      showToast("Markdown brief copied to clipboard!");
    } catch {
      showToast("Failed to copy clipboard.");
    }
  }, [currentEvent, showToast]);

  return {
    handleDownloadExport,
    handleCopyMarkdown,
  };
}
