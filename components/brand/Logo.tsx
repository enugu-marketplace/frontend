import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
  /** Unique suffix so multiple marks on one page keep distinct gradient ids */
  idSuffix?: string;
};

/**
 * Enugu Market mark: a rounded-square tile holding a market basket
 * whose handle grows into a leaf — "state produce, brought to you".
 */
export const LogoMark = ({ className, idSuffix = "default" }: LogoMarkProps) => {
  const tile = `tile-${idSuffix}`;
  const leaf = `leaf-${idSuffix}`;

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Enugu Market"
      className={cn("h-11 w-11", className)}
    >
      <defs>
        <linearGradient id={tile} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#188049" />
          <stop offset="55%" stopColor="#12663c" />
          <stop offset="100%" stopColor="#0c3f28" />
        </linearGradient>
        <linearGradient id={leaf} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#7cc243" />
          <stop offset="100%" stopColor="#c7f08a" />
        </linearGradient>
      </defs>

      <rect width="64" height="64" rx="18" fill={`url(#${tile})`} />

      {/* subtle top sheen */}
      <path
        d="M0 18C0 8.06 8.06 0 18 0h28C24 6 8 18 0 34V18Z"
        fill="#ffffff"
        opacity="0.07"
      />

      {/* leaf springing from the basket handle */}
      <path
        d="M32 12c8.4-1.6 14.6 2.2 16.4 10.6-8.6 2.5-14.6-1-16.4-10.6Z"
        fill={`url(#${leaf})`}
      />
      <path
        d="M32.6 12.6c5 2.2 8.8 5.4 11.4 9.6"
        stroke="#0c3f28"
        strokeOpacity="0.35"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* basket handle */}
      <path
        d="M24 30c0-6.1 3.6-10.4 8.6-11.6"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.92"
      />

      {/* basket body */}
      <path
        d="M14 30h36l-3.6 15.4A6 6 0 0 1 40.6 50H23.4a6 6 0 0 1-5.8-4.6L14 30Z"
        fill="#ffffff"
      />
      <path
        d="M14 30h36l-1 4.2H15L14 30Z"
        fill="#daf3e2"
      />
      {/* weave lines */}
      <path
        d="M25 36.5 26.8 46M32 36.5V46M39 36.5 37.2 46"
        stroke="#12663c"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

type LogoProps = {
  className?: string;
  /** "light" for dark backgrounds (green bars), "dark" for white backgrounds */
  tone?: "dark" | "light";
  showTagline?: boolean;
  markClassName?: string;
  idSuffix?: string;
};

const Logo = ({
  className,
  tone = "dark",
  showTagline = true,
  markClassName,
  idSuffix = "default",
}: LogoProps) => (
  <span className={cn("flex items-center gap-2.5", className)}>
    <LogoMark className={cn("h-11 w-11 shrink-0", markClassName)} idSuffix={idSuffix} />
    <span className="flex flex-col leading-none">
      <span
        className={cn(
          "text-[17px] font-semibold tracking-tight",
          tone === "light" ? "text-white" : "text-slate-900"
        )}
      >
        Enugu<span className={tone === "light" ? "text-leaf-400" : "text-brand-700"}>Market</span>
      </span>
      {showTagline && (
        <span
          className={cn(
            "mt-0.5 text-[11px]",
            tone === "light" ? "text-brand-100/80" : "text-slate-500"
          )}
        >
          Food scheme
        </span>
      )}
    </span>
  </span>
);

export default Logo;
