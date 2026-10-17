"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { type MovieSort, type MoviesArgs, useGetMovieFiltersQuery, useGetMoviesQuery } from "@/store/feedApi";
import { useSession } from "@/store/hooks";
import { CloseIcon } from "./Icons";
import MovieCard from "./MovieCard";

const SORTS: { value: MovieSort; label: string }[] = [
  { value: "latest", label: "Recently added" },
  { value: "top", label: "Top rated" },
  { value: "reviews", label: "Most reviewed" },
  { value: "release", label: "Release date" },
  { value: "title", label: "Title A–Z" },
];

type Filters = { q: string; genre: string; language: string; status: string; director: string; open: boolean; sort: MovieSort };

const DEFAULTS: Filters = { q: "", genre: "", language: "", status: "", director: "", open: false, sort: "latest" };

function readFilters(params: URLSearchParams): Filters {
  const sort = params.get("sort") as MovieSort | null;
  return {
    q: params.get("q") ?? "",
    genre: params.get("genre") ?? "",
    language: params.get("language") ?? "",
    status: params.get("status") ?? "",
    director: params.get("director") ?? "",
    open: params.get("open") === "1",
    sort: sort && SORTS.some((s) => s.value === sort) ? sort : "latest",
  };
}

/** All directors' movies with filters. Filters live in the URL so a filtered list can be shared. */
export default function MoviesBrowser() {
  const { ready } = useSession();
  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 py-6">
      <div className="mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Movies</h1>
        <p className="text-muted mt-1">Every film on Cinema Dharshak Manch, from all directors.</p>
      </div>
      {ready ? <Browser /> : <GridSkeleton />}
    </div>
  );
}

function Browser() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);
  const [search, setSearch] = useState(filters.q);

  const { data: options } = useGetMovieFiltersQuery();
  const args: MoviesArgs = {
    q: filters.q,
    genre: filters.genre,
    language: filters.language,
    status: filters.status,
    director: filters.director,
    open: filters.open,
    sort: filters.sort,
  };
  const { data: movies = [], isLoading, isFetching, isError, refetch } = useGetMoviesQuery(args);

  const update = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    const qs = new URLSearchParams();
    if (next.q) qs.set("q", next.q);
    if (next.genre) qs.set("genre", next.genre);
    if (next.language) qs.set("language", next.language);
    if (next.status) qs.set("status", next.status);
    if (next.director) qs.set("director", next.director);
    if (next.open) qs.set("open", "1");
    if (next.sort !== "latest") qs.set("sort", next.sort);
    const s = qs.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  // Debounce typing into the URL (and the request).
  useEffect(() => {
    if (search.trim() === filters.q) return;
    const t = setTimeout(() => update({ q: search.trim() }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to typing
  }, [search]);

  const active: { key: keyof Filters; label: string }[] = [];
  if (filters.q) active.push({ key: "q", label: `“${filters.q}”` });
  if (filters.genre) active.push({ key: "genre", label: filters.genre });
  if (filters.language) active.push({ key: "language", label: filters.language });
  if (filters.status) active.push({ key: "status", label: filters.status });
  if (filters.director) {
    active.push({ key: "director", label: options?.directors.find((d) => d.id === filters.director)?.name ?? "Director" });
  }

  const clearOne = (key: keyof Filters) => {
    if (key === "q") setSearch("");
    update({ [key]: DEFAULTS[key] } as Partial<Filters>);
  };

  return (
    <>
      {/* Filters */}
      <div className="card p-3 sm:p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <svg viewBox="0 0 24 24" width="18" height="18" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by movie or director…"
              className="input !pl-10"
              aria-label="Search movies"
            />
          </div>
          <label className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-muted">Sort</span>
            <select
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value as MovieSort })}
              aria-label="Sort movies"
              className="input !w-auto !py-2 cursor-pointer text-sm font-semibold"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <FilterSelect label="Genre" value={filters.genre} onChange={(genre) => update({ genre })} options={(options?.genres ?? []).map((g) => [g, g])} />
          <FilterSelect label="Language" value={filters.language} onChange={(language) => update({ language })} options={(options?.languages ?? []).map((l) => [l, l])} />
          <FilterSelect label="Status" value={filters.status} onChange={(status) => update({ status })} options={(options?.statuses ?? []).map((s) => [s, s])} />
          <FilterSelect
            label="Director"
            value={filters.director}
            onChange={(director) => update({ director })}
            options={(options?.directors ?? []).map((d) => [d.id, `${d.name} (${d.movies})`])}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => update({ open: !filters.open })}
            aria-pressed={filters.open}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold border transition cursor-pointer ${
              filters.open ? "bg-orange-50 border-star text-star" : "border-line text-muted hover:text-text hover:border-muted"
            }`}
          >
            🎬 Open for rating
          </button>
          {active.map((f) => (
            <button
              key={f.key}
              onClick={() => clearOne(f.key)}
              className="inline-flex items-center gap-1 rounded-full bg-primary-soft text-primary px-3 py-1.5 text-sm font-semibold cursor-pointer hover:bg-[#e2d8fc]"
              aria-label={`Remove filter ${f.label}`}
            >
              {f.label} <CloseIcon size={14} />
            </button>
          ))}
          {(active.length > 0 || filters.open) && (
            <button
              onClick={() => {
                setSearch("");
                router.replace(pathname, { scroll: false });
              }}
              className="text-sm font-semibold text-muted hover:text-like cursor-pointer ml-1"
            >
              Clear all
            </button>
          )}
          <span className="ml-auto text-sm text-muted">
            {isLoading ? "Loading…" : `${movies.length} movie${movies.length === 1 ? "" : "s"}`}
          </span>
        </div>
      </div>

      {/* Results */}
      <div className="mt-6">
        {isLoading ? (
          <GridSkeleton />
        ) : isError ? (
          <div className="card p-10 text-center">
            <div className="font-bold">Couldn&apos;t load movies</div>
            <p className="text-sm text-muted mt-1">The server may be waking up. Please try again in a few seconds.</p>
            <button onClick={() => refetch()} className="btn btn-soft mt-4">
              Try again
            </button>
          </div>
        ) : movies.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl">🎬</div>
            <div className="font-bold mt-3">No movies found</div>
            <p className="text-sm text-muted mt-1">
              {active.length || filters.open ? "Try removing a filter or searching for something else." : "Directors haven't added any movies yet."}
            </p>
          </div>
        ) : (
          <div
            className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-7 transition-opacity ${
              isFetching ? "opacity-60" : ""
            }`}
          >
            {movies.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [value: string, label: string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className={`input !py-2 text-sm cursor-pointer ${value ? "!border-primary !bg-primary-soft text-primary font-semibold" : ""}`}
    >
      <option value="">All {label === "Status" ? "statuses" : `${label.toLowerCase()}s`}</option>
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-7">
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[2/3] rounded-xl bg-surface-2" />
          <div className="h-3 w-3/4 rounded bg-surface-2 mt-3" />
          <div className="h-3 w-1/2 rounded bg-surface-2 mt-2" />
        </div>
      ))}
    </div>
  );
}
