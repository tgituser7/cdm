"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Movie } from "@/lib/types";
import { useGetMoviesQuery } from "@/store/feedApi";
import { useSession } from "@/store/hooks";
import HeroCarousel from "./HeroCarousel";
import MovieRail from "./MovieRail";

const hasImage = (m: Movie) => !!(m.bannerImage || m.movieImage);

/** The dark, cinematic top of the home page: featured hero banner + movie rows. */
export default function Showcase() {
  const { ready } = useSession();
  return ready ? <ShowcaseContent /> : <ShowcaseSkeleton />;
}

function ShowcaseContent() {
  const { user } = useSession();
  const { data: movies = [], isLoading } = useGetMoviesQuery({ sort: "latest" });

  const rails = useMemo(() => {
    const askedAt = (m: Movie) => (m.ratingRequestedAt ? Date.parse(m.ratingRequestedAt) : 0);
    // Movies directors most recently asked audiences to rate
    const open = movies.filter((m) => m.ratingOpen).sort((a, b) => askedAt(b) - askedAt(a));
    const top = movies
      .filter((m) => m.ratingCount > 0)
      .sort((a, b) => (b.average ?? 0) - (a.average ?? 0) || b.ratingCount - a.ratingCount)
      .slice(0, 10);
    const soon = movies
      .filter((m) => m.status !== "Released")
      .sort((a, b) => (a.releaseDate ?? "9999").localeCompare(b.releaseDate ?? "9999"));
    // Featured: open for rating first, then those with a banner, then the rest — only movies with an image.
    const featured = [...movies]
      .filter(hasImage)
      .sort(
        (a, b) =>
          Number(b.ratingOpen) - Number(a.ratingOpen) ||
          askedAt(b) - askedAt(a) ||
          Number(!!b.bannerImage) - Number(!!a.bannerImage) ||
          b.ratingCount - a.ratingCount,
      )
      .slice(0, 6);
    return { open, top, soon, recent: movies.slice(0, 12), featured };
  }, [movies]);

  if (isLoading) return <ShowcaseSkeleton />;

  if (movies.length === 0) {
    return (
      <section className="relative isolate -mt-16 overflow-hidden bg-bg text-white">
        <div className="absolute inset-0 brand-gradient opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-36 pb-24">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-[1.02]">
            Your front-row seat to Indian cinema.
          </h1>
          <p className="mt-4 text-lg text-white/75 max-w-xl">
            Directors share their films and updates. Audiences rate, review and cheer them on.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user?.role === "director" ? (
              <Link href="/director" className="btn !px-6 !py-3 btn-primary">
                Add your first movie
              </Link>
            ) : !user ? (
              <Link href="/signup" className="btn !px-6 !py-3 btn-primary">
                Join Dharshak Manch
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="bg-bg">
      <HeroCarousel movies={rails.featured.length ? rails.featured : movies.slice(0, 6)} />
      <div className="relative z-10 mt-4 sm:-mt-6 space-y-12 pb-20">
        <MovieRail
          title="🎬 Latest rating requests"
          subtitle="Directors just asked for your verdict. Rate and review these now."
          movies={rails.open}
          seeAllHref="/movies?open=1"
          variant="banner"
        />
        <MovieRail title="Top 10 on Dharshak Manch" subtitle="Highest rated by audiences" movies={rails.top} seeAllHref="/movies?sort=top" variant="ranked" />
        <MovieRail title="Coming soon" subtitle="Announced and releasing soon" movies={rails.soon} seeAllHref="/movies?sort=release" />
        <MovieRail title="Recently added" movies={rails.recent} seeAllHref="/movies" />
      </div>
    </div>
  );
}

function ShowcaseSkeleton() {
  return (
    <div className="bg-bg -mt-16">
      <div className="h-[620px] sm:h-[min(92vh,780px)] sm:min-h-[600px] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent animate-pulse" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-48 space-y-4">
          <div className="h-4 w-40 rounded bg-white/10" />
          <div className="h-16 w-2/3 max-w-xl rounded bg-white/10" />
          <div className="h-5 w-1/2 max-w-md rounded bg-white/10" />
          <div className="flex gap-3 pt-4">
            <div className="h-12 w-40 rounded-xl bg-white/15" />
            <div className="h-12 w-40 rounded-xl bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
