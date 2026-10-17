"use client";

import { useEffect, useId, useState } from "react";
import { CloseIcon } from "./Icons";

const errorMessage = (e: unknown) =>
  (e as { data?: { error?: string } })?.data?.error ??
  (e instanceof Error ? e.message : "Something went wrong. Please try again.");

/**
 * The app's confirmation dialog, used instead of window.confirm().
 * `onConfirm` may be async: the dialog shows a busy state, closes when it resolves,
 * and shows the error (staying open) if it rejects.
 */
export default function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  busyLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  icon,
  onConfirm,
  onClose,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  busyLabel?: string;
  cancelLabel?: string;
  /** "danger" for destructive actions (red), "primary" for everything else */
  tone?: "danger" | "primary";
  icon?: React.ReactNode;
  onConfirm: () => unknown | Promise<unknown>;
  onClose: () => void;
  /** Extra content between the description and the buttons */
  children?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [busy, onClose]);

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  const danger = tone === "danger";

  return (
    <div
      className="fixed inset-0 z-50 bg-text/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="card w-full sm:max-w-md rounded-b-none sm:rounded-2xl p-6 relative animate-[slideUp_.2s_ease-out]"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="absolute top-4 right-4 w-8 h-8 rounded-full grid place-items-center text-muted hover:bg-surface-2 cursor-pointer"
          aria-label="Close"
        >
          <CloseIcon size={18} />
        </button>

        <div
          className={`w-12 h-12 rounded-2xl grid place-items-center text-2xl ${
            danger ? "bg-red-50 text-like" : "bg-gradient-to-br from-orange-400 to-pink-500 text-white shadow-lg shadow-pink-500/30"
          }`}
          aria-hidden
        >
          {icon ?? (danger ? "🗑️" : "❔")}
        </div>

        <h2 id={titleId} className="text-xl font-extrabold mt-4 pr-8">
          {title}
        </h2>
        {description && (
          <div id={descId} className="text-sm text-muted mt-1.5 leading-relaxed">
            {description}
          </div>
        )}

        {children}

        {error && (
          <p role="alert" className="text-sm text-like mt-4">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-2">
          {/* Cancel gets focus first so Enter never triggers a destructive action by accident */}
          <button type="button" onClick={onClose} disabled={busy} className="btn btn-ghost flex-1" autoFocus={danger}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className={`btn flex-1 !py-3 ${danger ? "bg-like text-white hover:bg-red-700" : "btn-primary"}`}
            autoFocus={!danger}
          >
            {busy ? (busyLabel ?? "Please wait…") : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
