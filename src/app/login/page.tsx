"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthShell, { Field } from "@/components/AuthShell";
import PasswordInput from "@/components/PasswordInput";
import { useAppDispatch, useSession } from "@/store/hooks";
import { login } from "@/store/sessionSlice";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, ready } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already signed in: nothing to do here.
  useEffect(() => {
    if (ready && user && !submitting) router.replace(user.role === "director" ? "/director" : "/");
  }, [ready, user, submitting, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await dispatch(login({ email, password, remember }));
    if (login.fulfilled.match(res)) {
      router.push(res.payload.role === "director" ? "/director" : "/");
    } else {
      setError(res.payload?.message ?? "Couldn't sign in");
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1>
      <p className="text-muted mt-1.5">Sign in to your Dharshak Manch account.</p>

      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        {error && (
          <div role="alert" className="rounded-xl bg-like/10 border border-like/30 text-like text-sm px-4 py-3">
            {error}
          </div>
        )}

        <Field label="Email address">
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            required
          />
        </Field>

        <Field label="Password">
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            required
          />
        </Field>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 accent-[var(--primary)]"
          />
          Keep me signed in for 30 days
        </label>

        <button type="submit" className="btn btn-primary w-full !py-3" disabled={submitting || !email || !password}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-sm text-muted text-center mt-6">
        New to Dharshak Manch?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
