export type Role = "audience" | "director";

export interface Location {
  city?: string;
  state?: string;
  country?: string;
  lat?: number;
  lng?: number;
  source?: "gps" | "manual";
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  mobile?: string;
  bio?: string;
  location?: Location;
  createdAt: string;
}

export interface Thought {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export const CERTIFICATIONS = ["U", "UA 7+", "UA 13+", "UA 16+", "A", "S"] as const;
export const MOVIE_STATUSES = ["Announced", "Releasing soon", "Released"] as const;
/** Suggestions for the free-form team role field; directors can type any role. */
export const TEAM_ROLE_SUGGESTIONS = [
  "Music Director",
  "Cinematographer",
  "Editor",
  "Writer",
  "Producer",
  "Lyricist",
  "Choreographer",
  "Art Director",
  "Costume Designer",
  "Sound Designer",
  "Action Director",
  "VFX Supervisor",
  "Casting Director",
  "Executive Producer",
] as const;

export interface Review {
  id: string;
  userId: string;
  userName: string;
  text: string;
  /** The reviewer's current rating of the movie (1-10), if any */
  rating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Movie {
  id: string;
  directorId: string;
  directorName: string;
  title: string;
  tagline?: string;
  synopsis?: string;
  genres: string[];
  languages: string[];
  releaseDate?: string;
  runtimeMinutes?: number;
  certification?: (typeof CERTIFICATIONS)[number];
  status: (typeof MOVIE_STATUSES)[number];
  cast: { name: string; role?: string }[];
  /** Team members with the role the director gave them, e.g. Music Director */
  team: { role: string; name: string }[];
  movieImage?: string;
  /** Optional wide (16:9) banner for the home hero and movie page */
  bannerImage?: string;
  trailerUrl?: string;
  ratingRequestedAt?: string;
  /** How many times the director has asked for ratings */
  ratingRequestCount: number;
  /** When the director may ask again (once every 24 hours) */
  nextRatingRequestAt?: string;
  createdAt: string;
  /** True while the director's rating feed is live: audiences can rate and review */
  ratingOpen: boolean;
  ratingFeedId: string | null;
  /** Average rating (1-10) */
  average: number | null;
  ratingCount: number;
  /** Count of ratings for each value 1..10 */
  histogram: number[];
  myRating: number | null;
  myReviewId: string | null;
  reviewCount: number;
  reviews: Review[];
}

/**
 * A director's feed.
 * - "update": text + optional images; audiences like and share thoughts.
 * - "rating": shared via "Ask For Rating"; audiences rate and review `movie`.
 */
export interface Feed {
  id: string;
  type: "update" | "rating";
  directorId: string;
  directorName: string;
  filmTitle?: string;
  /** The movie the film tag refers to (when it matches one of the director's movies) */
  movieId?: string;
  text: string;
  /** "/res/…" paths on the API server, or absolute URLs */
  images: string[];
  movie?: Movie;
  location?: Pick<Location, "city" | "state" | "country">;
  createdAt: string;
  /** Set when the director edited the feed */
  editedAt?: string;
  /** userIds who liked */
  likes: string[];
  thoughts: Thought[];
  /** How close the feed is to the signed-in viewer */
  proximity: "city" | "state" | "country" | null;
  distanceKm: number | null;
}

export type FeedSort = "latest" | "top" | "liked";
export type FeedFilter = "all" | "rating" | "films" | "other";
