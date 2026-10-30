import React from "react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/80 bg-background/50 backdrop-blur-sm py-6 text-center text-xs text-muted-foreground no-print transition-colors">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>
          <strong>Planora AI</strong> · GenAI Event Copilot & Budget Replanner · Hack2Skill Prompt Wars
        </p>
        <p className="text-[11px] text-muted-foreground/80">
          © 2026 Planora AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
