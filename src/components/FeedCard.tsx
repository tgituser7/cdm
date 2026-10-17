"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatLocation } from "@/lib/geo";
import { movieMeta } from "@/lib/movie";
import type { Movie, Feed } from "@/lib/types";
import { useAddCommentMutation, useDeleteFeedMutation, useToggleLikeMutation } from "@/store/feedApi";
import { useSession } from "@/store/hooks";
import Avatar from "./Avatar";
import ConfirmDialog from "./ConfirmDialog";
import EditFeedDialog from "./EditFeedDialog";
import { CommentIcon, DotsIcon, FilmIcon, HeartIcon, SendIcon, ShareIcon } from "./Icons";
import { MovieImage, RateAndReview, RatingSummary, ReviewList } from "./MovieRating";
import PhotoGrid from "./PhotoGrid";
import ShareDialog from "./ShareDialog";
import TimeAgo from "./TimeAgo";

const errorMessage = (e: unknown) =>
  (e as { data?: { error?: string } })?.data?.error ?? "Something went wrong. Please try again.";

export default function FeedCard({ feed, expanded = false }: { feed: Feed; expanded?: boolean }) {
  const { user } = useSession();
  const [deleteFeed] = useDeleteFeedMutation();
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [clamped, setClamped] = useState(!expanded && feed.text.length > 280);

  const isOwner = user?.id === feed.directorId;
  const isRating = feed.type === "rating" && !!feed.movie;
  const place = formatLocation(feed.location);
  const shareText = isRating
    ? `Rate and review ${feed.movie!.title} by ${feed.directorName} on Cinema Dharshak Manch 🎬`
    : `${feed.directorName}${feed.filmTitle ? ` · ${feed.filmTitle}` : ""} on Cinema Dharshak Manch${
        feed.text ? `: "${feed.text.length > 120 ? `${feed.text.slice(0, 117).trimEnd()}…` : feed.text}"` : ""
      }`;
  const openShare = () => setShareUrl(`${window.location.origin}/feeds/${feed.id}`);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menu]);

  return (
    <article className={`card overflow-hidden ${isRating ? "ring-1 ring-star/30" : ""}`}>
      {isRating && (
        <div className="bg-gradient-to-r from-orange-50 via-pink-50 to-violet-50 px-4 sm:px-5 py-2 text-xs font-bold uppercase tracking-wider text-star flex items-center gap-2 border-b border-line">
          🎬 Rate &amp; Review
          <span className="text-muted font-semibold normal-case tracking-normal truncate">· {feed.directorName} wants your rating</span>
          <button
            onClick={openShare}
            className="ml-auto shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white/80 hover:bg-white px-3 py-1 text-xs font-semibold normal-case tracking-normal text-text cursor-pointer"
          >
            <ShareIcon size={14} /> Share
          </button>
        </div>
      )}

      {/* Author */}
      <header className="flex items-start gap-3 px-4 sm:px-5 pt-4">
        <Avatar name={feed.directorName} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold">{feed.directorName}</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary-soft rounded px-1.5 py-0.5">
              Director
            </span>
            {feed.proximity === "city" && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5">
                Near you
              </span>
            )}
          </div>
          <div className="text-xs text-muted flex items-center gap-1.5 mt-0.5 flex-wrap">
            <Link href={`/feeds/${feed.id}`} className="hover:underline">
              <TimeAgo iso={feed.createdAt} />
            </Link>
            {feed.editedAt && (
              <span title={`Edited ${new Date(feed.editedAt).toLocaleString("en-IN")}`}>· Edited</span>
            )}
            {feed.filmTitle && !isRating && (
              <>
                <span>·</span>
                {feed.movieId ? (
                  <Link
                    href={`/movies/${feed.movieId}`}
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                    title={`View ${feed.filmTitle} details`}
                  >
                    <FilmIcon size={13} /> {feed.filmTitle}
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 text-text/80 font-medium">
                    <FilmIcon size={13} /> {feed.filmTitle}
                  </span>
                )}
              </>
            )}
            {place && (
              <>
                <span>·</span>
                <span title={feed.distanceKm !== null ? `${feed.distanceKm} km from you` : undefined}>📍 {place}</span>
              </>
            )}
          </div>
        </div>
        {isOwner && (
          <div className="relative">
            <button
              onClick={(e) => (e.stopPropagation(), setMenu((m) => !m))}
              className="w-9 h-9 rounded-full grid place-items-center text-muted hover:bg-surface-2 cursor-pointer"
              aria-label="Feed options"
            >
              <DotsIcon />
            </button>
            {menu && (
              <div className="absolute right-0 mt-1 w-48 card p-1 text-sm z-10">
                <button
                  onClick={() => setEditing(true)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-2 cursor-pointer"
                >
                  {isRating ? "Edit message" : "Edit feed"}
                </button>
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="w-full text-left px-3 py-2 rounded-lg text-like hover:bg-surface-2 cursor-pointer"
                >
                  Delete feed
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Body */}
      {feed.text ? (
        <div className="px-4 sm:px-5 pt-3 pb-3 text-[15px] leading-relaxed whitespace-pre-line">
          {clamped ? `${feed.text.slice(0, 260).trimEnd()}… ` : feed.text}
          {clamped && (
            <button onClick={() => setClamped(false)} className="font-semibold text-muted hover:underline cursor-pointer">
              See more
            </button>
          )}
        </div>
      ) : (
        <div className="h-3" />
      )}

      {isRating ? (
        <RatingFeedBody movie={feed.movie!} expanded={expanded} />
      ) : (
        <UpdateFeedBody feed={feed} expanded={expanded} onError={setError} onShare={openShare} />
      )}

      {error && <p className="px-4 sm:px-5 pb-3 text-sm text-like">{error}</p>}

      {editing && <EditFeedDialog feed={feed} onClose={() => setEditing(false)} />}
      {shareUrl && <ShareDialog url={shareUrl} text={shareText} onClose={() => setShareUrl(null)} />}
      {confirmingDelete && (
        <ConfirmDialog
          title={isRating ? "Delete this rating feed?" : "Delete this feed?"}
          description={
            isRating
              ? `Ratings for ${feed.movie?.title} will close unless it has another rating feed. Existing ratings and reviews stay on the movie.`
              : "This feed, its images, likes and comments will be removed. This can't be undone."
          }
          confirmLabel="Delete feed"
          busyLabel="Deleting…"
          onConfirm={() => deleteFeed(feed.id).unwrap()}
          onClose={() => setConfirmingDelete(false)}
        />
      )}
    </article>
  );
}

/** Rating feed: the movie card, its rating summary, Rate / Write review, and reviews. */
function RatingFeedBody({ movie, expanded }: { movie: Movie; expanded: boolean }) {
  return (
    <>
      <Link
        href={`/movies/${movie.id}`}
        className="mx-4 sm:mx-5 flex gap-4 rounded-2xl border border-line bg-surface-2/50 p-3 hover:border-primary/40 transition group"
      >
        <MovieImage movie={movie} className="w-24 sm:w-28 shrink-0" />
        <div className="min-w-0 py-1">
          <div className="text-lg font-extrabold leading-tight group-hover:text-primary">{movie.title}</div>
          <div className="text-xs text-muted mt-1">{movieMeta(movie) || movie.status}</div>
          {movie.tagline && <p className="text-sm italic text-text/80 mt-2 line-clamp-2">“{movie.tagline}”</p>}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[...movie.genres, ...movie.languages].slice(0, 5).map((t) => (
              <span key={t} className="text-[11px] font-medium rounded-full bg-surface px-2 py-0.5 border border-line">
                {t}
              </span>
            ))}
          </div>
          <div className="text-xs font-semibold text-primary mt-2">View movie details →</div>
        </div>
      </Link>

      <div className="px-4 sm:px-5 pt-4">
        <RatingSummary movie={movie} size="sm" />
      </div>

      <div className="px-4 sm:px-5 py-4">
        <RateAndReview movie={movie} />
      </div>

      <div className="border-t border-line bg-surface-2/40 px-4 sm:px-5 py-3">
        <div className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Reviews</div>
        <ReviewList movie={movie} limit={expanded ? undefined : 2} />
      </div>
    </>
  );
}

/** Normal feed: images, likes and comments. */
function UpdateFeedBody({
  feed,
  expanded,
  onError,
  onShare,
}: {
  feed: Feed;
  expanded: boolean;
  onError: (msg: string) => void;
  onShare: () => void;
}) {
  const { user } = useSession();
  const [toggleLike] = useToggleLikeMutation();
  const [addComment, { isLoading: commenting }] = useAddCommentMutation();
  const [showAll, setShowAll] = useState(expanded);
  const [comment, setComment] = useState("");
  const commentRef = useRef<HTMLInputElement>(null);

  const liked = !!user && feed.likes.includes(user.id);
  const isAudience = user?.role === "audience";
  const visibleComments = showAll ? feed.comments : feed.comments.slice(-2);

  return (
    <>
      <PhotoGrid images={feed.images} alt={feed.filmTitle ?? feed.directorName} />

      <div className="flex items-center gap-4 px-4 sm:px-5 py-2.5 text-sm text-muted min-h-10">
        {feed.likes.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-like grid place-items-center">
              <HeartIcon filled size={11} className="text-white" />
            </span>
            {feed.likes.length}
          </span>
        )}
        {feed.comments.length > 0 && (
          <button onClick={() => setShowAll(true)} className="ml-auto hover:underline cursor-pointer">
            {feed.comments.length} comment{feed.comments.length === 1 ? "" : "s"}
          </button>
        )}
      </div>

      <div className="mx-4 sm:mx-5 border-t border-line grid grid-cols-3 py-1">
        <ActionButton
          active={liked}
          activeClass="text-like"
          disabled={!isAudience}
          needLogin={!user}
          onClick={() => {
            onError("");
            toggleLike(feed.id).unwrap().catch((e) => onError(errorMessage(e)));
          }}
          icon={<HeartIcon filled={liked} />}
          label={liked ? "Liked" : "Like"}
        />
        <ActionButton
          disabled={!isAudience}
          needLogin={!user}
          onClick={() => {
            setShowAll(true);
            setTimeout(() => commentRef.current?.focus(), 0);
          }}
          icon={<CommentIcon />}
          label="Comment"
        />
        {/* Anyone can share, signed in or not */}
        <button
          onClick={onShare}
          className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-muted hover:bg-surface-2 cursor-pointer"
        >
          <ShareIcon />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {user && !isAudience && (
        <p className="mx-4 sm:mx-5 mb-2 text-xs text-muted text-center">
          Directors can see reactions. Only audience members can like and comment.
        </p>
      )}

      {(feed.comments.length > 0 || isAudience) && (
        <div className="border-t border-line bg-surface-2/40 px-4 sm:px-5 py-3 space-y-3">
          {feed.comments.length > 2 && !showAll && (
            <button onClick={() => setShowAll(true)} className="text-sm font-semibold text-muted hover:underline cursor-pointer">
              View all {feed.comments.length} comments
            </button>
          )}
          {visibleComments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar name={c.userName} size={32} />
              <div className="min-w-0">
                <div className="bg-surface-2 rounded-2xl px-3.5 py-2 inline-block max-w-full">
                  <div className="text-[13px] font-bold">{c.userName}</div>
                  <div className="text-sm leading-snug break-words">{c.text}</div>
                </div>
                <div className="text-[11px] text-muted mt-1 ml-3">
                  <TimeAgo iso={c.createdAt} />
                </div>
              </div>
            </div>
          ))}

          {isAudience && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!comment.trim()) return;
                onError("");
                addComment({ id: feed.id, text: comment })
                  .unwrap()
                  .then(() => {
                    setComment("");
                    setShowAll(true);
                  })
                  .catch((err) => onError(errorMessage(err)));
              }}
              className="flex items-center gap-2.5"
            >
              <Avatar name={user!.name} size={32} />
              <div className="flex-1 relative">
                <input
                  ref={commentRef}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment…"
                  maxLength={1000}
                  className="input !rounded-full !py-2 !pr-11 text-sm"
                />
                <button
                  type="submit"
                  disabled={!comment.trim() || commenting}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full grid place-items-center text-primary disabled:text-muted/50 hover:bg-primary-soft cursor-pointer disabled:cursor-default disabled:hover:bg-transparent"
                  aria-label="Send comment"
                >
                  <SendIcon />
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {!user && (
        <div className="border-t border-line px-5 py-3 text-sm text-center text-muted">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>{" "}
          or{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            create an account
          </Link>{" "}
          to like and comment.
        </div>
      )}
    </>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  active,
  activeClass = "",
  disabled,
  needLogin,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
  disabled?: boolean;
  needLogin?: boolean;
}) {
  if (needLogin) {
    return (
      <Link
        href="/login"
        className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-muted hover:bg-surface-2"
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </Link>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:cursor-default disabled:opacity-50 enabled:hover:bg-surface-2 ${
        active ? activeClass : "text-muted"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
