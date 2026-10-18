"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { imageUrl } from "@/lib/api";
import { formatRuntime, movieYear } from "@/lib/movie";
import type { Movie } from "@/lib/types";
import { ClapperIcon } from "../Icons";
import { MovieImage } from "../MovieRating";
import { StarsDisplay, formatStars } from "../Stars";
import TrailerDialog from "./TrailerDialog";

const SLIDE_MS = 7000;

/**
 * Full-bleed cinematic banner of featured movies: auto-rotates, pauses on hover/focus,
 * supports arrows, swipe and the keyboard, and respects reduced-motion settings.
 */
export default function HeroCarousel({ movies }: { movies: Movie[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [trailer, setTrailer] = useState<Movie | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = movies.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read a browser setting after mount
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Auto-advance (restarts whenever the slide changes)
  useEffect(() => {
    if (count < 2 || paused || reduceMotion || trailer) return;
    const t = setTimeout(() => go(index + 1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, count, paused, reduceMotion, trailer, go]);

  // Pause while the tab is hidden
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (count === 0) return null;

  return (
    <section
      className="relative isolate -mt-16 overflow-hidden bg-bg text-white h-[620px] sm:h-[min(92vh,780px)] sm:min-h-[600px]"
      aria-roledescription="carousel"
      aria-label="Featured movies"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      onTouchStart={(e) => (touchX.current = e.touches[0]!.clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0]!.clientX - touchX.current;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      {/* Slides */}
      {movies.map((m, i) => (
        <Slide key={m.id} movie={m} active={i === index} index={i} total={count} onTrailer={() => setTrailer(m)} />
      ))}

      {/* Arrows */}
      {count > 1 && (
        <>
          <button
            onClick={() => go(index - 1)}
            className="hidden md:grid absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full place-items-center bg-white/10 hover:bg-white/25 backdrop-blur text-2xl cursor-pointer transition"
            aria-label="Previous movie"
          >
            ‹
          </button>
          <button
            onClick={() => go(index + 1)}
            className="hidden md:grid absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full place-items-center bg-white/10 hover:bg-white/25 backdrop-blur text-2xl cursor-pointer transition"
            aria-label="Next movie"
          >
            ›
          </button>
        </>
      )}

      {/* Thumbnails (desktop) / dots (mobile) */}
      {count > 1 && (
        <div className="absolute inset-x-0 bottom-0 z-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-6">
            <div className="hidden md:flex justify-end gap-3">
              {movies.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => go(i)}
                  aria-label={`Show ${m.title}`}
                  aria-current={i === index}
                  className={`group relative w-36 aspect-video rounded-lg overflow-hidden ring-2 transition cursor-pointer ${
                    i === index ? "ring-white scale-105" : "ring-white/10 opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- user uploads and external URLs */}
                  <img src={imageUrl(m.bannerImage ?? m.movieImage ?? "")} alt="" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className="absolute bottom-1.5 left-2 right-2 text-left text-[11px] font-semibold leading-tight line-clamp-1">
                    {m.title}
                  </span>
                  {i === index && !paused && !reduceMotion && (
                    <span
                      key={index}
                      className="absolute left-0 bottom-0 h-0.5 w-full origin-left bg-white motion-safe-anim"
                      style={{ animation: `progress ${SLIDE_MS}ms linear forwards` }}
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="flex md:hidden justify-center gap-2">
              {movies.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => go(i)}
                  aria-label={`Show ${m.title}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${i === index ? "w-8 bg-white" : "w-3 bg-white/40"}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {trailer?.trailerUrl && <TrailerDialog url={trailer.trailerUrl} title={trailer.title} onClose={() => setTrailer(null)} />}
    </section>
  );
}

function Slide({
  movie,
  active,
  index,
  total,
  onTrailer,
}: {
  movie: Movie;
  active: boolean;
  index: number;
  total: number;
  onTrailer: () => void;
}) {
  const banner = movie.bannerImage ?? movie.movieImage;
  const usesBanner = !!movie.bannerImage;
  const facts = [movieYear(movie), formatRuntime(movie.runtimeMinutes), movie.certification].filter(Boolean);

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-1000 ${active ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}: ${movie.title}`}
      aria-hidden={!active}
    >
      {/* Background */}
      {banner ? (
        // eslint-disable-next-line @next/next/no-img-element -- user uploads and external URLs
        <img
          src={imageUrl(banner)}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover motion-safe-anim ${usesBanner ? "" : "blur-2xl scale-125 opacity-70"}`}
          style={active && usesBanner ? { animation: "kenburns 14s ease-out forwards" } : undefined}
        />
      ) : (
        <div className="absolute inset-0 brand-gradient opacity-60" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/75 to-bg/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/40" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl h-full px-4 sm:px-6 flex items-end sm:items-center gap-10 pt-20 pb-20 sm:pb-28">
        <div key={active ? "on" : "off"} className="max-w-2xl" style={active ? { animation: "fadeUp .7s ease-out both" } : undefined}>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
            <span className="inline-flex items-center gap-1.5 text-white/80">
              <ClapperIcon size={14} /> Featured
            </span>
            <span className="text-white/30">•</span>
            <span className="text-white/80">{movie.status}</span>
            {movie.ratingOpen && (
              <span className="ml-1 rounded-full brand-gradient px-2.5 py-1 text-[10px] tracking-wider shadow-lg shadow-primary/30">
                Open for rating
              </span>
            )}
          </div>

          <h2 className="mt-4 text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[0.95] drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            {movie.title}
          </h2>
          {movie.tagline && <p className="mt-4 text-lg sm:text-xl text-white/85 italic max-w-xl">“{movie.tagline}”</p>}

          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-white/80">
            {facts.map((f) => (
              <span key={String(f)}>{f}</span>
            ))}
            {[...movie.genres, ...movie.languages].slice(0, 4).map((t) => (
              <span key={t} className="rounded-full border border-white/20 bg-white/10 backdrop-blur px-2.5 py-0.5 text-xs font-medium">
                {t}
              </span>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            {movie.ratingCount > 0 ? (
              <span className="inline-flex items-center gap-2">
                <span className="text-3xl font-extrabold">{formatStars(movie.average)}</span>
                <span>
                  <StarsDisplay value={movie.average} size={16} />
                  <span className="block text-xs text-white/60 mt-0.5">
                    {movie.ratingCount} rating{movie.ratingCount === 1 ? "" : "s"} · {movie.reviewCount} review
                    {movie.reviewCount === 1 ? "" : "s"}
                  </span>
                </span>
              </span>
            ) : (
              <span className="text-sm text-white/60">{movie.ratingOpen ? "Be the first to rate it" : "Not rated yet"}</span>
            )}
            <span className="text-sm text-white/70">
              Directed by <b className="text-white">{movie.directorName}</b>
            </span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {movie.ratingOpen && movie.ratingFeedId ? (
              <Link
                href={`/feeds/${movie.ratingFeedId}`}
                tabIndex={active ? 0 : -1}
                className="btn !px-6 !py-3 btn-primary"
              >
                <ClapperIcon size={18} /> Rate &amp; review
              </Link>
            ) : (
              <Link href={`/movies/${movie.id}`} tabIndex={active ? 0 : -1} className="btn !px-6 !py-3 btn-primary">
                View details
              </Link>
            )}
            {movie.trailerUrl && (
              <button onClick={onTrailer} tabIndex={active ? 0 : -1} className="btn !px-6 !py-3 btn-glass">
                ▶ Watch trailer
              </button>
            )}
            {movie.ratingOpen && (
              <Link
                href={`/movies/${movie.id}`}
                tabIndex={active ? 0 : -1}
                className="btn !px-6 !py-3 btn-glass"
              >
                Details
              </Link>
            )}
          </div>
        </div>

        {/* Movie image */}
        <Link
          href={`/movies/${movie.id}`}
          tabIndex={-1}
          aria-hidden
          className="hidden lg:block ml-auto w-64 xl:w-72 shrink-0 rotate-2 hover:rotate-0 transition duration-500"
        >
          <MovieImage movie={movie} className="shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/15" />
        </Link>
      </div>
    </div>
  );
}
