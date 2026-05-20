export default function TrustBadges() {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-bronze/30 bg-bronze/5">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="text-bronze shrink-0">
          <path d="M7 1L8.8 5.1L13.3 5.5L10 8.4L11 12.8L7 10.4L3 12.8L4 8.4L0.7 5.5L5.2 5.1L7 1Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
        </svg>
        <span className="text-bronze text-[10px] font-mono tracking-[0.15em] uppercase">
          IVB Accelerator · Aufgenommen 2025
        </span>
      </div>
    </div>
  );
}
