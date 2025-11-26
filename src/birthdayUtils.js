export function parseBirthday(birthday) {
  if (!birthday) return null
  const trimmed = String(birthday).trim()
  // Try YYYY-MM-DD
  const fullMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (fullMatch) {
    const [_, y, m, d] = fullMatch
    return { year: Number(y), month: Number(m), day: Number(d) }
  }
  // Try MM-DD
  const mdMatch = trimmed.match(/^(\d{2})-(\d{2})$/)
  if (mdMatch) {
    const [_, m, d] = mdMatch
    return { year: null, month: Number(m), day: Number(d) }
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
  const dateValue = month * 100 + day
  for (let i = 0; i < zodiacs.length - 1; i++) {
    const [sign, sm, sd] = zodiacs[i]
    const [ , em, ed] = zodiacs[i + 1]
    const start = sm * 100 + sd
    const end = em * 100 + ed
    if (dateValue >= start && dateValue <= end) return sign
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
