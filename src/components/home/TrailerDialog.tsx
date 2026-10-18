"use client";

import { useEffect } from "react";
import { youtubeEmbed } from "@/lib/movie";
import { CloseIcon } from "../Icons";

/** Full-screen trailer player (YouTube). */
export default function TrailerDialog({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const embed = youtubeEmbed(url);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm grid place-items-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} trailer`}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center cursor-pointer"
        aria-label="Close trailer"
      >
        <CloseIcon />
      </button>
      <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10">
        {embed ? (
          <iframe
            src={`${embed}?autoplay=1&rel=0`}
            title={`${title} trailer`}
            className="w-full h-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <div className="h-full grid place-items-center text-white/70 text-sm p-6 text-center">
            This trailer can&apos;t be played here.{" "}
            <a href={url} target="_blank" rel="noopener noreferrer" className="underline ml-1">
              Open it in a new tab
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
