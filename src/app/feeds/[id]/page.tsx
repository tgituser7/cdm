import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import FeedView from "@/components/FeedView";
import { API_URL, imageUrl } from "@/lib/api";
import type { Feed } from "@/lib/types";

const SITE = "Cinema Dharshak Manch";

function clip(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Link preview (title, description, image) for shared feed links on WhatsApp, Facebook, X, etc. */
export async function generateMetadata({ params }: PageProps<"/feeds/[id]">): Promise<Metadata> {
  const { id } = await params;
  let feed: Feed | null = null;
  try {
    const res = await fetch(`${API_URL}/api/feeds/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (res.ok) feed = (await res.json()).feed;
  } catch {
    // API unreachable: fall back to the site defaults
  }
  if (!feed) return { title: `Feed not found · ${SITE}` };

  const movie = feed.type === "rating" ? feed.movie : undefined;
  const title = movie
    ? `Rate ${movie.title} · ${feed.directorName}`
    : `${feed.directorName}${feed.filmTitle ? ` · ${feed.filmTitle}` : ""}`;
  const description = clip(
    movie
      ? feed.text || movie.tagline || movie.synopsis || `${feed.directorName} wants your rating on ${SITE}.`
      : feed.text || `A feed from ${feed.directorName} on ${SITE}.`,
    200,
  );
  const image = movie?.movieImage ?? feed.images[0];
  const images = image ? [{ url: imageUrl(image), alt: movie?.title ?? feed.filmTitle ?? feed.directorName }] : undefined;

  return {
    title: `${title} · ${SITE}`,
    description,
    openGraph: { type: "article", siteName: SITE, title, description, images, url: `/feeds/${feed.id}` },
    twitter: { card: images ? "summary_large_image" : "summary", title, description, images: images?.map((i) => i.url) },
  };
}

/**
 * Renders nothing; tells Next.js this page is intentionally rendered per request,
 * because generateMetadata fetches the live feed for its link preview.
 */
async function RequestTimeMarker() {
  await connection();
  return null;
}

export default function FeedDetailPage() {
  return (
    <>
      <Suspense>
        <FeedView />
      </Suspense>
      <Suspense>
        <RequestTimeMarker />
      </Suspense>
    </>
  );
}
