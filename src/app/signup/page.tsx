"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthShell, { Field } from "@/components/AuthShell";
import PasswordInput, { passwordStrength } from "@/components/PasswordInput";
import type { Role } from "@/lib/types";
import { useAppDispatch, useSession } from "@/store/hooks";
import { signup } from "@/store/sessionSlice";

const ROLES: { value: Role; title: string; text: string; icon: string }[] = [
  { value: "audience", title: "Audience", text: "Like, rate and share thoughts on feeds", icon: "🍿" },
  { value: "director", title: "Director", text: "Share updates and images from your films", icon: "🎬" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRENGTH_COLORS = ["bg-line", "bg-red-400", "bg-orange-400", "bg-lime-500", "bg-emerald-500"];

type Errors = Partial<Record<"name" | "email" | "mobile" | "password" | "confirm" | "city" | "terms", string>>;

export default function SignupPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, ready } = useSession();
  const [role, setRole] = useState<Role>("audience");
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "", confirm: "", city: "", state: "", bio: "" });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && user && !submitting) router.replace(user.role === "director" ? "/director" : "/");
  }, [ready, user, submitting, router]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (form.name.trim().length < 2) e.name = "Enter your full name";
    if (!EMAIL_RE.test(form.email.trim())) e.email = "Enter a valid email address";
    if (form.mobile && !/^[+\d][\d\s-]{6,18}$/.test(form.mobile.trim())) e.mobile = "Enter a valid mobile number";
    if (form.password.length < 8) e.password = "Use at least 8 characters";
    if (form.confirm !== form.password) e.confirm = "Passwords don't match";
    if (role === "director" && !form.city.trim()) e.city = "Tell audiences where you're based";
    if (!terms) e.terms = "Please accept the terms to continue";
    return e;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    const res = await dispatch(
      signup({
        name: form.name,
        email: form.email,
        password: form.password,
        role,
        mobile: form.mobile || undefined,
        bio: role === "director" ? form.bio : undefined,
        // Directors enter where they're based; audience members are asked for their location next.
        location: role === "director" ? { city: form.city, state: form.state, source: "manual" } : undefined,
      }),
    );
    if (signup.fulfilled.match(res)) {
      router.push(role === "director" ? "/director" : "/");
    } else {
      setServerError(res.payload?.message ?? "Couldn't create your account");
      if (res.payload?.fields) setErrors((er) => ({ ...er, ...res.payload!.fields }));
      setSubmitting(false);
    }
  };

  const strength = passwordStrength(form.password);

  return (
    <AuthShell>
      <h1 className="text-3xl font-extrabold tracking-tight">Create your account</h1>
      <p className="text-muted mt-1.5">It&apos;s free and takes less than a minute.</p>

      <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
        {serverError && (
          <div role="alert" className="rounded-xl bg-like/10 border border-like/30 text-like text-sm px-4 py-3">
            {serverError}
          </div>
        )}

        <fieldset>
          <legend className="text-sm font-semibold mb-2">I&apos;m joining as</legend>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.value}
                onClick={() => setRole(r.value)}
                aria-pressed={role === r.value}
                className={`text-left rounded-2xl border-2 p-3.5 transition cursor-pointer ${
                  role === r.value ? "border-primary bg-primary-soft" : "border-line hover:border-primary/40"
                }`}
              >
                <div className="text-xl">{r.icon}</div>
                <div className={`font-bold mt-1 ${role === r.value ? "text-primary" : ""}`}>{r.title}</div>
                <div className="text-xs text-muted mt-0.5 leading-snug">{r.text}</div>
              </button>
            ))}
          </div>
        </fieldset>

        <Field label="Full name" error={errors.name}>
          <input className={`input ${errors.name ? "!border-like" : ""}`} value={form.name} onChange={set("name")} placeholder={role === "director" ? "e.g. Anaya Rao" : "e.g. Rohit Sharma"} autoComplete="name" />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Email address" error={errors.email}>
            <input type="email" className={`input ${errors.email ? "!border-like" : ""}`} value={form.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" />
          </Field>
          <Field label="Mobile" hint="Optional" error={errors.mobile}>
            <input type="tel" className={`input ${errors.mobile ? "!border-like" : ""}`} value={form.mobile} onChange={set("mobile")} placeholder="+91 98765 43210" autoComplete="tel" />
          </Field>
        </div>

        <Field label="Password" error={errors.password}>
          <PasswordInput value={form.password} onChange={set("password")} placeholder="At least 8 characters" autoComplete="new-password" invalid={!!errors.password} />
          {form.password && (
            <span className="flex items-center gap-2 mt-2">
              <span className="flex-1 grid grid-cols-4 gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className={`h-1.5 rounded-full ${i <= strength.score ? STRENGTH_COLORS[strength.score] : "bg-line"}`} />
                ))}
              </span>
              <span className="text-xs text-muted w-16 text-right">{strength.label}</span>
            </span>
          )}
        </Field>

        <Field label="Confirm password" error={errors.confirm}>
          <PasswordInput value={form.confirm} onChange={set("confirm")} placeholder="Type it again" autoComplete="new-password" invalid={!!errors.confirm} />
        </Field>

        {role === "director" && (
          <div className="rounded-2xl bg-surface-2 p-4 space-y-4">
            <div className="text-sm font-bold">Director profile</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Based in (city)" error={errors.city}>
                <input className={`input !bg-surface ${errors.city ? "!border-like" : ""}`} value={form.city} onChange={set("city")} placeholder="e.g. Mumbai" autoComplete="address-level2" />
              </Field>
              <Field label="State">
                <input className="input !bg-surface" value={form.state} onChange={set("state")} placeholder="e.g. Maharashtra" autoComplete="address-level1" />
              </Field>
            </div>
            <Field label="About you" hint="Optional">
              <textarea className="input !bg-surface resize-none" rows={2} maxLength={300} value={form.bio} onChange={set("bio")} placeholder="Your films, your style, what you're working on…" />
            </Field>
          </div>
        )}

        {role === "audience" && (
          <p className="text-xs text-muted rounded-xl bg-surface-2 px-3 py-2.5">
            📍 After you sign up we&apos;ll ask to use your location so we can show feeds from near you first.
          </p>
        )}

        <div>
          <label className="flex items-start gap-2 text-sm cursor-pointer select-none">
            <input type="checkbox" checked={terms} onChange={(e) => (setTerms(e.target.checked), setErrors((er) => ({ ...er, terms: undefined })))} className="w-4 h-4 mt-0.5 accent-[var(--primary)]" />
            <span>
              I agree to the <span className="font-semibold text-primary">Terms of Service</span> and{" "}
              <span className="font-semibold text-primary">Privacy Policy</span>.
            </span>
          </label>
          {errors.terms && <p className="text-xs text-like mt-1">{errors.terms}</p>}
        </div>

        <button type="submit" className="btn btn-primary w-full !py-3" disabled={submitting}>
          {submitting ? "Creating account…" : `Create ${role === "director" ? "director" : "audience"} account`}
        </button>
      </form>

      <p className="text-sm text-muted text-center mt-6">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
