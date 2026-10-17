"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useGetFeedQuery } from "@/store/feedApi";
import { useSession } from "@/store/hooks";
import FeedCard from "./FeedCard";

export default function FeedView() {
  const { id } = useParams<{ id: string }>();
  const { ready } = useSession();
  return (
    <div className="mx-auto max-w-[680px] px-3 sm:px-4 py-6">
      <Link
        href="/"
        className="text-sm font-semibold text-muted hover:text-primary"
      >
        ← Back to Feed
      </Link>
      <div className="mt-4">
        {ready ? (
          <FeedById id={id} />
        ) : (
          <div className="card h-96 animate-pulse" />
        )}
      </div>
    </div>
  );
}

function FeedById({ id }: { id: string }) {
  const { data: feed, isLoading, isError } = useGetFeedQuery(id);

  return (
    <>
      {feed ? (
        <FeedCard feed={feed} expanded />
      ) : isError ? (
        <div className="card p-10 text-center">
          <div className="text-xl font-bold">Feed not found</div>
          <p className="text-muted mt-1 text-sm">
            It may have been deleted by the director.
          </p>
          <Link href="/" className="btn btn-primary mt-6">
            Go to Feed
          </Link>
        </div>
      ) : (
        isLoading && <div className="card h-96 animate-pulse" />
      )}
    </>
  );
}
