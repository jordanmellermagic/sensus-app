function parseBirthdayString(birthday) {
  if (!birthday) return null
  const parts = birthday.split('-').map((p) => p.trim())
  if (parts.length === 3) {
    const [year, month, day] = parts
    const y = parseInt(year, 10)
    const m = parseInt(month, 10)
    const d = parseInt(day, 10)
    if (!y || !m || !d) return null
    return { year: y, month: m, day: d }
  }
  if (parts.length === 2) {
    const [month, day] = parts
    const m = parseInt(month, 10)
    const d = parseInt(day, 10)
    if (!m || !d) return null
    return { year: null, month: m, day: d }
  }
  return null
}

function computeStarSign(month, day) {
  const md = month * 100 + day
  if (md >= 321 && md <= 419) return 'Aries'
  if (md >= 420 && md <= 520) return 'Taurus'
  if (md >= 521 && md <= 620) return 'Gemini'
  if (md >= 621 && md <= 722) return 'Cancer'
  if (md >= 723 && md <= 822) return 'Leo'
  if (md >= 823 && md <= 922) return 'Virgo'
  if (md >= 923 && md <= 1022) return 'Libra'
  if (md >= 1023 && md <= 1121) return 'Scorpio'
  if (md >= 1122 && md <= 1221) return 'Sagittarius'
  if (md >= 1222 || md <= 119) return 'Capricorn'
  if (md >= 120 && md <= 218) return 'Aquarius'
  if (md >= 219 && md <= 320) return 'Pisces'
  return null
}

export function computeExtras(birthday) {
  const parsed = parseBirthdayString(birthday)
  if (!parsed) {
    return {
      hasYear: false,
      starSign: null,
      daysAlive: null,
      weekday: null,
    }
  }
  const { year, month, day } = parsed
  const starSign = computeStarSign(month, day)

  if (!year) {
    return {
      hasYear: false,
      starSign,
      daysAlive: null,
      weekday: null,
    }
  }

  const birthDate = new Date(year, month - 1, day)
  if (Number.isNaN(birthDate.getTime())) {
    return {
      hasYear: false,
      starSign,
      daysAlive: null,
      weekday: null,
    }
  }

  const now = new Date()
  const diffMs = now.getTime() - birthDate.getTime()
  const daysAlive = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const weekday = birthDate.toLocaleDateString(undefined, { weekday: 'long' })

  return {
    hasYear: true,
    starSign,
    daysAlive,
    weekday,
  }
}
