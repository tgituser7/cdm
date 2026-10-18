"use client";

import LatestFeeds from "@/components/home/LatestFeeds";
import Showcase from "@/components/home/Showcase";

/** Home: cinematic featured-movies banner, movie rows, and a preview of the latest feeds. */
export default function HomePage() {
  return (
    <>
      <Showcase />
      <LatestFeeds />
    </>
  );
}
