"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { imageUrl } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { STATUS_STYLES, formatRuntime, movieYear, youtubeEmbed } from "@/lib/movie";
import type { Movie } from "@/lib/types";
import { useGetMovieQuery } from "@/store/feedApi";
import { useSession } from "@/store/hooks";
import AskRatingDialog from "./AskRatingDialog";
import Avatar from "./Avatar";
import MovieFormDialog from "./MovieFormDialog";
import RatingRequestActions from "./RatingRequestActions";
import { MovieImage, RateAndReview, RatingSummary, ReviewList } from "./MovieRating";

export default function MovieView() {
  const { id } = useParams<{ id: string }>();
  const { ready } = useSession();
  if (!ready) return <div className="mx-auto max-w-5xl px-4 py-10"><div className="card h-96 animate-pulse" /></div>;
  return <MovieById id={id} />;
}

function MovieById({ id }: { id: string }) {
  const { data: movie, isLoading, isError } = useGetMovieQuery(id);
  if (isLoading) return <div className="mx-auto max-w-5xl px-4 py-10"><div className="card h-96 animate-pulse" /></div>;
  if (isError || !movie) {
    return (
      <div className="mx-auto max-w-md px-4 py-24">
        <div className="card p-10 text-center">
          <div className="text-xl font-bold">Movie not found</div>
          <p className="text-muted mt-1 text-sm">It may have been removed by the director.</p>
          <Link href="/" className="btn btn-primary mt-6">
            Go to Feed
          </Link>
        </div>
      </div>
    );
  }
  return <MovieDetails movie={movie} />;
}

function MovieDetails({ movie }: { movie: Movie }) {
  const { user } = useSession();
  const [editing, setEditing] = useState(false);
  const [asking, setAsking] = useState(false);
  const isOwner = user?.id === movie.directorId;
  const embed = youtubeEmbed(movie.trailerUrl);
  const year = movieYear(movie);

  return (
    <div className="pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-surface">
        {movie.movieImage && (
          // eslint-disable-next-line @next/next/no-img-element -- decorative blurred backdrop
          <img src={imageUrl(movie.movieImage)} alt="" className="absolute inset-0 h-full w-full object-cover scale-110 blur-3xl opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/70 to-surface" />
        <div className="relative mx-auto max-w-5xl px-4 py-8 sm:py-12">
          <Link href="/" className="text-sm font-semibold text-muted hover:text-primary">
            ← Back to Feed
          </Link>
          <div className="mt-6 grid gap-6 sm:grid-cols-[220px_1fr]">
            <MovieImage movie={movie} className="w-44 sm:w-full mx-auto sm:mx-0 shadow-xl" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-bold rounded-full px-2.5 py-1 ${STATUS_STYLES[movie.status]}`}>{movie.status}</span>
                {movie.certification && (
                  <span className="text-xs font-bold rounded border border-text/30 px-1.5 py-0.5">{movie.certification}</span>
                )}
                {movie.ratingOpen && (
                  <span className="text-xs font-bold rounded-full px-2.5 py-1 bg-orange-50 text-star">🎬 Open for ratings</span>
                )}
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-3">
                {movie.title} {year && <span className="text-muted font-bold text-3xl">({year})</span>}
              </h1>
              {movie.tagline && <p className="text-lg italic text-text/80 mt-2">“{movie.tagline}”</p>}
              <div className="text-sm text-muted mt-3 flex flex-wrap gap-x-3 gap-y-1">
                <span>
                  Directed by <b className="text-text">{movie.directorName}</b>
                </span>
                {movie.releaseDate && <span>· Releases {formatDate(movie.releaseDate)}</span>}
                {movie.runtimeMinutes && <span>· {formatRuntime(movie.runtimeMinutes)}</span>}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {movie.genres.map((g) => (
                  <span key={g} className="text-xs font-semibold rounded-full bg-primary-soft text-primary px-3 py-1">
                    {g}
                  </span>
                ))}
                {movie.languages.map((l) => (
                  <span key={l} className="text-xs font-semibold rounded-full bg-surface-2 border border-line px-3 py-1">
                    {l}
                  </span>
                ))}
              </div>
              {movie.ratingCount > 0 && (
                <div className="mt-5 max-w-sm">
                  <RatingSummary movie={movie} size="sm" />
                </div>
              )}
              {isOwner && (
                <div className="mt-5 flex flex-wrap gap-2">
                  <RatingRequestActions movie={movie} onAsk={() => setAsking(true)} />
                  <button onClick={() => setEditing(true)} className="btn btn-soft">
                    Edit movie
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6 min-w-0">
          {movie.synopsis && (
            <section className="card p-5">
              <h2 className="font-bold text-lg mb-2">Synopsis</h2>
              <p className="leading-relaxed whitespace-pre-line text-text/90">{movie.synopsis}</p>
            </section>
          )}

          {embed && (
            <section className="card overflow-hidden">
              <h2 className="font-bold text-lg px-5 pt-5 pb-3">Trailer</h2>
              <div className="aspect-video bg-black">
                <iframe src={embed} title={`${movie.title} trailer`} className="w-full h-full" allowFullScreen />
              </div>
            </section>
          )}

          <section className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Ratings &amp; reviews</h2>
              <span className="text-sm text-muted">{movie.reviewCount} reviews</span>
            </div>
            {movie.ratingCount > 0 && (
              <div className="mb-5">
                <RatingSummary movie={movie} />
              </div>
            )}
            <div className="mb-5">
              <RateAndReview movie={movie} />
            </div>
            <ReviewList movie={movie} />
          </section>
        </div>

        <aside className="space-y-4">
          {movie.cast.length > 0 && (
            <section className="card p-4">
              <h2 className="font-bold mb-3">Cast</h2>
              <ul className="space-y-3">
                {movie.cast.map((c) => (
                  <li key={`${c.name}-${c.role}`} className="flex items-center gap-3">
                    <Avatar name={c.name} size={36} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{c.name}</div>
                      {c.role && <div className="text-xs text-muted truncate">as {c.role}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="card p-4">
            <h2 className="font-bold mb-3">Team</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Director</dt>
                <dd className="font-semibold text-right">{movie.directorName}</dd>
              </div>
              {movie.team.map((t, i) => (
                <div key={`${t.role}-${t.name}-${i}`} className="flex justify-between gap-3">
                  <dt className="text-muted">{t.role}</dt>
                  <dd className="font-semibold text-right">{t.name}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>

      {editing && <MovieFormDialog movie={movie} onClose={() => setEditing(false)} />}
      {asking && <AskRatingDialog movie={movie} onClose={() => setAsking(false)} />}
    </div>
  );
}
