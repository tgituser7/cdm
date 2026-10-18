"use client";

import { FeedList, FeedSkeleton } from "@/components/FeedList";
import { useSession } from "@/store/hooks";

export default function FeedPage() {
  const { ready } = useSession();
  return (
    <div className="pb-10">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 pt-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Feed</h1>
        <p className="text-muted mt-1">Updates, behind-the-scenes moments and rating calls from directors, near you first.</p>
      </div>
      {/* Data hooks run only on the client once the session is known, so the feed is ranked for the viewer. */}
      {ready ? (
        <FeedList />
      ) : (
        <div className="mx-auto max-w-[640px] px-3 sm:px-4 py-6 space-y-4">
          <FeedSkeleton />
        </div>
      )}
    </div>
  );
}
