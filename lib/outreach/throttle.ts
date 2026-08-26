const MIN_MINUTES = 6;
const MAX_MINUTES = 18;

/** Zufälliger Ziel-Abstand für die nächste Mail — kein fixer Takt. */
export function randomIntervalMinutes(): number {
  return MIN_MINUTES + Math.random() * (MAX_MINUTES - MIN_MINUTES);
}

export function isThrottleElapsed(lastSentAt: Date | null, now: Date = new Date()): boolean {
  if (!lastSentAt) return true;
  const elapsedMinutes = (now.getTime() - lastSentAt.getTime()) / 60_000;
  return elapsedMinutes >= randomIntervalMinutes();
}
