"use client";

import { useEffect, useRef, useState } from "react";
import { imageUrl } from "@/lib/api";
import { compressImage } from "@/lib/image";
import { CERTIFICATIONS, MOVIE_STATUSES, type Movie, TEAM_ROLE_SUGGESTIONS } from "@/lib/types";
import { useCreateMovieMutation, useUpdateMovieMutation } from "@/store/feedApi";
import { CloseIcon, PhotoIcon } from "./Icons";

const GENRES = ["Drama", "Thriller", "Comedy", "Action", "Romance", "Horror", "Sci-Fi", "Adventure", "Crime", "Family", "Fantasy", "Mystery", "Biography", "Documentary", "Musical", "Animation"];
const LANGUAGES = ["Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Marathi", "Bengali", "Punjabi", "Gujarati", "Odia", "Urdu", "English"];

type Cast = { name: string; role: string };
type TeamMember = { role: string; name: string };

/** Add or edit a movie with all its details. */
export default function MovieFormDialog({ movie, onClose, onSaved }: { movie?: Movie; onClose: () => void; onSaved?: (m: Movie) => void }) {
  const [createMovie, { isLoading: creating }] = useCreateMovieMutation();
  const [updateMovie, { isLoading: updating }] = useUpdateMovieMutation();
  const saving = creating || updating;

  const [form, setForm] = useState({
    title: movie?.title ?? "",
    tagline: movie?.tagline ?? "",
    synopsis: movie?.synopsis ?? "",
    releaseDate: movie?.releaseDate?.slice(0, 10) ?? "",
    runtimeMinutes: movie?.runtimeMinutes ? String(movie.runtimeMinutes) : "",
    certification: movie?.certification ?? "",
    status: movie?.status ?? "Announced",
    trailerUrl: movie?.trailerUrl ?? "",
  });
  const [genres, setGenres] = useState<string[]>(movie?.genres ?? []);
  const [languages, setLanguages] = useState<string[]>(movie?.languages ?? []);
  const [cast, setCast] = useState<Cast[]>(
    movie?.cast.length ? movie.cast.map((c) => ({ name: c.name, role: c.role ?? "" })) : [{ name: "", role: "" }],
  );
  const [team, setTeam] = useState<TeamMember[]>(movie?.team.length ? movie.team : [{ role: "", name: "" }]);
  const [movieImage, setMovieImage] = useState<{ blob: Blob; preview: string } | null>(null);
  const [removeMovieImage, setRemoveMovieImage] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !saving && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, saving]);

  useEffect(() => () => {
    if (movieImage) URL.revokeObjectURL(movieImage.preview);
  }, [movieImage]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickMovieImage = async (file?: File) => {
    if (!file) return;
    try {
      const blob = await compressImage(file, 1200, 0.88);
      setMovieImage({ blob, preview: URL.createObjectURL(blob) });
      setRemoveMovieImage(false);
    } catch {
      setError("Couldn't read that image.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const currentMovieImage = movieImage?.preview ?? (!removeMovieImage && movie?.movieImage ? imageUrl(movie.movieImage) : null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Please enter the movie title.");
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, v));
    body.append("genres", JSON.stringify(genres));
    body.append("languages", JSON.stringify(languages));
    body.append("cast", JSON.stringify(cast.filter((c) => c.name.trim())));
    const filledTeam = team.filter((t) => t.role.trim() || t.name.trim());
    if (filledTeam.some((t) => !t.role.trim() || !t.name.trim())) return setError("Each team member needs both a role and a name.");
    body.append("team", JSON.stringify(filledTeam));
    if (movieImage) body.append("movieImage", movieImage.blob, "movie-image.jpg");
    if (removeMovieImage && !movieImage) body.append("removeMovieImage", "true");

    setError("");
    try {
      const saved = movie ? await updateMovie({ id: movie.id, body }).unwrap() : await createMovie(body).unwrap();
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError((err as { data?: { error?: string } })?.data?.error ?? "Couldn't save the movie. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-text/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <form
        onSubmit={save}
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-form-title"
        className="card w-full sm:max-w-3xl rounded-b-none sm:rounded-2xl max-h-[94vh] flex flex-col animate-[slideUp_.25s_ease-out]"
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-line">
          <h2 id="movie-form-title" className="text-lg font-extrabold">
            {movie ? `Edit ${movie.title}` : "Add a movie"}
          </h2>
          <button type="button" onClick={onClose} disabled={saving} className="w-8 h-8 rounded-full grid place-items-center text-muted hover:bg-surface-2 cursor-pointer" aria-label="Close">
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Movie image + basics */}
          <div className="grid sm:grid-cols-[180px_1fr] gap-5">
            <div>
              <div className="text-sm font-semibold mb-1.5">Movie image</div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative w-full aspect-[2/3] rounded-xl overflow-hidden border-2 border-dashed border-line hover:border-primary bg-surface-2 grid place-items-center text-muted cursor-pointer group"
              >
                {currentMovieImage ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local preview or uploaded movie image
                  <img src={currentMovieImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-1 text-xs font-semibold">
                    <PhotoIcon size={26} />
                    Upload movie image
                  </span>
                )}
                {currentMovieImage && (
                  <span className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-xs font-semibold py-1.5 opacity-0 group-hover:opacity-100 transition">
                    Change movie image
                  </span>
                )}
              </button>
              {currentMovieImage && (
                <button
                  type="button"
                  onClick={() => (setMovieImage(null), setRemoveMovieImage(true))}
                  className="text-xs text-like hover:underline mt-1.5 cursor-pointer"
                >
                  Remove movie image
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pickMovieImage(e.target.files?.[0])} />
            </div>

            <div className="space-y-4">
              <Field label="Title *">
                <input className="input text-lg font-semibold" value={form.title} onChange={set("title")} placeholder="Movie title" maxLength={120} autoFocus />
              </Field>
              <Field label="Tagline">
                <input className="input" value={form.tagline} onChange={set("tagline")} placeholder="One line that sells it" maxLength={160} />
              </Field>
              <Field label="Synopsis">
                <textarea className="input resize-none" rows={4} value={form.synopsis} onChange={set("synopsis")} placeholder="What is the movie about?" maxLength={4000} />
              </Field>
            </div>
          </div>

          {/* Facts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Status">
              <select className="input cursor-pointer" value={form.status} onChange={set("status")}>
                {MOVIE_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Release date">
              <input type="date" className="input" value={form.releaseDate} onChange={set("releaseDate")} />
            </Field>
            <Field label="Runtime (min)">
              <input type="number" min={1} max={600} className="input" value={form.runtimeMinutes} onChange={set("runtimeMinutes")} placeholder="e.g. 128" />
            </Field>
            <Field label="Certification">
              <select className="input cursor-pointer" value={form.certification} onChange={set("certification")}>
                <option value="">Not certified</option>
                {CERTIFICATIONS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>

          <ChipPicker label="Genres" options={GENRES} value={genres} onChange={setGenres} max={6} />
          <ChipPicker label="Languages" options={LANGUAGES} value={languages} onChange={setLanguages} max={6} allowCustom />

          {/* Cast */}
          <div>
            <div className="text-sm font-semibold mb-2">Cast</div>
            <div className="space-y-2">
              {cast.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="input flex-1"
                    value={c.name}
                    onChange={(e) => setCast((cs) => cs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                    placeholder="Actor name"
                    maxLength={80}
                  />
                  <input
                    className="input flex-1"
                    value={c.role}
                    onChange={(e) => setCast((cs) => cs.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))}
                    placeholder="Character (optional)"
                    maxLength={80}
                  />
                  <button
                    type="button"
                    onClick={() => setCast((cs) => (cs.length === 1 ? [{ name: "", role: "" }] : cs.filter((_, j) => j !== i)))}
                    className="w-10 shrink-0 rounded-xl text-muted hover:bg-surface-2 hover:text-like grid place-items-center cursor-pointer"
                    aria-label="Remove cast member"
                  >
                    <CloseIcon size={16} />
                  </button>
                </div>
              ))}
            </div>
            {cast.length < 30 && (
              <button type="button" onClick={() => setCast((cs) => [...cs, { name: "", role: "" }])} className="btn btn-ghost !px-2 mt-1 text-primary">
                + Add cast member
              </button>
            )}
          </div>

          {/* Team */}
          <div>
            <div className="text-sm font-semibold">Team</div>
            <p className="text-xs text-muted mb-2">Add anyone who worked on the film. Type their role, e.g. Music Director, and their name.</p>
            <datalist id="team-roles">
              {TEAM_ROLE_SUGGESTIONS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
            <div className="space-y-2">
              {team.map((t, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="input flex-1"
                    value={t.role}
                    onChange={(e) => setTeam((ts) => ts.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))}
                    placeholder="Role, e.g. Music Director"
                    list="team-roles"
                    maxLength={60}
                  />
                  <input
                    className="input flex-1"
                    value={t.name}
                    onChange={(e) => setTeam((ts) => ts.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                    placeholder="Name"
                    maxLength={80}
                  />
                  <button
                    type="button"
                    onClick={() => setTeam((ts) => (ts.length === 1 ? [{ role: "", name: "" }] : ts.filter((_, j) => j !== i)))}
                    className="w-10 shrink-0 rounded-xl text-muted hover:bg-surface-2 hover:text-like grid place-items-center cursor-pointer"
                    aria-label="Remove team member"
                  >
                    <CloseIcon size={16} />
                  </button>
                </div>
              ))}
            </div>
            {team.length < 30 && (
              <button type="button" onClick={() => setTeam((ts) => [...ts, { role: "", name: "" }])} className="btn btn-ghost !px-2 mt-1 text-primary">
                + Add team member
              </button>
            )}
          </div>

          <Field label="Trailer link (YouTube)">
            <input type="url" className="input" value={form.trailerUrl} onChange={set("trailerUrl")} placeholder="https://youtube.com/watch?v=…" maxLength={300} />
          </Field>

          {error && <p className="text-sm text-like">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 sm:px-6 py-4 border-t border-line">
          <button type="button" onClick={onClose} disabled={saving} className="btn btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn btn-primary !px-6">
            {saving ? "Saving…" : movie ? "Save changes" : "Add movie"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <span className="block mt-1.5">{children}</span>
    </label>
  );
}

function ChipPicker({
  label,
  options,
  value,
  onChange,
  max,
  allowCustom,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  max: number;
  allowCustom?: boolean;
}) {
  const [custom, setCustom] = useState("");
  const all = [...options, ...value.filter((v) => !options.includes(v))];
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((v) => v !== o) : value.length < max ? [...value, o] : value);

  return (
    <div>
      <div className="text-sm font-semibold mb-2">
        {label} <span className="text-muted font-normal">(up to {max})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {all.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            aria-pressed={value.includes(o)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium border transition cursor-pointer ${
              value.includes(o) ? "bg-primary text-white border-primary" : "border-line text-muted hover:border-primary/50 hover:text-text"
            }`}
          >
            {o}
          </button>
        ))}
        {allowCustom && (
          <span className="inline-flex items-center rounded-full border border-dashed border-line pl-3 pr-1">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const v = custom.trim();
                  if (v && !value.includes(v) && value.length < max) onChange([...value, v]);
                  setCustom("");
                }
              }}
              placeholder="Other…"
              className="w-20 bg-transparent outline-none text-sm py-1"
              maxLength={40}
            />
          </span>
        )}
      </div>
    </div>
  );
}
