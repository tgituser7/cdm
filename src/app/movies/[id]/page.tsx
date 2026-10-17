import { Suspense } from "react";
import MovieView from "@/components/MovieView";

export default function MoviePage() {
  return (
    <Suspense>
      <MovieView />
    </Suspense>
  );
}
