const TIMEZONE = "Europe/Berlin";

/** Sendefenster: Di–Do, 09:00–11:00 und 13:00–16:00 Europe/Berlin. */
export function isWithinSendWindow(now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === "weekday")?.value;
  const hour = Number(parts.find((p) => p.type === "hour")?.value);

  const isTueThu = weekday === "Tue" || weekday === "Wed" || weekday === "Thu";
  if (!isTueThu) return false;

  const inMorning = hour >= 9 && hour < 11;
  const inAfternoon = hour >= 13 && hour < 16;
  return inMorning || inAfternoon;
}

/** UTC-Instant der letzten lokalen Mitternacht in Europe/Berlin (für Tages-Cap-Zählung). */
export function startOfBerlinDay(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const msSinceLocalMidnight =
    (get("hour") * 3600 + get("minute") * 60 + get("second")) * 1000 + now.getMilliseconds();

  return new Date(now.getTime() - msSinceLocalMidnight);
}
