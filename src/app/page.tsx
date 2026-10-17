"use client";

import Link from "next/link";
import { useState } from "react";
import Composer from "@/components/Composer";
import FeedCard from "@/components/FeedCard";
import { LeftSidebar, RightSidebar } from "@/components/Sidebars";
import { formatLocation } from "@/lib/geo";
import type { FeedFilter, FeedSort } from "@/lib/types";
import { useGetFeedsQuery } from "@/store/feedApi";
import { useAppDispatch, useSession } from "@/store/hooks";
import { openLocationPrompt } from "@/store/sessionSlice";

const SORTS: { value: FeedSort; label: string }[] = [
  { value: "latest", label: "Latest" },
  { value: "top", label: "Top rated" },
  { value: "liked", label: "Most liked" },
];

const FILTERS: { value: FeedFilter; label: string }[] = [
  { value: "all", label: "All feeds" },
  { value: "rating", label: "🎬 Rate & Review" },
  { value: "films", label: "🎬 Film updates" },
  { value: "other", label: "💬 Other" },
];

export default function FeedPage() {
  const { ready } = useSession();
  // Data hooks run only on the client once the session is known, so the feed is ranked for the viewer.
  if (!ready) {
    return (
      <div className="mx-auto max-w-[640px] px-3 sm:px-4 py-6 space-y-4">
        <FeedSkeleton />
      </div>
    );
  }
  return <FeedList />;
}

function FeedList() {
  const { user, ready } = useSession();
  const dispatch = useAppDispatch();
  const [sort, setSort] = useState<FeedSort>("latest");
  const [filter, setFilter] = useState<FeedFilter>("all");

  const { data, isLoading, isFetching, isError, refetch } = useGetFeedsQuery({ sort, filter });
  const { data: all } = useGetFeedsQuery({ sort: "latest", filter: "all" });
  const feeds = data?.feeds ?? [];
  const sidebarPosts = all?.feeds ?? feeds;
  const place = formatLocation(user?.location);

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 py-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
      <aside className="hidden lg:block">
        <div className="sticky top-22">
          <LeftSidebar feeds={sidebarPosts} />
        </div>
      </aside>

      <div className="max-w-[640px] w-full mx-auto space-y-4">
        <Composer />

        {ready && (
          <div className="flex items-center gap-2 text-sm px-1">
            {user && place ? (
              <>
                <span className="text-muted">
                  📍 Showing feeds near <b className="text-text">{place}</b> first
                </span>
                <button onClick={() => dispatch(openLocationPrompt())} className="font-semibold text-primary hover:underline cursor-pointer">
                  Change
                </button>
              </>
            ) : user ? (
              <div className="w-full card px-4 py-3 flex items-center gap-3">
                <span className="text-xl">📍</span>
                <span className="flex-1 text-muted">Add your location to see feeds from near you first.</span>
                <button onClick={() => dispatch(openLocationPrompt())} className="btn btn-soft !py-1.5">
                  Add location
                </button>
              </div>
            ) : (
              <span className="text-muted">
                <Link href="/login" className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>{" "}
                to see feeds near you first.
              </span>
            )}
          </div>
        )}

        <div className="card p-1.5 flex flex-col sm:flex-row gap-1.5">
          <div className="flex gap-1 flex-1 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex-1 rounded-xl px-2 py-2 text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                  filter === f.value ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as FeedSort)}
            className="rounded-xl bg-surface-2 px-3 py-2 text-sm font-semibold outline-none cursor-pointer"
            aria-label="Sort feeds"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading && <FeedSkeleton />}

        {isError && (
          <div className="card p-8 text-center">
            <div className="font-bold">Couldn&apos;t load the feed</div>
            <p className="text-sm text-muted mt-1">Make sure the backend server is running on port 5000.</p>
            <button onClick={() => refetch()} className="btn btn-soft mt-4">
              Try again
            </button>
          </div>
        )}

        {data && feeds.length === 0 && <div className="card p-10 text-center text-muted">No feeds here yet.</div>}

        <div className={`space-y-4 transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`}>
          {feeds.map((feed, i) => {
            const prev = feeds[i - 1];
            const showDivider = !!user?.location?.city && i > 0 && prev?.proximity && !feed.proximity;
            return (
              <div key={feed.id} className="space-y-4">
                {showDivider && (
                  <div className="flex items-center gap-3 text-xs font-semibold text-muted uppercase tracking-wider py-1">
                    <span className="h-px flex-1 bg-line" /> More from other places <span className="h-px flex-1 bg-line" />
                  </div>
                )}
                <FeedCard feed={feed} />
              </div>
            );
          })}
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-22">
          <RightSidebar feeds={sidebarPosts} />
        </div>
      </aside>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <>
      {[0, 1].map((i) => (
        <div key={i} className="card p-5 space-y-4 animate-pulse">
          <div className="flex gap-3">
            <div className="w-11 h-11 rounded-full bg-surface-2" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 w-40 rounded bg-surface-2" />
              <div className="h-3 w-24 rounded bg-surface-2" />
            </div>
          </div>
          <div className="h-3 w-full rounded bg-surface-2" />
          <div className="h-3 w-4/5 rounded bg-surface-2" />
          <div className="h-56 rounded-xl bg-surface-2" />
        </div>
      ))}
    </>
  );
}
