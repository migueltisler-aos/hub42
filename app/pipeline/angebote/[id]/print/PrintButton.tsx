"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2 text-xs font-mono font-semibold"
      style={{ background: "#C8964A", color: "#2A4A3C" }}
    >
      Drucken / als PDF speichern
    </button>
  );
}
