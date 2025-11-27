export function parseUrlInfo(raw) {
  if (!raw) return { domain: null, search: null, page: null }
  let url = raw.trim()
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url
  }
  try {
    const u = new URL(url)
    const domain = u.hostname.replace(/^www\./, '')

    const query = u.searchParams.get('q') || u.searchParams.get('query')
    let search = query || null

    if (!search && /google\./.test(domain)) {
      const path = decodeURIComponent(u.pathname || '')
      const m = path.match(/search\/([^/]+)/i)
      if (m && m[1]) search = m[1].replace(/\+/g, ' ')
    }

    let page = null
    if (!search) {
      const pathParts = u.pathname.split('/').filter(Boolean)
      if (pathParts.length > 0) {
        page = decodeURIComponent(pathParts[pathParts.length - 1])
      }
    }

    return { domain, search, page }
  } catch {
    return { domain: raw, search: null, page: null }
  }
}
