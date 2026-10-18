/** Clapperboard: striped clapstick + board with a striped top band (stripes are cut out with evenodd). */
export const CLAPPER_PATH =
  // clapstick, opened at an angle, with three stripes
  "M2 8 19.6 2.2l.93 2.85L2.93 10.85z" +
  "M4.46 7.19 6.58 6.49 9.62 8.65 7.51 9.34z" +
  "M9.74 5.45 11.86 4.75 14.9 6.91 12.79 7.6z" +
  "M15.02 3.71 17.14 3.01 20.18 5.17 18.07 5.86z" +
  // board
  "M2 12.2h20v8.3a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 20.5z" +
  // stripes on the board's top band
  "M4.6 12.2h2.6l-1.8 2.6H2.8z" +
  "M10.2 12.2h2.6L11 14.8H8.4z" +
  "M15.8 12.2h2.6L16.6 14.8H14z";

type P = { className?: string; size?: number };

export function HeartIcon({ filled, className = "", size = 20 }: P & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <path
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.8}
        strokeLinejoin="round"
        d="M12 20.5s-7.6-4.6-9.5-9.3C1 7.6 3.3 4 7 4c2 0 3.5 1 5 2.9C13.5 5 15 4 17 4c3.7 0 6 3.6 4.5 7.2-1.9 4.7-9.5 9.3-9.5 9.3z"
      />
    </svg>
  );
}

export function ThoughtIcon({ className = "", size = 20 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden>
      <path d="M4 5.5A1.5 1.5 0 015.5 4h13A1.5 1.5 0 0120 5.5v9a1.5 1.5 0 01-1.5 1.5H10l-4.5 4v-4h0A1.5 1.5 0 014 14.5z" />
    </svg>
  );
}

/** Clapperboard — the rating symbol. */
export function ClapperIcon({ className = "", size = 20, filled = true }: P & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <path
        fill={filled ? "currentColor" : "none"}
        fillRule="evenodd"
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.6}
        strokeLinejoin="round"
        d={CLAPPER_PATH}
      />
    </svg>
  );
}

export function PhotoIcon({ className = "", size = 20 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="M21 16l-5.2-5.2a1 1 0 00-1.4 0L6 19.5" strokeLinejoin="round" />
    </svg>
  );
}

export function FilmIcon({ className = "", size = 20 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
    </svg>
  );
}

export function CloseIcon({ className = "", size = 20 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function HomeIcon({ className = "", size = 20 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden>
      <path d="M4 10.5L12 4l8 6.5V19a1 1 0 01-1 1h-4.5v-5.5h-5V20H5a1 1 0 01-1-1z" />
    </svg>
  );
}

export function SendIcon({ className = "", size = 18 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden>
      <path d="M3.4 20.4l17.5-7.5a1 1 0 000-1.8L3.4 3.6a.9.9 0 00-1.3 1L4 12l-1.9 7.4a.9.9 0 001.3 1z" />
    </svg>
  );
}

export function DotsIcon({ className = "", size = 20 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

export function ShareIcon({ className = "", size = 20 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 4.5 20 10l-6 5.5V12.6c-4.6 0-7.6 1.4-10 5.4.7-5.1 3.6-9.4 10-10.2z" />
    </svg>
  );
}

/** Stacked cards — the Feed. */
export function FeedIcon({ className = "", size = 20 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden>
      <rect x="4" y="3.5" width="16" height="7" rx="2" />
      <rect x="4" y="13.5" width="16" height="7" rx="2" />
      <path d="M7.5 7h6M7.5 17h9" strokeLinecap="round" />
    </svg>
  );
}
