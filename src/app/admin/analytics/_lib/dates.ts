/** Inclusive period of `days` calendar days ending today (Europe/London date for bucketing). */
export function getPeriodStartEnd(days: number): {
  start: Date;
  end: Date;
  startUnix: number;
  endUnix: number;
} {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return {
    start,
    end,
    startUnix: Math.floor(start.getTime() / 1000),
    endUnix: Math.floor(end.getTime() / 1000),
  };
}

export function ukDayKeyFromUnix(ts: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ts * 1000));
}

/** One row per calendar day in the period (aligned with `getPeriodStartEnd`). */
export function enumerateDaysInPeriod(days: number): string[] {
  const { start, end } = getPeriodStartEnd(days);
  const out: string[] = [];
  const cur = new Date(start);
  const endAt = new Date(end);
  while (cur <= endAt) {
    out.push(ukDayKeyFromUnix(Math.floor(cur.getTime() / 1000)));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}
