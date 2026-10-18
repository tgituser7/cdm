"use client";

import { useState } from "react";
import { CLAPPER_PATH } from "./Icons";

/**
 * Ratings are stored as 1–10 and shown as 0.5–5 clapperboards 🎬
 * (each clapperboard can be half filled).
 */

function Clapper({ fill, size }: { fill: number; size: number }) {
  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size} height={size} className="absolute inset-0 text-white/15">
        <path fill="currentColor" fillRule="evenodd" d={CLAPPER_PATH} />
      </svg>
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
        <svg viewBox="0 0 24 24" width={size} height={size} className="text-star">
          <path fill="currentColor" fillRule="evenodd" d={CLAPPER_PATH} />
        </svg>
      </span>
    </span>
  );
}

export function StarsDisplay({ value, size = 14 }: { value: number | null; size?: number }) {
  const v = value ?? 0;
  return (
    <span className="inline-flex gap-0.5 align-middle" aria-label={`Rated ${(v / 2).toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Clapper key={i} size={size} fill={Math.max(0, Math.min(1, v / 2 - i))} />
      ))}
    </span>
  );
}

export function StarsInput({
  value,
  onChange,
  size = 30,
}: {
  value?: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  return (
    <div className="inline-flex gap-1" onMouseLeave={() => setHover(null)} role="radiogroup" aria-label="Rating">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="relative" style={{ width: size, height: size }}>
          <Clapper size={size} fill={Math.max(0, Math.min(1, shown / 2 - i))} />
          {[1, 2].map((half) => {
            const v = i * 2 + half;
            return (
              <button
                key={half}
                type="button"
                role="radio"
                aria-checked={value === v}
                aria-label={`${v / 2} out of 5`}
                onMouseEnter={() => setHover(v)}
                onClick={() => onChange(v)}
                className={`absolute top-0 h-full w-1/2 cursor-pointer ${half === 1 ? "left-0" : "right-0"}`}
              />
            );
          })}
        </span>
      ))}
    </div>
  );
}

export function formatStars(value: number | null) {
  return value === null ? "–" : (value / 2).toFixed(1);
}
