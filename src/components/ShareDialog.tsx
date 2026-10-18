"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CloseIcon } from "./Icons";

type Target = { name: string; color: string; icon: React.ReactNode; href: (url: string, text: string) => string };

const TARGETS: Target[] = [
  {
    name: "WhatsApp",
    color: "#25D366",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4a.5.5 0 0 0 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" />
      </svg>
    ),
    href: (url, text) => `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
  },
  {
    name: "Facebook",
    color: "#1877F2",
    icon: <span className="text-xl font-black leading-none">f</span>,
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: "X",
    color: "#111111",
    icon: <span className="text-lg font-black leading-none">𝕏</span>,
    href: (url, text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: "Telegram",
    color: "#229ED9",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
        <path d="M21.4 4.1 2.9 11.3c-1.3.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.4.8.9.8s.6-.2.9-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.3-.5-1.9-1.5-1.4zM9.6 14.5l8.5-7.6-6.6 8.4-.2 3.4z" />
      </svg>
    ),
    href: (url, text) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    name: "Email",
    color: "#6E6A85",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    ),
    href: (url, text) => `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
  },
];

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API blocked (e.g. non-secure context): fall back to a hidden textarea.
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    el.remove();
    return ok;
  }
}

/** Share a link: copy it, send it to an app, or use the device's share sheet. */
export default function ShareDialog({
  url,
  text,
  heading = "Share feed",
  onClose,
}: {
  url: string;
  /** Short message that goes with the link */
  text: string;
  heading?: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feature-detect after mount
    setCanNativeShare(typeof navigator.share === "function");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const copy = async () => {
    if (await copyText(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      inputRef.current?.select();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="card w-full sm:max-w-md rounded-b-none sm:rounded-2xl p-6 relative animate-[slideUp_.2s_ease-out]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full grid place-items-center text-muted hover:bg-surface-2 cursor-pointer"
          aria-label="Close"
        >
          <CloseIcon size={18} />
        </button>

        <h2 id={titleId} className="text-xl font-extrabold">
          {heading}
        </h2>
        <p className="text-sm text-muted mt-1 line-clamp-2 pr-6">{text}</p>

        <div className="mt-5 grid grid-cols-5 gap-2">
          {TARGETS.map((t) => (
            <a
              key={t.name}
              href={t.href(url, text)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 group"
            >
              <span
                className="w-12 h-12 rounded-full grid place-items-center text-white transition group-hover:scale-105 group-hover:shadow-md"
                style={{ background: t.color }}
              >
                {t.icon}
              </span>
              <span className="text-xs text-muted group-hover:text-text">{t.name}</span>
            </a>
          ))}
        </div>

        <label className="block mt-6">
          <span className="text-sm font-semibold">Link</span>
          <span className="mt-1.5 flex gap-2">
            <input
              ref={inputRef}
              readOnly
              value={url}
              onFocus={(e) => e.target.select()}
              className="input flex-1 min-w-0 text-sm"
              aria-label="Feed link"
            />
            <button type="button" onClick={copy} className={`btn shrink-0 ${copied ? "btn-soft" : "btn-primary"}`}>
              {copied ? "✓ Copied" : "Copy link"}
            </button>
          </span>
        </label>
        <p aria-live="polite" className="sr-only">
          {copied ? "Link copied to clipboard" : ""}
        </p>

        {canNativeShare && (
          <button
            type="button"
            onClick={() => navigator.share({ title: heading, text, url }).catch(() => {})}
            className="btn btn-soft w-full mt-3"
          >
            More options…
          </button>
        )}
      </div>
    </div>
  );
}
