"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface Props {
  images: string[];
  alt: string;
  initialIndex?: number;
  onClose: () => void;
}

export default function ImageLightbox({ images, alt, initialIndex = 0, onClose }: Props) {
  const [current, setCurrent] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef(0);

  const clampScale = (s: number) => Math.min(Math.max(s, 1), 4);

  const resetTransform = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const goNext = useCallback(() => {
    if (current < images.length - 1) { setCurrent((c) => c + 1); resetTransform(); }
  }, [current, images.length, resetTransform]);

  const goPrev = useCallback(() => {
    if (current > 0) { setCurrent((c) => c - 1); resetTransform(); }
  }, [current, resetTransform]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, goNext, goPrev]);

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setScale((s) => clampScale(s + (e.deltaY < 0 ? 0.3 : -0.3)));
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastTouchDist.current > 0) {
        const delta = (dist - lastTouchDist.current) * 0.01;
        setScale((s) => clampScale(s + delta));
      }
      lastTouchDist.current = dist;
    } else if (e.touches.length === 1 && scale > 1) {
      e.preventDefault();
      const touch = e.touches[0];
      setOffset({
        x: offsetStart.current.x + (touch.clientX - dragStart.current.x),
        y: offsetStart.current.y + (touch.clientY - dragStart.current.y),
      });
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (e.touches.length === 0) {
      if (scale <= 1) resetTransform();
      lastTouchDist.current = 0;
    }
  }

  function onMouseDown(e: React.MouseEvent) {
    if (scale > 1) {
      setDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      offsetStart.current = { ...offset };
    }
  }

  function onMouseMove(e: React.MouseEvent) {
    if (dragging && scale > 1) {
      setOffset({
        x: offsetStart.current.x + (e.clientX - dragStart.current.x),
        y: offsetStart.current.y + (e.clientY - dragStart.current.y),
      });
    }
  }

  function onMouseUp() {
    setDragging(false);
  }

  const lastTap = useRef(0);
  function handleTap() {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (scale > 1) resetTransform();
      else setScale(2.5);
    }
    lastTap.current = now;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-white/70">{current + 1} / {images.length}</span>
        <div className="flex items-center gap-3">
          <button onClick={() => setScale((s) => clampScale(s + 0.5))} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-lg cursor-pointer">+</button>
          <button onClick={() => setScale((s) => clampScale(s - 0.5))} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-lg cursor-pointer">-</button>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-lg cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden relative touch-none select-none"
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={handleTap}
      >
        {current > 0 && (
          <button onClick={(e) => { e.stopPropagation(); goPrev(); }} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}
        {current < images.length - 1 && (
          <button onClick={(e) => { e.stopPropagation(); goNext(); }} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
        <img
          src={images[current]}
          alt={alt}
          className="max-w-full max-h-full object-contain transition-transform duration-150"
          style={{ transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)` }}
          draggable={false}
        />
      </div>

      {images.length > 1 && (
        <div className="flex justify-center gap-2 px-4 py-3">
          {images.map((url, i) => (
            <button key={i} onClick={() => { setCurrent(i); resetTransform(); }}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${i === current ? "border-white" : "border-white/30"}`}>
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
