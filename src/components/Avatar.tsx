const GRADIENTS = [
  "linear-gradient(135deg,#7c3aed,#c026d3)",
  "linear-gradient(135deg,#db2777,#f97316)",
  "linear-gradient(135deg,#0ea5e9,#6366f1)",
  "linear-gradient(135deg,#10b981,#0ea5e9)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#8b5cf6,#ec4899)",
  "linear-gradient(135deg,#14b8a6,#84cc16)",
];

export default function Avatar({ name, size = 40, ring = false }: { name: string; size?: number; ring?: boolean }) {
  const hash = [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold text-white shrink-0 select-none ${
        ring ? "ring-[3px] ring-white shadow-md" : ""
      }`}
      style={{ width: size, height: size, fontSize: size * 0.38, background: GRADIENTS[hash % GRADIENTS.length] }}
      aria-hidden
    >
      {initials || "?"}
    </span>
  );
}
