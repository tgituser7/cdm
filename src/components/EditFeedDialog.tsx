"use client";

import { useEffect, useRef, useState } from "react";
import { imageUrl } from "@/lib/api";
import { compressImage } from "@/lib/image";
import type { Feed } from "@/lib/types";
import { useUpdateFeedMutation } from "@/store/feedApi";
import { CloseIcon, FilmIcon, PhotoIcon } from "./Icons";

const MAX_IMAGES = 6;

interface NewImage {
  blob: Blob;
  preview: string;
}

/** Modal for a director to edit the text, film tag, location and images of their feed. */
export default function EditFeedDialog({ feed, onClose }: { feed: Feed; onClose: () => void }) {
  const [updateFeed, { isLoading: saving }] = useUpdateFeedMutation();
  const [text, setText] = useState(feed.text);
  const [filmTitle, setFilmTitle] = useState(feed.filmTitle ?? "");
  const [city, setCity] = useState(feed.location?.city ?? "");
  const [state, setState] = useState(feed.location?.state ?? "");
  const [kept, setKept] = useState<string[]>(feed.images);
  const [added, setAdded] = useState<NewImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const addedRef = useRef(added);
  useEffect(() => {
    addedRef.current = added;
  }, [added]);
  useEffect(() => () => addedRef.current.forEach((i) => URL.revokeObjectURL(i.preview)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !saving && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, saving]);

  const total = kept.length + added.length;
  // Rating feeds only have a message; the movie card, ratings and reviews come from the movie.
  const isRating = feed.type === "rating";

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    const room = MAX_IMAGES - total;
    const picked = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, room);
    if (files.length > room) setError(`A feed can have up to ${MAX_IMAGES} images.`);
    setBusy(true);
    try {
      const blobs = await Promise.all(picked.map((f) => compressImage(f)));
      setAdded((prev) => [...prev, ...blobs.map((blob) => ({ blob, preview: URL.createObjectURL(blob) }))]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load that image.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRating && !text.trim() && total === 0) return setError("Write something or add an image.");
    const body = new FormData();
    body.append("text", text);
    if (!isRating) appendDetails(body);
    setError("");
    try {
      await updateFeed({ id: feed.id, body }).unwrap();
      onClose();
    } catch (err) {
      setError((err as { data?: { error?: string } })?.data?.error ?? "Couldn't save changes. Please try again.");
    }
  };

  const appendDetails = (body: FormData) => {
    body.append("filmTitle", filmTitle);
    body.append("city", city);
    body.append("state", state);
    body.append("keepImages", JSON.stringify(kept));
    added.forEach((img, i) => body.append("images", img.blob, `image-${i + 1}.jpg`));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <form
        onSubmit={save}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-feed-title"
        className="card w-full sm:max-w-xl rounded-b-none sm:rounded-2xl max-h-[92vh] flex flex-col animate-[slideUp_.25s_ease-out]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 id="edit-feed-title" className="text-lg font-extrabold">
            {isRating ? `Edit message · ${feed.movie?.title ?? "Rating feed"}` : "Edit feed"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-full grid place-items-center text-muted hover:bg-surface-2 cursor-pointer"
            aria-label="Close"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            maxLength={isRating ? 1000 : 5000}
            className="input resize-none text-[15px] leading-relaxed"
            placeholder={isRating ? "A message to your audience (optional)" : "Write something…"}
            autoFocus
          />

          {!isRating && (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 rounded-xl bg-surface-2 px-3">
                  <FilmIcon size={16} className="text-primary shrink-0" />
                  <input
                    value={filmTitle}
                    onChange={(e) => setFilmTitle(e.target.value)}
                    placeholder="Film (optional)"
                    maxLength={120}
                    className="flex-1 min-w-0 bg-transparent outline-none py-2.5 text-sm"
                  />
                </label>
                <div className="flex items-center gap-2 rounded-xl bg-surface-2 px-3">
                  <span className="text-sm">📍</span>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="flex-1 min-w-0 bg-transparent outline-none py-2.5 text-sm"
                  />
                  <input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className="flex-1 min-w-0 bg-transparent outline-none py-2.5 text-sm border-l border-line pl-2"
                  />
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold mb-2">
                  Images{" "}
                  <span className="text-muted font-normal">
                    ({total}/{MAX_IMAGES})
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {kept.map((src) => (
                    <Thumb key={src} src={imageUrl(src)} onRemove={() => setKept((k) => k.filter((s) => s !== src))} />
                  ))}
                  {added.map((img, i) => (
                    <Thumb
                      key={img.preview}
                      src={img.preview}
                      isNew
                      onRemove={() =>
                        setAdded((prev) => {
                          URL.revokeObjectURL(prev[i]!.preview);
                          return prev.filter((_, j) => j !== i);
                        })
                      }
                    />
                  ))}
                  {total < MAX_IMAGES && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={busy}
                      className="aspect-square rounded-xl border-2 border-dashed border-line text-muted hover:border-primary hover:text-primary flex flex-col items-center justify-center gap-1 text-xs font-semibold cursor-pointer"
                    >
                      <PhotoIcon />
                      {busy ? "Adding…" : "Add image"}
                    </button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  hidden
                  onChange={(e) => onFiles(e.target.files)}
                />
              </div>
            </>
          )}

          {error && <p className="text-sm text-like">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-line">
          <button type="button" onClick={onClose} disabled={saving} className="btn btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={saving || busy} className="btn btn-primary !px-6">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Thumb({ src, onRemove, isNew }: { src: string; onRemove: () => void; isNew?: boolean }) {
  return (
    <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- user uploads and previews */}
      <img src={src} alt="" className="h-full w-full object-cover" />
      {isNew && (
        <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold uppercase bg-primary text-white rounded px-1.5 py-0.5">
          New
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white grid place-items-center cursor-pointer"
        aria-label="Remove image"
      >
        <CloseIcon size={14} />
      </button>
    </div>
  );
}
