"use client";

import { useState } from "react";
import { type GeoFailure, getCurrentPosition, reverseGeocode } from "@/lib/geo";
import type { Location } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeLocationPrompt, saveLocation } from "@/store/sessionSlice";
import { CloseIcon } from "./Icons";

type Step = "ask" | "locating" | "form";

const FAILURE_TEXT: Record<GeoFailure, string> = {
  denied: "Location access was blocked. No problem, just tell us your city.",
  unavailable: "We couldn't detect your location. Please enter it below.",
  timeout: "Finding your location took too long. Please enter it below.",
  unsupported: "Your browser doesn't support location. Please enter it below.",
};

/**
 * Asks audience members for their location: first via the browser permission prompt,
 * falling back to a manual form if they decline.
 */
export default function LocationPrompt() {
  const open = useAppSelector((s) => s.session.locationPromptOpen);
  const user = useAppSelector((s) => s.session.user);
  if (!open || !user) return null;
  return <LocationDialog key={user.id} current={user.location} />;
}

function LocationDialog({ current }: { current?: Location }) {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<Step>(current?.city ? "form" : "ask");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Location>({
    city: current?.city ?? "",
    state: current?.state ?? "",
    country: current?.country ?? "India",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const allow = async () => {
    setStep("locating");
    setError("");
    try {
      const pos = await getCurrentPosition();
      setCoords(pos);
      const place = await reverseGeocode(pos.lat, pos.lng);
      if (place?.city) {
        setForm({ city: place.city, state: place.state ?? "", country: place.country ?? "India" });
        setNotice("📍 We found you here. Check the details and confirm.");
      } else {
        setNotice("📍 Location detected. Please confirm your city.");
      }
    } catch (reason) {
      setNotice(FAILURE_TEXT[reason as GeoFailure] ?? FAILURE_TEXT.unavailable);
    }
    setStep("form");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.city?.trim()) return setError("Please enter your city");
    setSaving(true);
    setError("");
    const res = await dispatch(saveLocation({ ...form, ...(coords ?? {}), source: coords ? "gps" : "manual" }));
    setSaving(false);
    if (saveLocation.rejected.match(res)) setError(res.payload?.message ?? "Couldn't save location");
  };

  const set = (k: keyof Location) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="loc-title" className="card w-full sm:max-w-md rounded-b-none sm:rounded-2xl p-6 relative animate-[slideUp_.25s_ease-out]">
        <button
          onClick={() => dispatch(closeLocationPrompt())}
          className="absolute top-4 right-4 w-8 h-8 rounded-full grid place-items-center text-muted hover:bg-surface-2 cursor-pointer"
          aria-label="Not now"
        >
          <CloseIcon size={18} />
        </button>

        <div className="w-14 h-14 rounded-2xl brand-gradient grid place-items-center text-2xl shadow-lg shadow-primary/30">📍</div>

        {step !== "form" ? (
          <>
            <h2 id="loc-title" className="text-xl font-extrabold mt-4">
              Allow Dharshak Manch to use your location?
            </h2>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              We&apos;ll show feeds from films and directors <b className="text-text">near you first</b>, then
              everything else. Your exact location is never shown to anyone.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button onClick={allow} disabled={step === "locating"} className="btn btn-primary !py-3">
                {step === "locating" ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Finding your location…
                  </>
                ) : (
                  "Allow location access"
                )}
              </button>
              <button
                onClick={() => (setNotice(""), setStep("form"))}
                disabled={step === "locating"}
                className="btn btn-ghost !py-3"
              >
                Enter my city instead
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={save}>
            <h2 id="loc-title" className="text-xl font-extrabold mt-4">
              {current?.city ? "Update your location" : "Where are you watching from?"}
            </h2>
            {notice && <p className="text-sm mt-2 rounded-xl bg-primary-soft text-primary px-3 py-2">{notice}</p>}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <label className="col-span-2">
                <span className="text-sm font-semibold">City</span>
                <input className="input mt-1.5" value={form.city} onChange={set("city")} placeholder="e.g. Bengaluru" autoFocus required />
              </label>
              <label>
                <span className="text-sm font-semibold">State</span>
                <input className="input mt-1.5" value={form.state} onChange={set("state")} placeholder="e.g. Karnataka" />
              </label>
              <label>
                <span className="text-sm font-semibold">Country</span>
                <input className="input mt-1.5" value={form.country} onChange={set("country")} />
              </label>
            </div>
            {error && <p className="text-sm text-like mt-3">{error}</p>}
            <div className="mt-6 flex gap-2">
              {!coords && (
                <button type="button" onClick={allow} className="btn btn-soft">
                  📍 Detect
                </button>
              )}
              <button type="submit" disabled={saving} className="btn btn-primary flex-1 !py-3">
                {saving ? "Saving…" : "Save location"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
