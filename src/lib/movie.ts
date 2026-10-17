import type { Movie } from "./types";

export function movieYear(m: Pick<Movie, "releaseDate">) {
  return m.releaseDate ? new Date(m.releaseDate).getFullYear() : null;
}

export function formatRuntime(min?: number) {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m ? `${m}m` : ""}`.trim() : `${m}m`;
}

/** "2027 · 2h 12m · UA 13+" */
export function movieMeta(m: Movie) {
  return [movieYear(m), formatRuntime(m.runtimeMinutes), m.certification].filter(Boolean).join(" · ");
}

export function youtubeEmbed(url?: string) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export const STATUS_STYLES: Record<Movie["status"], string> = {
  Announced: "bg-sky-50 text-sky-700",
  "Releasing soon": "bg-pink-50 text-pink-700",
  Released: "bg-emerald-50 text-emerald-700",
};
