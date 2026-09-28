export function AlgonexMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="algonex-mark"
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="10" fill="#0B132B" />
      {/* Outer Hex Shield */}
      <path
        d="M20 6L32 13V27L20 34L8 27V13L20 6Z"
        stroke="#2563EB"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Inner tinted chamber */}
      <path
        d="M20 10.5L28.5 15.5V24.5L20 29.5L11.5 24.5V15.5L20 10.5Z"
        fill="#1D4ED8"
        fillOpacity="0.22"
      />
      {/* A-Apex Structure */}
      <path
        d="M14 27L20 13.5L26 27"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Nexus Crossbar */}
      <path
        d="M16 22H24"
        stroke="#38BDF8"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Apex Signal Node */}
      <circle cx="20" cy="13.5" r="2.2" fill="#38BDF8" />
    </svg>
  );
}

export function AlgonexLogo({
  subTitle = "Exam Studio",
  compact = false,
}: {
  subTitle?: string;
  compact?: boolean;
}) {
  return (
    <div className={`algonex-logo-lockup ${compact ? "compact" : ""}`}>
      <AlgonexMark size={compact ? 32 : 38} />
      <div className="algonex-text-lockup">
        <span className="algonex-brand-name">
          ALGONEX
        </span>
        <span className="algonex-brand-sub">{subTitle}</span>
      </div>
    </div>
  );
}
