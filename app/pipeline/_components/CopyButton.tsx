"use client";

export default function CopyButton({ text }: { text: string }) {
  function copy() {
    navigator.clipboard.writeText(text).catch(() => {});
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="mt-2 text-bronze text-xs font-mono hover:underline"
    >
      Kopieren →
    </button>
  );
}
