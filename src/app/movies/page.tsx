import type { Metadata } from "next";
import { Suspense } from "react";
import MoviesBrowser from "@/components/MoviesBrowser";

export const metadata: Metadata = {
  title: "Movies · Cinema Dharshak Manch",
  description: "Browse every film on Cinema Dharshak Manch. Filter by genre, language, status and director.",
};

export default function MoviesPage() {
  return (
    <Suspense>
      <MoviesBrowser />
    </Suspense>
  );
}
