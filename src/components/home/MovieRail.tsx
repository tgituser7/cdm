"use client";

import Link from "next/link";
import { useRef } from "react";
import { imageUrl } from "@/lib/api";
import { movieYear } from "@/lib/movie";
import type { Movie } from "@/lib/types";
import { ClapperIcon } from "../Icons";
import { MovieImage } from "../MovieRating";
import { StarsDisplay, formatStars } from "../Stars";
import TimeAgo from "../TimeAgo";

type Variant = "poster" | "ranked" | "banner";

/** A horizontally scrolling row of movies (Netflix-style), for the dark showcase on the home page. */
export default function MovieRail({
  title,
  subtitle,
  movies,
  seeAllHref,
  variant = "poster",
}: {
  title: string;
  subtitle?: string;
  movies: Movie[];
  seeAllHref?: string;
  variant?: Variant;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  if (movies.length === 0) return null;

  const scroll = (dir: number) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="relative group/rail">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">{title}</h2>
          {subtitle && <p className="text-sm text-white/55 mt-0.5">{subtitle}</p>}
        </div>
        {seeAllHref && (
          <Link href={seeAllHref} className="shrink-0 text-sm font-semibold text-white/70 hover:text-white">
            See all →
          </Link>
        )}
      </div>

      <div className="relative">
        <div
          ref={scroller}
          className="no-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-4 sm:px-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] pb-2"
        >
          {movies.map((m, i) =>
            variant === "banner" ? (
              <BannerCard key={m.id} movie={m} />
            ) : variant === "ranked" ? (
              <RankedCard key={m.id} movie={m} rank={i + 1} />
            ) : (
              <PosterCard key={m.id} movie={m} />
            ),
          )}
        </div>

        {/* Scroll buttons (desktop, on hover) */}
        <button
          onClick={() => scroll(-1)}
          className="hidden md:grid absolute left-2 top-[40%] -translate-y-1/2 w-11 h-11 place-items-center rounded-full bg-black/60 hover:bg-black/80 text-white text-2xl opacity-0 group-hover/rail:opacity-100 transition cursor-pointer"
          aria-label={`Scroll ${title} left`}
        >
          ‹
        </button>
        <button
          onClick={() => scroll(1)}
          className="hidden md:grid absolute right-2 top-[40%] -translate-y-1/2 w-11 h-11 place-items-center rounded-full bg-black/60 hover:bg-black/80 text-white text-2xl opacity-0 group-hover/rail:opacity-100 transition cursor-pointer"
          aria-label={`Scroll ${title} right`}
        >
          ›
        </button>
      </div>
    </section>
  );
}

function RatingLine({ movie }: { movie: Movie }) {
  return movie.ratingCount > 0 ? (
    <span className="inline-flex items-center gap-1.5 text-xs text-white/80">
      <StarsDisplay value={movie.average} size={12} />
      <b className="text-white">{formatStars(movie.average)}</b>
      <span className="text-white/50">({movie.ratingCount})</span>
    </span>
  ) : (
    <span className="text-xs text-white/50">{movie.ratingOpen ? "Be the first to rate" : "Not rated yet"}</span>
  );
}

function PosterCard({ movie }: { movie: Movie }) {
  return (
    <Link href={`/movies/${movie.id}`} className="group snap-start shrink-0 w-36 sm:w-44 lg:w-48">
      <div className="relative rounded-xl overflow-hidden ring-1 ring-white/10 transition duration-300 group-hover:ring-white/50 group-hover:-translate-y-1.5 group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.8)]">
        <MovieImage movie={movie} className="!rounded-none !shadow-none !bg-white/[0.06]" />
        {movie.ratingOpen && (
          <span className="absolute top-2 left-2 rounded-full brand-gradient px-2 py-0.5 text-[10px] font-bold text-white shadow">
            Rate now
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-3">
          {movie.tagline && <p className="text-[11px] italic text-white/85 line-clamp-3">“{movie.tagline}”</p>}
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white">
            <ClapperIcon size={12} /> {movie.ratingOpen ? "Rate & review" : "View details"}
          </span>
        </div>
      </div>
      <div className="mt-2.5 px-0.5">
        <div className="font-bold text-sm text-white line-clamp-1">{movie.title}</div>
        <div className="text-xs text-white/50 line-clamp-1">
          {[movieYear(movie), movie.genres[0], movie.languages[0]].filter(Boolean).join(" · ")}
        </div>
        <div className="mt-1">
          <RatingLine movie={movie} />
        </div>
      </div>
    </Link>
  );
}

function RankedCard({ movie, rank }: { movie: Movie; rank: number }) {
  return (
    <Link href={`/movies/${movie.id}`} className={`group snap-start shrink-0 relative ${rank >= 10 ? "pl-20 sm:pl-24" : "pl-12 sm:pl-16"}`}>
      {/* The big outlined number sits beside the image (bottom-aligned with it), partly behind it */}
      <span
        className="rank-number absolute left-0 bottom-12 text-[96px] sm:text-[128px] font-black leading-[0.72] select-none tracking-tighter"
        aria-hidden
      >
        {rank}
      </span>
      <div className="relative w-32 sm:w-40 rounded-xl overflow-hidden ring-1 ring-white/10 transition duration-300 group-hover:ring-white/50 group-hover:-translate-y-1.5">
        <MovieImage movie={movie} className="!rounded-none !shadow-none !bg-white/[0.06]" />
      </div>
      <div className="mt-2 h-10 w-32 sm:w-40 px-0.5">
        <div className="font-bold text-sm text-white line-clamp-1">
          <span className="sr-only">#{rank} </span>
          {movie.title}
        </div>
        <RatingLine movie={movie} />
      </div>
    </Link>
  );
}

function BannerCard({ movie }: { movie: Movie }) {
  const img = movie.bannerImage ?? movie.movieImage;
  return (
    <Link
      href={movie.ratingOpen && movie.ratingFeedId ? `/feeds/${movie.ratingFeedId}` : `/movies/${movie.id}`}
      className="group snap-start shrink-0 w-72 sm:w-96 relative aspect-video rounded-2xl overflow-hidden ring-1 ring-white/10 hover:ring-white/50 transition bg-white/[0.06]"
    >
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element -- user uploads and external URLs
        <img src={imageUrl(img)} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
      ) : (
        <div className="absolute inset-0 brand-gradient" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/70">
          {movie.status}
          {movie.ratingOpen && <span className="rounded-full brand-gradient px-2 py-0.5 text-white">Rate now</span>}
        </div>
        <div className="mt-1 text-lg font-extrabold text-white leading-tight line-clamp-1">{movie.title}</div>
        {movie.ratingOpen && movie.ratingRequestedAt && (
          <div className="text-xs text-white/60">
            {movie.directorName} asked <TimeAgo iso={movie.ratingRequestedAt} />
          </div>
        )}
        <div className="mt-1 flex items-center justify-between gap-2">
          <RatingLine movie={movie} />
          <span className="text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition inline-flex items-center gap-1">
            <ClapperIcon size={12} /> {movie.ratingOpen ? "Rate & review" : "Details"}
          </span>
        </div>
      </div>
    </Link>
  );
}
