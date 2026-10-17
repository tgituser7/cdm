"use client";

import { useState } from "react";

/** Password field with a show / hide toggle. */
export default function PasswordInput({
  invalid,
  className = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative block">
      <input
        {...rest}
        type={visible ? "text" : "password"}
        className={`input !pr-16 ${invalid ? "!border-like" : ""} ${className}`}
        aria-invalid={invalid || undefined}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted hover:text-primary px-2 py-1 cursor-pointer"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </span>
  );
}

/** 0–4 score with label, for the sign-up strength meter. */
export function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  return { score: pw.length < 8 ? 0 : Math.max(1, score), label: labels[pw.length < 8 ? 0 : Math.max(1, score)]! };
}
