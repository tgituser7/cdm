"use client";

import Link from "next/link";
import { imageUrl } from "@/lib/api";
import type { Feed } from "@/lib/types";
import { useGetFeedsQuery } from "@/store/feedApi";
import { useSession } from "@/store/hooks";
import Avatar from "../Avatar";
import { ClapperIcon, HeartIcon, ThoughtIcon } from "../Icons";
import { StarsDisplay, formatStars } from "../Stars";
import TimeAgo from "../TimeAgo";

/** Home page preview of the newest feeds (near the viewer first), linking to the full Feed page. */
export default function LatestFeeds() {
  const { ready } = useSession();
  return (
    <section className="relative border-t border-line bg-bg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">From the directors</h2>
            <p className="text-muted mt-1">The latest updates, behind-the-scenes moments and rating calls, near you first.</p>
          </div>
          <Link href="/feed" className="btn btn-primary">
            Open the feed →
          </Link>
        </div>
        {ready ? <Cards /> : <CardsSkeleton />}
      </div>
    </section>
  );
}

function Cards() {
  const { data, isLoading } = useGetFeedsQuery({ sort: "latest", filter: "all" });
  if (isLoading) return <CardsSkeleton />;
  const feeds = (data?.feeds ?? []).slice(0, 6);
  if (feeds.length === 0) {
    return <div className="card p-10 text-center text-muted">No feeds yet. Directors&apos; updates will appear here.</div>;
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {feeds.map((f) => (
        <PreviewCard key={f.id} feed={f} />
      ))}
    </div>
  );
}

function PreviewCard({ feed }: { feed: Feed }) {
  const movie = feed.type === "rating" ? feed.movie : undefined;
  const img = movie ? (movie.bannerImage ?? movie.movieImage) : feed.images[0];

  return (
    <Link href={`/feeds/${feed.id}`} className="card overflow-hidden group flex flex-col hover:-translate-y-1 hover:shadow-xl transition duration-300">
      <div className="relative aspect-[16/9] bg-surface-2 overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element -- user uploads and external URLs
          <img
            src={imageUrl(img)}
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
              e.currentTarget.parentElement?.classList.add("brand-gradient");
            }}
          />
        ) : (
          <div className="h-full w-full brand-gradient opacity-90 grid place-items-center p-6">
            <p className="text-white/95 font-semibold text-center line-clamp-4">“{feed.text}”</p>
          </div>
        )}
        {movie && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full brand-gradient px-2.5 py-1 text-[11px] font-bold text-white shadow">
            <ClapperIcon size={12} /> Rate &amp; Review
          </span>
        )}
        {feed.proximity === "city" && (
          <span className="absolute top-3 right-3 rounded-full bg-black/55 backdrop-blur px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Near you
          </span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2.5">
          <Avatar name={feed.directorName} size={32} />
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">{feed.directorName}</div>
            <div className="text-xs text-muted truncate">
              <TimeAgo iso={feed.createdAt} />
              {feed.filmTitle && ` · ${feed.filmTitle}`}
            </div>
          </div>
        </div>
        {movie ? (
          <div className="mt-3">
            <div className="font-extrabold leading-tight">{movie.title}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              {movie.ratingCount > 0 ? (
                <>
                  <StarsDisplay value={movie.average} size={13} />
                  <b>{formatStars(movie.average)}</b>
                  <span className="text-muted">
                    ({movie.ratingCount}) · {movie.reviewCount} reviews
                  </span>
                </>
              ) : (
                <span className="text-muted">Be the first to rate</span>
              )}
            </div>
          </div>
        ) : (
          img && feed.text && <p className="mt-3 text-sm text-text/85 line-clamp-2">{feed.text}</p>
        )}
        {!movie && (
          <div className="mt-auto pt-3 flex items-center gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <HeartIcon size={14} /> {feed.likes.length}
            </span>
            <span className="inline-flex items-center gap-1">
              <ThoughtIcon size={14} /> {feed.thoughts.length}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card overflow-hidden animate-pulse">
          <div className="aspect-[16/9] bg-surface-2" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-1/2 rounded bg-surface-2" />
            <div className="h-3 w-3/4 rounded bg-surface-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
