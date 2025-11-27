import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../authContext.jsx";
import { fetchDataPeek, clearDataPeek } from "../api.js";

function formatBirthday(data) {
  if (!data || !data.birthday) return null;
  return data.birthday;
}

export default function SpectatorDataPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [raw, setRaw] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const result = await fetchDataPeek(userId);
        if (cancelled) return;
        if (result) {
          setData(result);
          setRaw(JSON.stringify(result, null, 2));
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error("spectator poll error", err);
      }
    }

    poll();
    const id = setInterval(poll, 1500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [userId]);

  async function handleClear() {
    try {
      await clearDataPeek(userId);
      setData(null);
      setRaw("");
    } catch (err) {
      console.error(err);
      window.alert(err.message || "Failed to clear.");
    }
  }

  const birthday = formatBirthday(data);

  return (
    <div className="app-shell">
      <div className="card">
        <h1 className="app-title">Sensus</h1>
        <p className="app-subtitle">Spectator Data</p>

        {data ? (
          <>
            {birthday && (
              <>
                <div className="section-title">Birthday</div>
                <p style={{ marginTop: 4 }}>{birthday}</p>
              </>
            )}

            <div className="section-title">Raw data</div>
            <div className="spectator-json">{raw}</div>
          </>
        ) : (
          <p className="meta-text">
            Waiting for spectator data… ask them to enter their details on the
            phone.
          </p>
        )}

        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => navigate("/dashboard")}
          >
            Back
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={handleClear}
          >
            Clear
          </button>
        </div>

        {lastUpdated && (
          <p className="meta-text" style={{ marginTop: 8 }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
