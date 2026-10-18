"use client";

import Link from "next/link";
import { useState } from "react";
import { imageUrl } from "@/lib/api";
import type { Movie } from "@/lib/types";
import { useDeleteReviewMutation, useRateMovieMutation, useReviewMovieMutation } from "@/store/feedApi";
import { useSession } from "@/store/hooks";
import Avatar from "./Avatar";
import ConfirmDialog from "./ConfirmDialog";
import { ClapperIcon, FilmIcon } from "./Icons";
import { StarsDisplay, StarsInput, formatStars } from "./Stars";
import TimeAgo from "./TimeAgo";

const errorMessage = (e: unknown) =>
  (e as { data?: { error?: string } })?.data?.error ?? "Something went wrong. Please try again.";

/** Movie image, or a gradient placeholder with the title. */
export function MovieImage({ movie, className = "" }: { movie: Pick<Movie, "title" | "movieImage">; className?: string }) {
  // Falls back to the gradient placeholder if the image is missing or fails to load.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = !!movie.movieImage && failedSrc !== movie.movieImage;
  return (
    <div className={`relative aspect-[2/3] overflow-hidden rounded-xl bg-surface-2 shadow-md ${className}`}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- user uploads and external URLs
        <img
          src={imageUrl(movie.movieImage!)}
          alt={`${movie.title} movie image`}
          className="h-full w-full object-cover"
          onError={() => setFailedSrc(movie.movieImage!)}
        />
      ) : (
        <div className="brand-gradient h-full w-full flex flex-col justify-end p-3 text-white">
          <FilmIcon size={20} className="opacity-70 mb-auto" />
          <span className="font-extrabold leading-tight text-sm">{movie.title}</span>
        </div>
      )}
    </div>
  );
}

