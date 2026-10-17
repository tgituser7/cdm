"use client";

import { useEffect, useRef, useState } from "react";
import { compressImage } from "@/lib/image";
import { useCreateFeedMutation, useGetMoviesQuery } from "@/store/feedApi";
import { useSession } from "@/store/hooks";
import Avatar from "./Avatar";
import { CloseIcon, FilmIcon, PhotoIcon } from "./Icons";

const MAX_IMAGES = 6;

interface Picked {
  blob: Blob;
  preview: string;
}

/** "What's on your mind" box that lets directors write a feed and attach images. */
export default function Composer() {
  const { user } = useSession();
  const [createFeed, { isLoading: sharing }] = useCreateFeedMutation();
  const { data: myMovies = [] } = useGetMoviesQuery({ director: "me" }, { skip: user?.role !== "director" });
  const [text, setText] = useState("");
  const [filmTitle, setFilmTitle] = useState("");
  const [showFilm, setShowFilm] = useState(false);
  const [showPlace, setShowPlace] = useState(false);
  const [place, setPlace] = useState({ city: "", state: "" });
  const [images, setImages] = useState<Picked[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Free preview URLs when images are removed or the composer unmounts.
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(() => () => imagesRef.current.forEach((i) => URL.revokeObjectURL(i.preview)), []);

  if (user?.role !== "director") return null;

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    const room = MAX_IMAGES - images.length;
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, room);
    if (files.length > room) setError(`You can add up to ${MAX_IMAGES} images per feed.`);
    setBusy(true);
    try {
      const blobs = await Promise.all(picked.map((f) => compressImage(f)));
      setImages((prev) => [...prev, ...blobs.map((blob) => ({ blob, preview: URL.createObjectURL(blob) }))]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load that image.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (i: number) =>
    setImages((prev) => {
      URL.revokeObjectURL(prev[i]!.preview);
      return prev.filter((_, j) => j !== i);
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && images.length === 0) return;
    const body = new FormData();
    body.append("text", text);
    if (filmTitle.trim()) body.append("filmTitle", filmTitle);
    if (showPlace && place.city.trim()) {
      body.append("city", place.city);
      body.append("state", place.state);
    }
    images.forEach((img, i) => body.append("images", img.blob, `image-${i + 1}.jpg`));

    setError("");
    try {
      await createFeed(body).unwrap();
      images.forEach((i) => URL.revokeObjectURL(i.preview));
      setText("");
      setImages([]);
      setFilmTitle("");
      setShowFilm(false);
      setShowPlace(false);
    } catch (err) {
      setError((err as { data?: { error?: string } })?.data?.error ?? "Couldn't share. Please try again.");
    }
  };

  const defaultPlace = [user.location?.city, user.location?.state].filter(Boolean).join(", ");

  return (
    <form onSubmit={submit} className="card p-4 sm:p-5">
      <div className="flex gap-3">
        <Avatar name={user.name} size={44} />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Share a film update or anything on your mind, ${user.name.split(" ")[0]}…`}
          rows={text ? 3 : 2}
          maxLength={5000}
          className="flex-1 resize-none bg-transparent outline-none text-[16px] placeholder:text-muted/70 pt-2.5"
        />
      </div>

      {showFilm && (
        <TagRow icon={<FilmIcon size={16} className="text-primary shrink-0" />} onRemove={() => (setShowFilm(false), setFilmTitle(""))}>
          <input
            value={filmTitle}
            onChange={(e) => setFilmTitle(e.target.value)}
            placeholder="Which film is this about? (optional)"
            list="my-movie-titles"
            className="flex-1 bg-transparent outline-none py-2.5 text-sm"
            maxLength={120}
            autoFocus
          />
        </TagRow>
      )}

      <datalist id="my-movie-titles">
        {myMovies.map((m) => (
          <option key={m.id} value={m.title} />
        ))}
      </datalist>

      {showPlace && (
        <TagRow icon={<span className="text-sm">📍</span>} onRemove={() => setShowPlace(false)}>
          <input
            value={place.city}
            onChange={(e) => setPlace((p) => ({ ...p, city: e.target.value }))}
            placeholder="City"
            className="flex-1 min-w-0 bg-transparent outline-none py-2.5 text-sm"
            autoFocus
          />
          <input
            value={place.state}
            onChange={(e) => setPlace((p) => ({ ...p, state: e.target.value }))}
            placeholder="State"
            className="flex-1 min-w-0 bg-transparent outline-none py-2.5 text-sm border-l border-line pl-3"
          />
        </TagRow>
      )}

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img, i) => (
            <div key={img.preview} className="relative aspect-square rounded-xl overflow-hidden bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img src={img.preview} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white grid place-items-center cursor-pointer opacity-90 hover:opacity-100"
                aria-label="Remove image"
              >
                <CloseIcon size={14} />
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-line text-muted hover:border-primary hover:text-primary grid place-items-center text-2xl cursor-pointer"
              aria-label="Add more images"
            >
              +
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-like">{error}</p>}

      <div className="mt-4 pt-3 border-t border-line flex items-center gap-1 flex-wrap">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy || images.length >= MAX_IMAGES} className="btn btn-ghost !px-3">
          <PhotoIcon className="text-emerald-500" /> {busy ? "Adding…" : "Image"}
        </button>
        <button type="button" onClick={() => setShowFilm(true)} className="btn btn-ghost !px-3">
          <FilmIcon className="text-primary" /> Tag film
        </button>
        <button
          type="button"
          onClick={() => setShowPlace(true)}
          className="btn btn-ghost !px-3"
          title={defaultPlace ? `Defaults to ${defaultPlace}` : undefined}
        >
          📍 {showPlace || !defaultPlace ? "Location" : defaultPlace}
        </button>
        <button type="submit" className="btn btn-primary ml-auto !px-6" disabled={busy || sharing || (!text.trim() && images.length === 0)}>
          {sharing ? "Sharing…" : "Share"}
        </button>
      </div>
    </form>
  );
}

function TagRow({ icon, onRemove, children }: { icon: React.ReactNode; onRemove: () => void; children: React.ReactNode }) {
  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl bg-surface-2 pl-3 pr-1">
      {icon}
      {children}
      <button type="button" onClick={onRemove} className="w-8 h-8 grid place-items-center text-muted hover:text-text cursor-pointer" aria-label="Remove">
        <CloseIcon size={16} />
      </button>
    </div>
  );
}
