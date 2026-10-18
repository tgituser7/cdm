"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Movie } from "@/lib/types";

function formatWait(ms: number) {
  const mins = Math.ceil(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

/**
 * Director controls for a movie's rating feed: view the current feed, and ask for ratings
 * (again) — allowed once every 24 hours, with a countdown until then.
 * Only rendered on the client after the session is known, so reading the clock here is safe.
 */
export default function RatingRequestActions({ movie, onAsk, size = "md" }: { movie: Movie; onAsk: () => void; size?: "sm" | "md" }) {
  const [now, setNow] = useState(() => Date.now());

  const nextAt = movie.nextRatingRequestAt ? new Date(movie.nextRatingRequestAt).getTime() : 0;
  const waitMs = nextAt - now;

  // Tick every 30s while waiting so the countdown and button stay current.
  useEffect(() => {
    if (waitMs <= 0) return;
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [waitMs]);

  const pad = size === "sm" ? "!py-2" : "";

  return (
    <>
      {movie.ratingOpen && movie.ratingFeedId && (
        <Link href={`/feeds/${movie.ratingFeedId}`} className={`btn ${pad} btn-soft`}>
          ✓ Rating open · View feed
        </Link>
      )}
      {waitMs > 0 ? (
        <button
          disabled
          className={`btn ${pad} btn-soft !opacity-70`}
          title="You can ask for ratings on the same movie once every 24 hours"
        >
          ⏳ Ask again in {formatWait(waitMs)}
        </button>
      ) : (
        <button onClick={onAsk} className={`btn ${pad} btn-primary`}>
          🎬 {movie.ratingRequestCount > 0 ? "Ask for rating again" : "Ask For Rating"}
        </button>
      )}
    </>
  );
}
