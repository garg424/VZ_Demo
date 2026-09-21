// Fictional telco brand for the demo. Change BRAND_NAME here to rename everywhere.
export const BRAND_NAME = "Corvia";

// Logo mark: a rounded red badge with a white connectivity/broadcast glyph.
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={`h-7 w-7 text-vz-red ${className}`}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <g fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
        <path d="M10.5 19.5a8 8 0 0 1 11 0" />
        <path d="M7 15.8a13 13 0 0 1 18 0" />
      </g>
      <circle cx="16" cy="22.5" r="2.1" fill="#fff" />
    </svg>
  );
}

// Full lockup: mark + wordmark. wordmarkClassName controls the wordmark colour.
export function Logo({
  wordmarkClassName = "text-slate-900",
}: {
  wordmarkClassName?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark />
      <span className={`text-lg font-extrabold tracking-tight ${wordmarkClassName}`}>
        {BRAND_NAME}
      </span>
    </span>
  );
}
