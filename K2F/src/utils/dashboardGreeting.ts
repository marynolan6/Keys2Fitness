export function dashboardPeriod(now: Date) {
  const hour = now.getHours();
  const next = new Date(now);
  next.setHours(hour < 12 ? 12 : hour < 18 ? 18 : 24, 0, 0, 0);
  return { greeting: hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening", next };
}
