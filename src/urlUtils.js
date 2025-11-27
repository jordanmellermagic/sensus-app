export function summarizeUrl(url) {
  if (!url) return null;
  try {
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    let searchTerm = "";
    if (u.searchParams.has("q")) {
      searchTerm = u.searchParams.get("q") || "";
    } else if (u.pathname && u.pathname !== "/") {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length) {
        searchTerm = decodeURIComponent(parts[parts.length - 1].replace(/[-_]/g, " "));
      }
    }
    return { host, searchTerm: searchTerm || null };
  } catch {
    return { host: url, searchTerm: null };
  }
}
