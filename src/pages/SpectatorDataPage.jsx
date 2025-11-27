import React from "react";
import { useAuth } from "../authContext.jsx";
import { fetchDataPeek } from "../api.js";

function formatBirthday(birthday) {
  if (!birthday) return "";
  try {
    const d = new Date(birthday);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }
  } catch (e) {}
  return birthday;
}

export default function SpectatorDataPage() {
  const { userId } = useAuth();
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState("");
  const [lastUpdated, setLastUpdated] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    let timer;

    async function poll() {
      try {
        const res = await fetchDataPeek(userId);
        if (!cancelled) {
          setData(res || null);
          setError("");
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to fetch data");
        }
      } finally {
        if (!cancelled) {
          timer = setTimeout(poll, 1000);
        }
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [userId]);

  const hasData =
    data &&
    (Object.keys(data).length > 0 ||
      (Array.isArray(data.items) && data.items.length > 0));

  const birthday =
    data?.birthday ||
    data?.birthdate ||
    data?.dob ||
    (data?.person && (data.person.birthday || data.person.birthdate));

  const note = data?.note || data?.notes || data?.prediction;
  const url = data?.url || data?.website;
  const contact =
    data?.contact ||
    (data?.person && (data.person.name || data.person.contact));

  return (
    <div className="screen">
      <header className="top-bar">
        <div className="logo-small">Sensus</div>
        <div className="top-bar-sub">Spectator Data</div>
      </header>

      <main className="content">
        {!hasData && !error && (
          <div className="empty-state">
            <p>No spectator data yet.</p>
            <p className="muted">
              Once the routine begins and data is received, it will appear here
              automatically.
            </p>
          </div>
        )}

        {hasData && (
          <div className="spectator-card">
            {birthday && (
              <div className="info-row">
                <div className="label">Birthday</div>
                <div className="value">{formatBirthday(birthday)}</div>
              </div>
            )}
            {contact && (
              <div className="info-row">
                <div className="label">Contact</div>
                <div className="value">{contact}</div>
              </div>
            )}
            {url && (
              <div className="info-row">
                <div className="label">URL</div>
                <div className="value">
                  <a href={url} target="_blank" rel="noreferrer">
                    {url}
                  </a>
                </div>
              </div>
            )}
            {note && (
              <div className="info-row note">
                <div className="label">Note</div>
                <div className="value">{note}</div>
              </div>
            )}

            {(!birthday || !contact || !url || !note) && (
              <details className="raw-details">
                <summary>Raw data</summary>
                <pre>{JSON.stringify(data, null, 2)}</pre>
              </details>
            )}
          </div>
        )}

        {error && <div className="error bottom">{error}</div>}
        {lastUpdated && (
          <div className="muted bottom">
            Last updated:{" "}
            {lastUpdated.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            })}
          </div>
        )}
      </main>
    </div>
  );
}