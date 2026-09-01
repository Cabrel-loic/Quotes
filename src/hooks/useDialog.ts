"use client";

import { useEffect, type RefObject } from "react";

const focusable = "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

export function useDialog(open: boolean, panelRef: RefObject<HTMLElement | null>, onClose: () => void, returnFocusRef?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const previous = returnFocusRef?.current ?? document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel?.querySelector<HTMLElement>(focusable)?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(focusable));
      if (!items.length) return;
      const first = items[0]; const last = items.at(-1)!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, [open, onClose, panelRef, returnFocusRef]);
}
