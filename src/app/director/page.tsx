"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AskRatingDialog from "@/components/AskRatingDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import Avatar from "@/components/Avatar";
import Composer from "@/components/Composer";
import { FilmIcon } from "@/components/Icons";
import MovieFormDialog from "@/components/MovieFormDialog";
import { MovieImage } from "@/components/MovieRating";
import RatingRequestActions from "@/components/RatingRequestActions";
import FeedCard from "@/components/FeedCard";
import { StarsDisplay, formatStars } from "@/components/Stars";
import { formatLocation } from "@/lib/geo";
import { STATUS_STYLES, movieMeta } from "@/lib/movie";
import type { Movie, User } from "@/lib/types";
import { useDeleteMovieMutation, useGetFeedsQuery, useGetMoviesQuery } from "@/store/feedApi";
import { useSession } from "@/store/hooks";

export default function DirectorStudio() {
  const { user, ready } = useSession();

  if (!ready) return null;

  if (user?.role !== "director") {
    return (
      <div className="mx-auto max-w-md px-4 py-24">
        <div className="card p-8 text-center">
          <span className="brand-gradient w-14 h-14 rounded-2xl grid place-items-center mx-auto text-white">
            <FilmIcon size={26} />
          </span>
          <h1 className="text-2xl font-extrabold mt-4">Director Studio</h1>
          <p className="mt-2 text-muted">Sign in as a director to add your movies and share updates from them.</p>
          <div className="mt-6 flex gap-2 justify-center">
            <Link href="/login" className="btn btn-ghost">
              Sign in
            </Link>
            <Link href="/signup" className="btn btn-primary">
              Join as director
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Studio user={user} />;
}

function Studio({ user }: { user: User }) {
  const [tab, setTab] = useState<"feeds" | "movies">("feeds");
  const { data: feedData, isLoading: feedLoading } = useGetFeedsQuery({ sort: "latest", filter: "all" });
  const { data: movies = [], isLoading: moviesLoading } = useGetMoviesQuery({ director: "me" });

  // Sorted by date only (the feed endpoint ranks by location first).
  const mine = (feedData?.feeds ?? [])
    .filter((p) => p.directorId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const totalLikes = mine.reduce((n, p) => n + p.likes.length, 0);
  const totalThoughts = mine.reduce((n, p) => n + p.thoughts.length, 0);
  const ratings = movies.reduce((n, m) => n + m.ratingCount, 0);
  const reviews = movies.reduce((n, m) => n + m.reviewCount, 0);
  const avg = ratings ? movies.reduce((n, m) => n + (m.average ?? 0) * m.ratingCount, 0) / ratings : null;

  return (
    <div className="pb-10">
      <div className="bg-surface border-b border-line">
        <div className="mx-auto max-w-5xl">
          <div className="h-40 sm:h-56 brand-gradient sm:rounded-b-2xl relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-72 h-72 rounded-full bg-white/10" />
            <div className="absolute right-40 bottom-[-60px] w-48 h-48 rounded-full bg-white/10" />
          </div>
          <div className="px-4 sm:px-8 flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-10">
            <Avatar name={user.name} size={120} ring />
            <div className="flex-1 pb-1">
              <h1 className="text-3xl font-extrabold tracking-tight">{user.name}</h1>
              <p className="text-muted text-sm mt-0.5">
                Director · {movies.length} movies · {mine.length} feeds
                {user.location?.city && <> · 📍 {formatLocation(user.location)}</>}
              </p>
              {user.bio && <p className="text-sm mt-2 max-w-xl">{user.bio}</p>}
            </div>
          </div>
          <nav className="px-4 sm:px-8 mt-4 flex gap-1">
            {(
              [
                ["feeds", `Feeds (${mine.length})`],
                ["movies", `My Movies (${movies.length})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative px-4 py-3 text-sm font-semibold cursor-pointer ${tab === key ? "text-primary" : "text-muted hover:text-text"}`}
              >
                {label}
                {tab === key && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full brand-gradient" />}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-4 mt-6 grid gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="card p-4">
            <h2 className="font-bold mb-3">Audience response</h2>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Likes" value={totalLikes} />
              <Stat label="Thoughts" value={totalThoughts} />
              <Stat label="Ratings" value={ratings} />
              <Stat label="Reviews" value={reviews} />
              <div className="col-span-2 rounded-xl bg-surface-2 p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted">Average movie rating</div>
                  <div className="text-xl font-extrabold">{formatStars(avg)} / 5</div>
                </div>
                <StarsDisplay value={avg} size={16} />
              </div>
            </div>
          </section>
        </aside>

        <div className="space-y-4 min-w-0">
          {tab === "feeds" ? (
            <>
              <Composer />
              {feedLoading ? (
                <div className="card h-64 animate-pulse" />
              ) : mine.length === 0 ? (
                <div className="card p-10 text-center text-muted">You haven&apos;t added any feed yet. Share your first update above.</div>
              ) : (
                mine.map((p) => <FeedCard key={p.id} feed={p} />)
              )}
            </>
          ) : (
            <MoviesTab movies={movies} loading={moviesLoading} />
          )}
        </div>
      </div>
    </div>
  );
}

function MoviesTab({ movies, loading }: { movies: Movie[]; loading: boolean }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Movie | null>(null);
  const [asking, setAsking] = useState<Movie | null>(null);
  const [deleting, setDeleting] = useState<Movie | null>(null);
  const [deleteMovie] = useDeleteMovieMutation();
  const [notice, setNotice] = useState("");

  return (
    <>
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="font-bold">Your movies</div>
          <p className="text-sm text-muted">Add each film with its details, then ask audiences to rate it when you&apos;re ready.</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn btn-primary">
          + Add movie
        </button>
      </div>

      {notice && (
        <div className="rounded-xl bg-primary-soft border border-primary/30 text-text text-sm px-4 py-3 flex items-center gap-2">
          ✅ <span className="flex-1">{notice}</span>
          <button onClick={() => setNotice("")} className="font-semibold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="card h-48 animate-pulse" />
      ) : movies.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl">🎬</div>
          <div className="font-bold mt-3">No movies yet</div>
          <p className="text-sm text-muted mt-1">Add your first movie to share its details and collect ratings.</p>
          <button onClick={() => setAdding(true)} className="btn btn-primary mt-5">
            + Add movie
          </button>
        </div>
      ) : (
        movies.map((m) => (
          <article key={m.id} className="card p-4 flex gap-4">
            <Link href={`/movies/${m.id}`} className="w-24 sm:w-28 shrink-0">
              <MovieImage movie={m} />
            </Link>
            <div className="min-w-0 flex-1 flex flex-col">
              <div className="flex items-start gap-2 flex-wrap">
                <Link href={`/movies/${m.id}`} className="text-lg font-extrabold leading-tight hover:text-primary">
                  {m.title}
                </Link>
                <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${STATUS_STYLES[m.status]}`}>{m.status}</span>
              </div>
              <div className="text-xs text-muted mt-1">
                {[movieMeta(m), m.genres.join(", "), m.languages.join(", ")].filter(Boolean).join(" · ")}
              </div>
              {m.tagline && <p className="text-sm italic text-text/80 mt-2 line-clamp-1">“{m.tagline}”</p>}

              {m.ratingCount > 0 && (
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <StarsDisplay value={m.average} size={16} />
                  <b>{formatStars(m.average)}</b>
                  <span className="text-muted">
                    · {m.ratingCount} ratings · {m.reviewCount} reviews
                  </span>
                </div>
              )}

              <div className="mt-auto pt-3 flex flex-wrap items-center gap-2">
                <RatingRequestActions movie={m} onAsk={() => setAsking(m)} size="sm" />
                <button onClick={() => setEditing(m)} className="btn btn-soft !py-2">
                  Edit
                </button>
                <button
                  onClick={() => setDeleting(m)}
                  className="btn btn-ghost !py-2 hover:!text-like"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))
      )}

      {adding && <MovieFormDialog onClose={() => setAdding(false)} onSaved={(m) => setNotice(`${m.title} was added. Click "Ask For Rating" when you want audiences to rate it.`)} />}
      {editing && <MovieFormDialog movie={editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.title}?`}
          description="The movie, its rating feeds, ratings and reviews will all be deleted. This can't be undone."
          confirmLabel="Delete movie"
          busyLabel="Deleting…"
          onConfirm={() => deleteMovie(deleting.id).unwrap()}
          onClose={() => setDeleting(null)}
        />
      )}
      {asking && (
        <AskRatingDialog
          movie={asking}
          onClose={() => setAsking(null)}
          onShared={(feedId) => router.push(`/feeds/${feedId}`)}
        />
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-xl font-extrabold">{value}</div>
    </div>
  );
}
