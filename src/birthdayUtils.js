const MONTHS = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12,
}

export function parseBirthday(birthday) {
  if (!birthday) return null
  const trimmed = String(birthday).trim()

  // YYYY-MM-DD
  let m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) {
    const [, y, mm, dd] = m
    return { year: Number(y), month: Number(mm), day: Number(dd) }
  }

  // MM-DD
  m = trimmed.match(/^(\d{2})-(\d{2})$/)
  if (m) {
    const [, mm, dd] = m
    return { year: null, month: Number(mm), day: Number(dd) }
  }

  // Month D, YYYY  or  Mon D YYYY
  m = trimmed.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/)
  if (m) {
    const [, mon, d, y] = m
    const key = mon.toLowerCase()
    const month = MONTHS[key]
    if (month) {
      return { year: Number(y), month, day: Number(d) }
    }
  }

  // Month D  (no explicit year)
  m = trimmed.match(/^([A-Za-z]{3,9})\s+(\d{1,2})$/)
  if (m) {
    const [, mon, d] = m
    const key = mon.toLowerCase()
    const month = MONTHS[key]
    if (month) {
      return { year: null, month, day: Number(d) }
    }
  }

  return null
}

export function getStarSign(month, day) {
  if (!month || !day) return null
  const zodiacs = [
    ['Capricorn', 1, 19],
    ['Aquarius', 2, 18],
    ['Pisces', 3, 20],
    ['Aries', 4, 19],
    ['Taurus', 5, 20],
    ['Gemini', 6, 20],
    ['Cancer', 7, 22],
    ['Leo', 8, 22],
    ['Virgo', 9, 22],
    ['Libra', 10, 22],
    ['Scorpio', 11, 21],
    ['Sagittarius', 12, 21],
    ['Capricorn', 12, 31],
  ]
  const value = month * 100 + day
  for (let i = 0; i < zodiacs.length - 1; i++) {
    const [sign, sm, sd] = zodiacs[i]
    const [, em, ed] = zodiacs[i + 1]
    const start = sm * 100 + sd
    const end = em * 100 + ed
    if (value >= start && value <= end) return sign
  }
  return null
}

export function computeExtras(birthday) {
  const parsed = parseBirthday(birthday)
  if (!parsed) return { hasYear: false, daysAlive: null, weekday: null, starSign: null }
  const { year, month, day } = parsed

  let daysAlive = null
  let weekday = null

  if (year) {
    const birthDate = new Date(year, month - 1, day)
    const now = new Date()
    const diffMs = now.getTime() - birthDate.getTime()
    if (diffMs > 0) {
      daysAlive = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    }
    const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    weekday = weekdays[birthDate.getDay()]
  }

  const starSign = getStarSign(month, day)
  return { hasYear: !!year, daysAlive, weekday, starSign }
}
