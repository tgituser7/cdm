"use client";

import { useState } from "react";
import { movieMeta } from "@/lib/movie";
import type { Movie } from "@/lib/types";
import { useAskForRatingMutation } from "@/store/feedApi";
import ConfirmDialog from "./ConfirmDialog";
import { MovieImage } from "./MovieRating";

/** Confirmation before sharing a movie's rating feed. */
export default function AskRatingDialog({ movie, onClose, onShared }: { movie: Movie; onClose: () => void; onShared?: (feedId: string) => void }) {
  const [askForRating] = useAskForRatingMutation();
  const [message, setMessage] = useState(
    `${movie.title} is ready for your verdict! 🎬 Rate it and tell us what you think in a review.`,
  );
  const again = movie.ratingRequestCount > 0;

  return (
    <ConfirmDialog
      tone="primary"
      icon="🎬"
      title={again ? "Ask audiences to rate this movie again?" : "Ask audiences to rate this movie?"}
      description={
        <>
          A <b className="text-text">rating feed</b> will be shared on everyone&apos;s feed. Audiences will be able to{" "}
          <b className="text-text">rate</b> and <b className="text-text">review</b> {movie.title}.
        </>
      }
      confirmLabel={again ? "Yes, ask again" : "Yes, ask for rating"}
      busyLabel="Sharing…"
      onConfirm={async () => {
        const res = await askForRating({ id: movie.id, message }).unwrap();
        onShared?.(res.feedId);
      }}
      onClose={onClose}
    >
      {again && (
        <div className="mt-4 rounded-xl bg-primary-soft text-primary text-sm px-3.5 py-2.5 leading-relaxed">
          The new rating feed keeps everything so far
          {movie.ratingCount || movie.reviewCount ? (
            <>
              : <b>{movie.ratingCount} ratings</b> and <b>{movie.reviewCount} reviews</b>
            </>
          ) : null}
          . Audiences can add new ratings and reviews or update theirs.
        </div>
      )}

      <div className="mt-5 flex gap-3 rounded-2xl bg-surface-2 p-3">
        <MovieImage movie={movie} className="w-16 shrink-0" />
        <div className="min-w-0">
          <div className="font-bold leading-tight">{movie.title}</div>
          <div className="text-xs text-muted mt-0.5">{movieMeta(movie) || movie.status}</div>
          {movie.genres.length > 0 && <div className="text-xs text-muted mt-0.5">{movie.genres.join(", ")}</div>}
        </div>
      </div>

      <label className="block mt-4">
        <span className="text-sm font-semibold">Message to your audience</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={1000}
          className="input resize-none mt-1.5 text-sm"
        />
      </label>
      <p className="text-xs text-muted mt-3">You can ask for ratings on the same movie once every 24 hours.</p>
    </ConfirmDialog>
  );
}
