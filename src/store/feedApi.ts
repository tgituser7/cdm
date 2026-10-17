import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "@/lib/api";
import type { FeedFilter, FeedSort, Location, Movie, Feed } from "@/lib/types";

export interface FeedArgs {
  sort: FeedSort;
  filter: FeedFilter;
}

export interface MoviesArgs {
  /** A director id, or "me" for the signed-in director */
  director?: string;
  sort?: "latest" | "top";
  /** Only movies that have ratings */
  rated?: boolean;
  limit?: number;
}

interface FeedResponse {
  feeds: Feed[];
  viewerLocation: Location | null;
}

type MovieResponse = { movie: Movie };
type Api = {
  dispatch: (action: unknown) => unknown;
  getState: () => unknown;
};

export const feedApi = createApi({
  reducerPath: "feedApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${API_URL}/api`, credentials: "include" }),
  tagTypes: ["Feeds", "Feed", "Movie"],
  endpoints: (build) => ({
    // ---------- Feeds ----------
    getFeeds: build.query<FeedResponse, FeedArgs>({
      query: ({ sort, filter }) => ({ url: "/feeds", params: { sort, filter } }),
      providesTags: ["Feeds"],
    }),
    getFeed: build.query<Feed, string>({
      query: (id) => `/feeds/${id}`,
      transformResponse: (res: { feed: Feed }) => res.feed,
      providesTags: (_r, _e, id) => [{ type: "Feed", id }],
    }),
    createFeed: build.mutation<Feed, FormData>({
      query: (body) => ({ url: "/feeds", method: "POST", body }),
      transformResponse: (res: { feed: Feed }) => res.feed,
      invalidatesTags: ["Feeds"],
    }),
    updateFeed: build.mutation<Feed, { id: string; body: FormData }>({
      query: ({ id, body }) => ({ url: `/feeds/${id}`, method: "PATCH", body }),
      transformResponse: (res: { feed: Feed }) => res.feed,
      onQueryStarted: async (_arg, api) => {
        const { data } = await api.queryFulfilled.catch(() => ({ data: null }));
        if (data) replaceFeed(api, data);
      },
    }),
    deleteFeed: build.mutation<void, string>({
      query: (id) => ({ url: `/feeds/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => ["Feeds", "Movie", { type: "Feed", id }],
    }),
    toggleLike: build.mutation<Feed, string>({
      query: (id) => ({ url: `/feeds/${id}/like`, method: "POST" }),
      transformResponse: (res: { feed: Feed }) => res.feed,
      onQueryStarted: async (_arg, api) => {
        const { data } = await api.queryFulfilled.catch(() => ({ data: null }));
        if (data) replaceFeed(api, data);
      },
    }),
    addComment: build.mutation<Feed, { id: string; text: string }>({
      query: ({ id, text }) => ({ url: `/feeds/${id}/comments`, method: "POST", body: { text } }),
      transformResponse: (res: { feed: Feed }) => res.feed,
      onQueryStarted: async (_arg, api) => {
        const { data } = await api.queryFulfilled.catch(() => ({ data: null }));
        if (data) replaceFeed(api, data);
      },
    }),

    // ---------- Movies ----------
    getMovies: build.query<Movie[], MoviesArgs>({
      query: ({ director, sort, rated, limit }) => ({
        url: "/movies",
        params: { director, sort, rated: rated ? 1 : undefined, limit },
      }),
      transformResponse: (res: { movies: Movie[] }) => res.movies,
      providesTags: ["Movie"],
    }),
    getMovie: build.query<Movie, string>({
      query: (id) => `/movies/${id}`,
      transformResponse: (res: MovieResponse) => res.movie,
      providesTags: (_r, _e, id) => [{ type: "Movie", id }],
    }),
    createMovie: build.mutation<Movie, FormData>({
      query: (body) => ({ url: "/movies", method: "POST", body }),
      transformResponse: (res: MovieResponse) => res.movie,
      invalidatesTags: ["Movie"],
    }),
    updateMovie: build.mutation<Movie, { id: string; body: FormData }>({
      query: ({ id, body }) => ({ url: `/movies/${id}`, method: "PATCH", body }),
      transformResponse: (res: MovieResponse) => res.movie,
      invalidatesTags: ["Movie", "Feeds"],
    }),
    deleteMovie: build.mutation<void, string>({
      query: (id) => ({ url: `/movies/${id}`, method: "DELETE" }),
      invalidatesTags: ["Movie", "Feeds"],
    }),
    askForRating: build.mutation<{ movie: Movie; feedId: string }, { id: string; message: string }>({
      query: ({ id, message }) => ({ url: `/movies/${id}/ask-rating`, method: "POST", body: { message } }),
      invalidatesTags: ["Movie", "Feeds"],
    }),
    rateMovie: build.mutation<Movie, { id: string; value: number }>({
      query: ({ id, value }) => ({ url: `/movies/${id}/rating`, method: "PUT", body: { value } }),
      transformResponse: (res: MovieResponse) => res.movie,
      onQueryStarted: async (_arg, api) => {
        const { data } = await api.queryFulfilled.catch(() => ({ data: null }));
        if (data) replaceMovie(api, data);
      },
    }),
    reviewMovie: build.mutation<Movie, { id: string; text: string; rating?: number }>({
      query: ({ id, text, rating }) => ({ url: `/movies/${id}/review`, method: "PUT", body: { text, rating } }),
      transformResponse: (res: MovieResponse) => res.movie,
      onQueryStarted: async (_arg, api) => {
        const { data } = await api.queryFulfilled.catch(() => ({ data: null }));
        if (data) replaceMovie(api, data);
      },
    }),
    deleteReview: build.mutation<Movie, string>({
      query: (id) => ({ url: `/movies/${id}/review`, method: "DELETE" }),
      transformResponse: (res: MovieResponse) => res.movie,
      onQueryStarted: async (_arg, api) => {
        const { data } = await api.queryFulfilled.catch(() => ({ data: null }));
        if (data) replaceMovie(api, data);
      },
    }),
  }),
});

type State = Parameters<typeof feedApi.util.selectCachedArgsForQuery>[0];

/** Write an updated feed into every cached feed list and the single-feed cache. */
function replaceFeed(api: Api, updated: Feed) {
  const state = api.getState() as State;
  for (const args of feedApi.util.selectCachedArgsForQuery(state, "getFeeds")) {
    api.dispatch(
      feedApi.util.updateQueryData("getFeeds", args, (draft) => {
        const i = draft.feeds.findIndex((p) => p.id === updated.id);
        if (i !== -1) draft.feeds[i] = updated;
      }),
    );
  }
  api.dispatch(feedApi.util.upsertQueryData("getFeed", updated.id, updated));
}

/** Write an updated movie (after a rating or review) into feeds, movie lists and the movie page cache. */
function replaceMovie(api: Api, movie: Movie) {
  const state = api.getState() as State;
  for (const args of feedApi.util.selectCachedArgsForQuery(state, "getFeeds")) {
    api.dispatch(
      feedApi.util.updateQueryData("getFeeds", args, (draft) => {
        for (const p of draft.feeds) if (p.movie?.id === movie.id) p.movie = movie;
      }),
    );
  }
  for (const id of feedApi.util.selectCachedArgsForQuery(state, "getFeed")) {
    api.dispatch(
      feedApi.util.updateQueryData("getFeed", id, (draft) => {
        if (draft.movie?.id === movie.id) draft.movie = movie;
      }),
    );
  }
  for (const args of feedApi.util.selectCachedArgsForQuery(state, "getMovies")) {
    api.dispatch(
      feedApi.util.updateQueryData("getMovies", args, (draft) => {
        const i = draft.findIndex((m) => m.id === movie.id);
        if (i !== -1) draft[i] = movie;
      }),
    );
  }
  api.dispatch(feedApi.util.upsertQueryData("getMovie", movie.id, movie));
}

export const {
  useGetFeedsQuery,
  useGetFeedQuery,
  useCreateFeedMutation,
  useUpdateFeedMutation,
  useDeleteFeedMutation,
  useToggleLikeMutation,
  useAddCommentMutation,
  useGetMoviesQuery,
  useGetMovieQuery,
  useCreateMovieMutation,
  useUpdateMovieMutation,
  useDeleteMovieMutation,
  useAskForRatingMutation,
  useRateMovieMutation,
  useReviewMovieMutation,
  useDeleteReviewMutation,
} = feedApi;
