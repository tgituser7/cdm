import Link from "next/link";
import { STATUS_STYLES, formatRuntime, movieYear } from "@/lib/movie";
import type { Movie } from "@/lib/types";
import { MovieImage } from "./MovieRating";
import { StarsDisplay, formatStars } from "./Stars";
import TimeAgo from "./TimeAgo";

/** A movie in the Movies grid: image, title, director, key facts and its rating. */
export default function MovieCard({ movie }: { movie: Movie }) {
  const facts = [movieYear(movie), formatRuntime(movie.runtimeMinutes), movie.certification].filter(Boolean).join(" · ");

  return (
    <Link href={`/movies/${movie.id}`} className="group flex flex-col">
      <div className="relative">
        <MovieImage movie={movie} className="w-full transition duration-200 group-hover:-translate-y-1 group-hover:shadow-xl" />
        <span className={`absolute top-2 left-2 text-[10px] font-bold rounded-full px-2 py-0.5 shadow-sm ${STATUS_STYLES[movie.status]}`}>
          {movie.status}
        </span>
        {movie.ratingOpen && (
          <span className="absolute top-2 right-2 text-[10px] font-bold rounded-full px-2 py-0.5 brand-gradient text-white shadow-sm">
            🎬 Rate now
          </span>
        )}
      </div>

      <div className="mt-3 min-w-0">
        <div className="font-bold leading-tight line-clamp-1 group-hover:text-primary">{movie.title}</div>
        <div className="text-xs text-muted mt-0.5 line-clamp-1">
          {movie.directorName}
          {facts && ` · ${facts}`}
        </div>
        {(movie.genres.length > 0 || movie.languages.length > 0) && (
          <div className="text-xs text-muted mt-0.5 line-clamp-1">{[...movie.genres, ...movie.languages].join(" · ")}</div>
        )}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
          {movie.ratingCount > 0 ? (
            <>
              <StarsDisplay value={movie.average} size={13} />
              <span className="font-bold">{formatStars(movie.average)}</span>
              <span className="text-muted">({movie.ratingCount})</span>
            </>
          ) : (
            <span className="text-muted">{movie.ratingOpen ? "Be the first to rate" : "Not rated yet"}</span>
          )}
        </div>
        {movie.ratingOpen && movie.ratingRequestedAt && (
          <div className="mt-1 text-[11px] font-semibold text-primary">
            Rating asked <TimeAgo iso={movie.ratingRequestedAt} />
          </div>
        )}
      </div>
    </Link>
  );
}
