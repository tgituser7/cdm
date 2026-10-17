"use client";

import { useEffect, useState } from "react";
import { imageUrl } from "@/lib/api";
import { CloseIcon } from "./Icons";

/** Facebook-style photo layout for 1–4+ images, with a click-to-open lightbox. */
export default function PhotoGrid({ images, alt }: { images: string[]; alt: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (images.length === 0) return null;

  const shown = images.slice(0, 4);
  const extra = images.length - shown.length;

  const layout =
    shown.length === 1
      ? "grid-cols-1"
      : shown.length === 2
        ? "grid-cols-2"
        : shown.length === 3
          ? "grid-cols-2 grid-rows-2"
          : "grid-cols-2 grid-rows-2";

  return (
    <>
      <div className={`grid gap-1 ${layout} ${shown.length > 1 ? "aspect-[4/3]" : ""}`}>
        {shown.map((src, i) => (
          <button
            key={i}
            onClick={() => setOpen(i)}
            className={`relative overflow-hidden bg-surface-2 cursor-zoom-in group ${
              shown.length === 3 && i === 0 ? "row-span-2" : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- user uploads and external URLs */}
            <img
              src={imageUrl(src)}
              alt={`${alt} — image ${i + 1}`}
              className={`w-full transition duration-300 group-hover:scale-[1.02] ${
                shown.length === 1 ? "max-h-[560px] object-cover" : "h-full object-cover"
              }`}
              loading="lazy"
            />
            {extra > 0 && i === 3 && (
              <span className="absolute inset-0 bg-black/55 grid place-items-center text-white text-3xl font-bold">
                +{extra}
              </span>
            )}
          </button>
        ))}
      </div>
      {open !== null && <Lightbox images={images} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}

function Lightbox({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: string[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, images.length, onClose, onIndex]);

  const nav = (dir: number) => onIndex((index + dir + images.length) % images.length);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center cursor-pointer"
        aria-label="Close"
      >
        <CloseIcon />
      </button>
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => (e.stopPropagation(), nav(-1))}
            className="absolute left-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl cursor-pointer"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            onClick={(e) => (e.stopPropagation(), nav(1))}
            className="absolute right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl cursor-pointer"
            aria-label="Next image"
          >
            ›
          </button>
        </>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- user uploads and external URLs */}
      <img
        src={imageUrl(images[index]!)}
        alt=""
        className="max-h-full max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      {images.length > 1 && (
        <div className="absolute bottom-5 text-white/80 text-sm">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
