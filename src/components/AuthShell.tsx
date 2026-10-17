/** Split-screen layout shared by the sign-in and sign-up pages. */
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-[1fr_minmax(0,560px)]">
      <aside className="hidden lg:flex relative overflow-hidden brand-gradient text-white p-12 flex-col">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-white/10" />
        <div className="absolute -left-20 bottom-[-120px] w-[28rem] h-[28rem] rounded-full bg-white/10" />
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative stock image */}
        <img
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=70&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-30"
        />
        <div className="relative mt-auto max-w-lg">
          <h1 className="text-5xl font-extrabold tracking-tight leading-[1.05]">Where films meet their audience.</h1>
          <p className="mt-4 text-lg text-white/85">
            Directors share updates straight from set. Audiences near and far cheer them on with likes, ratings and
            thoughts.
          </p>
          <ul className="mt-8 space-y-3 text-white/90">
            {["Feeds from directors near you, first", "Rate films with half-star precision", "Join the conversation with your thoughts"].map(
              (t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-white/20 grid place-items-center text-xs">✓</span>
                  {t}
                </li>
              ),
            )}
          </ul>
        </div>
      </aside>
      <div className="flex items-center justify-center px-4 py-10 sm:px-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </span>
      <span className="block mt-1.5">{children}</span>
      {error && <span className="block text-xs text-like mt-1">{error}</span>}
    </label>
  );
}
