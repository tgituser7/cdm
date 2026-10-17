import Link from "next/link";

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0">
      <span className="brand-gradient w-9 h-9 rounded-xl grid place-items-center shadow-md shadow-primary/30">
        <svg viewBox="0 0 24 24" className="w-4 h-4 ml-0.5" aria-hidden>
          <path d="M7 4.5v15l12-7.5z" fill="#fff" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block font-extrabold tracking-tight text-[17px]">Cinema Dharshak Manch</span>
        </span>
      )}
    </Link>
  );
}