/** Average rating, vote count and a 10-bar histogram (½ … 5 clapperboards). */
export function RatingSummary({ movie, size = "md" }: { movie: Movie; size?: "sm" | "md" }) {
  const max = Math.max(1, ...movie.histogram);
  return (
    <div className="flex items-end gap-4">
      <div className="shrink-0">
        <div className={`${size === "sm" ? "text-3xl" : "text-4xl"} font-extrabold leading-none`}>
          {formatStars(movie.average)}
          <span className="text-base font-semibold text-muted">/5</span>
        </div>
        <div className="mt-1.5">
          <StarsDisplay value={movie.average} size={size === "sm" ? 17 : 20} />
        </div>
        <div className="text-xs text-muted mt-1">
          {movie.ratingCount} rating{movie.ratingCount === 1 ? "" : "s"} · {movie.reviewCount} review
          {movie.reviewCount === 1 ? "" : "s"}
        </div>
      </div>
      <div className="flex-1 min-w-[90px]">
        <div className={`flex items-end gap-[3px] ${size === "sm" ? "h-12" : "h-16"}`}>
          {movie.histogram.map((c, i) => (
            <div
              key={i}
              title={`${(i + 1) / 2} — ${c} rating${c === 1 ? "" : "s"}`}
              className={`flex-1 rounded-t-sm ${c ? "bg-star/80" : "bg-line"}`}
              style={{ height: `${Math.max(6, (c / max) * 100)}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted mt-1">
          <span className="inline-flex items-center gap-0.5">
            ½ <ClapperIcon size={10} />
          </span>
          <span className="inline-flex items-center gap-0.5">
            5 <ClapperIcon size={10} />
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * The "Rate" and "Write review" actions. Only shown on rating feeds and movie pages
 * (and only while the director has ratings open).
 */
export function RateAndReview({ movie, initiallyOpen }: { movie: Movie; initiallyOpen?: "rate" | "review" }) {
  const { user } = useSession();
  const [panel, setPanel] = useState<"rate" | "review" | null>(initiallyOpen ?? null);
  const [rateMovie] = useRateMovieMutation();
  const [error, setError] = useState("");

  if (!movie.ratingOpen) {
    return <p className="text-sm text-muted rounded-xl bg-surface-2 px-4 py-3">Ratings aren&apos;t open for this movie yet.</p>;
  }
  if (!user) {
    return (
      <div className="rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary flex flex-wrap items-center gap-2">
        <ClapperIcon size={16} />
        <span className="flex-1">Sign in as audience to rate and review {movie.title}.</span>
        <Link href="/login" className="btn btn-primary !py-1.5 !px-4">
          Sign in
        </Link>
      </div>
    );
  }
  if (user.role !== "audience") {
    return (
      <p className="text-xs text-muted text-center">Directors can see ratings and reviews. Only audience members can rate and review.</p>
    );
  }

  const hasReview = !!movie.myReviewId;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setPanel((p) => (p === "rate" ? null : "rate"))}
          className={`btn !py-2.5 ${movie.myRating ? "bg-star/15 text-star" : "btn-soft"} ${panel === "rate" ? "ring-2 ring-star/40" : ""}`}
        >
          <ClapperIcon size={18} filled={!!movie.myRating} />
          {movie.myRating ? `Rated ${formatStars(movie.myRating)}` : "Rate"}
        </button>
        <button
          onClick={() => setPanel((p) => (p === "review" ? null : "review"))}
          className={`btn !py-2.5 btn-soft ${panel === "review" ? "ring-2 ring-primary/40" : ""}`}
        >
          ✍️ {hasReview ? "Edit review" : "Write review"}
        </button>
      </div>

      {panel === "rate" && (
        <div className="rounded-xl bg-surface-2 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium">{movie.myRating ? "Change your rating" : `Rate ${movie.title}`}</span>
          <StarsInput
            value={movie.myRating ?? undefined}
            onChange={(v) => {
              setError("");
              rateMovie({ id: movie.id, value: v })
                .unwrap()
                .then(() => setTimeout(() => setPanel(null), 350))
                .catch((e) => setError(errorMessage(e)));
            }}
            size={28}
          />
        </div>
      )}

      {panel === "review" && <ReviewForm movie={movie} onDone={() => setPanel(null)} />}
      {error && <p className="text-sm text-like">{error}</p>}
    </div>
  );
}

function ReviewForm({ movie, onDone }: { movie: Movie; onDone: () => void }) {
  const mine = movie.reviews.find((r) => r.id === movie.myReviewId);
  const [text, setText] = useState(mine?.text ?? "");
  const [rating, setRating] = useState<number | undefined>(movie.myRating ?? undefined);
  const [error, setError] = useState("");
  const [reviewMovie, { isLoading }] = useReviewMovieMutation();
  const [deleteReview, { isLoading: deleting }] = useDeleteReviewMutation();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return setError("Write a few words about the movie.");
        setError("");
        reviewMovie({ id: movie.id, text, rating })
          .unwrap()
          .then(onDone)
          .catch((err) => setError(errorMessage(err)));
      }}
      className="rounded-xl border border-line bg-surface p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">{mine ? "Edit your review" : `Review ${movie.title}`}</span>
        <StarsInput value={rating} onChange={setRating} size={24} />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        maxLength={3000}
        placeholder="What did you think? No spoilers please 🙂"
        className="input resize-none text-sm"
        autoFocus
      />
      {error && <p className="text-sm text-like">{error}</p>}
      <div className="flex items-center gap-2">
        {mine && (
          <button
            type="button"
            disabled={deleting}
            onClick={() => setConfirmingDelete(true)}
            className="text-sm text-like hover:underline cursor-pointer"
          >
            Delete review
          </button>
        )}
        <button type="button" onClick={onDone} className="btn btn-ghost ml-auto">
          Cancel
        </button>
        <button type="submit" disabled={isLoading || !text.trim()} className="btn btn-primary">
          {isLoading ? "Sharing…" : mine ? "Update review" : "Share Review"}
        </button>
      </div>
      {confirmingDelete && (
        <ConfirmDialog
          title="Delete your review?"
          description={`Your review of ${movie.title} will be removed. Your rating stays.`}
          confirmLabel="Delete review"
          busyLabel="Deleting…"
          onConfirm={async () => {
            await deleteReview(movie.id).unwrap();
            onDone();
          }}
          onClose={() => setConfirmingDelete(false)}
        />
      )}
    </form>
  );
}

export function ReviewList({ movie, limit }: { movie: Movie; limit?: number }) {
  const [showAll, setShowAll] = useState(false);
  if (movie.reviews.length === 0) {
    return <p className="text-sm text-muted">No reviews yet{movie.ratingOpen ? ". Be the first to review!" : "."}</p>;
  }
  const shown = limit && !showAll ? movie.reviews.slice(0, limit) : movie.reviews;
  return (
    <div className="space-y-3">
      {shown.map((r) => (
        <div key={r.id} className="flex gap-2.5">
          <Avatar name={r.userName} size={32} />
          <div className="min-w-0 flex-1">
            <div className="bg-surface-2 rounded-2xl px-3.5 py-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-bold">{r.userName}</span>
                {r.rating && <StarsDisplay value={r.rating} size={14} />}
              </div>
              <p className="text-sm leading-snug mt-0.5 whitespace-pre-line break-words">{r.text}</p>
            </div>
            <div className="text-[11px] text-muted mt-1 ml-3">
              <TimeAgo iso={r.createdAt} />
              {r.updatedAt !== r.createdAt && " · edited"}
            </div>
          </div>
        </div>
      ))}
      {limit && movie.reviews.length > limit && !showAll && (
        <button onClick={() => setShowAll(true)} className="text-sm font-semibold text-muted hover:underline cursor-pointer">
          View all {movie.reviews.length} reviews
        </button>
      )}
    </div>
  );
}
