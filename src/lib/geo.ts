import type { Location } from "./types";

export type GeoFailure = "denied" | "unavailable" | "timeout" | "unsupported";

/** Ask the browser for the device location (this shows the browser's permission prompt). */
export function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject("unsupported" satisfies GeoFailure);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) =>
        reject(
          (err.code === err.PERMISSION_DENIED ? "denied" : err.code === err.TIMEOUT ? "timeout" : "unavailable") satisfies GeoFailure,
        ),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

/** Turn coordinates into city / state / country. Returns null if the lookup fails. */
export async function reverseGeocode(lat: number, lng: number): Promise<Location | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    );
    if (!res.ok) return null;
    const d = await res.json();
    return {
      city: d.city || d.locality || undefined,
      state: d.principalSubdivision || undefined,
      country: d.countryName || undefined,
    };
  } catch {
    return null;
  }
}

export function formatLocation(loc?: Pick<Location, "city" | "state"> | null) {
  if (!loc) return "";
  return [loc.city, loc.state].filter(Boolean).join(", ");
}
