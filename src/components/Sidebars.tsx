"use client";

import Link from "next/link";
import { useMemo } from "react";
import { imageUrl } from "@/lib/api";
import { formatLocation } from "@/lib/geo";
import type { Feed } from "@/lib/types";
import { useGetMoviesQuery } from "@/store/feedApi";
import { useAppDispatch, useSession } from "@/store/hooks";
import { openLocationPrompt } from "@/store/sessionSlice";
import Avatar from "./Avatar";
import { ClapperIcon, FilmIcon, HomeIcon } from "./Icons";
import { MovieImage } from "./MovieRating";
import { StarsDisplay, formatStars } from "./Stars";

export function LeftSidebar({ feeds }: { feeds: Feed[] }) {
  const { user, ready } = useSession();
  const dispatch = useAppDispatch();

  const stats = useMemo(() => {
    if (!user) return null;
    if (user.role === "director") {
      const mine = feeds.filter((p) => p.directorId === user.id);
      return [
        ["Feeds", mine.length],
        ["Likes", mine.reduce((n, p) => n + p.likes.length, 0)],
        ["Thoughts", mine.reduce((n, p) => n + p.thoughts.length, 0)],
      ] as const;
    }
    return [
      ["Liked", feeds.filter((p) => p.likes.includes(user.id)).length],
      ["Rated", feeds.filter((p) => p.movie?.myRating).length],
      ["Thoughts", feeds.reduce((n, p) => n + p.thoughts.filter((c) => c.userId === user.id).length, 0)],
    ] as const;
  }, [user, feeds]);

  if (!ready) return <div className="card h-56 animate-pulse" />;

  return (
    <div className="space-y-4">
      {user ? (
        <div className="card overflow-hidden">
          <div className="h-16 brand-gradient" />
          <div className="px-4 pb-4 -mt-8">
            <Avatar name={user.name} size={64} ring />
            <div className="mt-2 font-bold text-lg leading-tight">{user.name}</div>
            <div className="text-sm text-muted">{user.role === "director" ? "Director" : "Audience member"}</div>
            <button
              onClick={() => dispatch(openLocationPrompt())}
              className="mt-2 text-xs text-muted hover:text-primary cursor-pointer text-left"
            >
              📍 {user.location?.city ? formatLocation(user.location) : "Set your location"}{" "}
              <span className="text-primary font-semibold">· {user.location?.city ? "Change" : "Add"}</span>
            </button>
            {stats && (
              <div className="grid grid-cols-3 mt-4 pt-3 border-t border-line text-center">
                {stats.map(([label, value]) => (
                  <div key={label}>
                    <div className="font-bold">{value}</div>
                    <div className="text-[11px] text-muted">{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card p-5">
          <div className="font-bold text-lg leading-snug">
            Your front-row seat to <span className="brand-text">Indian cinema</span>
          </div>
          <p className="text-sm text-muted mt-2">Directors share updates and images. Join to like, rate and share your thoughts.</p>
          <Link href="/signup" className="btn btn-primary w-full mt-4">
            Create account
          </Link>
          <Link href="/login" className="btn btn-ghost w-full mt-2">
            Sign in
          </Link>
        </div>
      )}

      <nav className="card p-2 text-sm font-semibold">
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-2">
          <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary grid place-items-center">
            <HomeIcon size={18} />
          </span>
          Feed
        </Link>
        <Link href="/movies" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-2">
          <span className="w-8 h-8 rounded-lg bg-orange-50 text-star grid place-items-center">
            <ClapperIcon size={18} />
          </span>
          Movies
        </Link>
        {user?.role === "director" && (
          <Link href="/director" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-2">
            <span className="w-8 h-8 rounded-lg bg-pink-100 text-accent grid place-items-center">
              <FilmIcon size={18} />
            </span>
            My Studio
          </Link>
        )}
      </nav>
    </div>
  );
}

export function RightSidebar({ feeds }: { feeds: Feed[] }) {
  const { data: topFilms = [] } = useGetMoviesQuery({ sort: "top", rated: true, limit: 5 });

  const directors = useMemo(() => {
    const map = new Map<string, { name: string; feeds: number; likes: number }>();
    for (const p of feeds) {
      const d = map.get(p.directorId) ?? { name: p.directorName, feeds: 0, likes: 0 };
      d.feeds += 1;
      d.likes += p.likes.length;
      map.set(p.directorId, d);
    }
    return [...map.values()].sort((a, b) => b.likes - a.likes).slice(0, 5);
  }, [feeds]);

  const mostDiscussed = useMemo(() => [...feeds].sort((a, b) => b.thoughts.length - a.thoughts.length)[0], [feeds]);

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <h3 className="font-bold mb-3">Top rated films</h3>
        {topFilms.length === 0 ? (
          <p className="text-sm text-muted">No ratings yet.</p>
        ) : (
          <ol className="space-y-3">
            {topFilms.map((f, i) => (
              <li key={f.id}>
                <Link href={`/movies/${f.id}`} className="flex items-center gap-3 group">
                  <span
                    className={`w-7 h-7 rounded-lg grid place-items-center text-xs font-bold shrink-0 ${
                      i === 0 ? "brand-gradient text-white" : "bg-surface-2 text-muted"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <MovieImage movie={f} className="w-9 shrink-0 !rounded-md !shadow-none" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold truncate group-hover:text-primary">{f.title}</span>
                    <span className="block text-xs text-muted truncate">{f.directorName}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-bold">{formatStars(f.average)}</span>
                    <StarsDisplay value={f.average} size={12} />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      {directors.length > 0 && (
        <section className="card p-4">
          <h3 className="font-bold mb-3">Directors on Dharshak Manch</h3>
          <ul className="space-y-3">
            {directors.map((d) => (
              <li key={d.name} className="flex items-center gap-3">
                <Avatar name={d.name} size={36} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{d.name}</div>
                  <div className="text-xs text-muted">
                    {d.feeds} feeds · {d.likes} likes
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {mostDiscussed && mostDiscussed.thoughts.length > 0 && (
        <section className="card p-4">
          <h3 className="font-bold mb-2">Most discussed</h3>
          <Link href={`/feeds/${mostDiscussed.id}`} className="block group">
            {mostDiscussed.images[0] && (
              // eslint-disable-next-line @next/next/no-img-element -- user uploads and external URLs
              <img src={imageUrl(mostDiscussed.images[0])} alt="" className="rounded-xl aspect-video object-cover w-full mb-2" />
            )}
            <div className="text-sm font-semibold group-hover:text-primary">
              {mostDiscussed.filmTitle ?? mostDiscussed.directorName}
            </div>
            <div className="text-xs text-muted">{mostDiscussed.thoughts.length} thought{mostDiscussed.thoughts.length === 1 ? "" : "s"}</div>
          </Link>
        </section>
      )}

      <p className="text-xs text-muted px-2">© 2026 Cinema Dharshak Manch</p>
    </div>
  );
}
