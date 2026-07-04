"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function useDropdownPosition() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  function open() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, width: r.width });
  }

  function close() {
    setPos(null);
  }

  return { triggerRef, pos, open, close };
}

export function DropdownPortal({
  pos,
  children,
  className = "",
}: {
  pos: { top: number; left: number; width: number } | null;
  children: ReactNode;
  className?: string;
}) {
  if (!pos) return null;
  return createPortal(
    <div
      style={{ position: "fixed", top: pos.top, left: pos.left, width: "fit-content", maxWidth: 280, zIndex: 50 }}
      className={className}
    >
      {children}
    </div>,
    document.body
  );
}
