"use client";

import { useEffect, useState } from "react";

const TARGET = new Date("2025-10-01T00:00:00");

function getRemaining() {
  const diff = TARGET.getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes };
}

export default function CountdownTimer() {
  const [remaining, setRemaining] = useState<ReturnType<typeof getRemaining>>(null);

  useEffect(() => {
    setRemaining(getRemaining());
    const id = setInterval(() => setRemaining(getRemaining()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!remaining) return null;

  return (
    <p className="text-bronze/60 text-xs font-mono tracking-[0.15em]">
      ⟶ Eröffnung in{" "}
      <span className="text-bronze">{remaining.days} Tagen</span>
      {" · "}
      <span className="text-bronze">{remaining.hours} Std</span>
      {" · "}
      <span className="text-bronze">{remaining.minutes} Min</span>
    </p>
  );
}
