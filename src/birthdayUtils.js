export function parseBirthday(raw) {
  if (!raw) return null;
  const parts = raw.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);
    if (!year || !month || !day) return null;
    return { year, month, day };
  }
  if (parts.length === 2) {
    const [month, day] = parts.map(Number);
    if (!month || !day) return null;
    return { year: null, month, day };
  }
  return null;
}

export function formatBirthday(parsed) {
  if (!parsed) return "-";
  const { year, month, day } = parsed;
  const d = new Date(year || 2000, month - 1, day);
  const opts = { month: "short", day: "numeric" };
  if (year) opts.year = "numeric";
  return d.toLocaleDateString(undefined, opts);
}

export function zodiac(month, day) {
  if (!month || !day) return null;
  const zones = [
    ["Capricorn", 1, 19],
    ["Aquarius", 2, 18],
    ["Pisces", 3, 20],
    ["Aries", 4, 19],
    ["Taurus", 5, 20],
    ["Gemini", 6, 20],
    ["Cancer", 7, 22],
    ["Leo", 8, 22],
    ["Virgo", 9, 22],
    ["Libra", 10, 22],
    ["Scorpio", 11, 21],
    ["Sagittarius", 12, 21],
    ["Capricorn", 12, 31]
  ];
  for (let i = 0; i < zones.length - 1; i++) {
    const [name, mEnd, dEnd] = zones[i];
    const nextMonth = zones[i + 1][1];
    if ((month === mEnd && day <= dEnd) || (month < mEnd && month >= nextMonth)) {
      return name;
    }
  }
  return null;
}

export function daysAlive(parsed) {
  if (!parsed || !parsed.year) return null;
  const { year, month, day } = parsed;
  const start = new Date(year, month - 1, day);
  const today = new Date();
  const diff = today.getTime() - start.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return days >= 0 ? days : null;
}

export function weekday(parsed) {
  if (!parsed || !parsed.year) return null;
  const { year, month, day } = parsed;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, { weekday: "long" });
}
