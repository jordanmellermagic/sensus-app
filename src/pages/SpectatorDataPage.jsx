import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../authContext.jsx";
import { fetchDataPeek, clearDataPeek } from "../api.js";
import { parseBirthday, formatBirthday, zodiac, daysAlive, weekday } from "../birthdayUtils.js";

const POLL_MS = 1500;

export default function SpectatorDataPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [data, setData] = useState(null);
  const [showDetails, setShowDetails] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchDataPeek(userId);
        if (cancelled) return;
        setData(res);
      } catch {
        if (!cancelled) setData(null);
      }
    }
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [userId]);

  async function handleClear() {
    try {
      await clearDataPeek(userId);
      setData(null);
    } catch {}
  }

  const birthdayParsed = data?.birthday ? parseBirthday(data.birthday) : null;
  const birthdayDisplay = birthdayParsed ? formatBirthday(birthdayParsed) : "-";
  const z = birthdayParsed ? zodiac(birthdayParsed.month, birthdayParsed.day) : null;
  const days = birthdayParsed ? daysAlive(birthdayParsed) : null;
  const dayName = birthdayParsed ? weekday(birthdayParsed) : null;
  const hasYear = !!birthdayParsed?.year;

  const fullName =
    (data?.first_name || data?.last_name)
      ? `${data.first_name || ""} ${data.last_name || ""}`.trim()
      : "—";

  return (
    <div className="min-h-screen bg-black text-white px-4 pt-6">
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <button onClick={() => navigate("/dashboard")}>← Home</button>
        <button className="text-red-400" onClick={handleClear}>Clear</button>
      </div>

      <div className="mt-8 text-center text-lg font-medium">Spectator Data</div>

      <div className="max-w-md mx-auto mt-10 space-y-6 text-base">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
            Full Name
          </div>
          <div className="mt-1 text-lg">{fullName}</div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
            Phone Number
          </div>
          <div className="mt-1 text-lg">{data?.phone_number || "—"}</div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
            Birthday
          </div>
          <div className="mt-1 text-lg">{data?.birthday ? birthdayDisplay : "—"}</div>
          {birthdayParsed && (
            <button
              className="block mt-1 text-xs text-neutral-400"
              type="button"
              onClick={() => setShowDetails((v) => !v)}
            >
              {showDetails ? "Hide details" : "Show details"}
            </button>
          )}
          {birthdayParsed && showDetails && (
            <div className="mt-2 space-y-1 text-sm text-neutral-200">
              {z && <div>Star sign: {z}</div>}
              {hasYear && days != null && <div>Days alive: {days.toLocaleString()}</div>}
              {hasYear && dayName && <div>Day of week born: {dayName}</div>}
            </div>
          )}
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
            Address
          </div>
          <div className="mt-1 text-lg whitespace-pre-wrap">
            {data?.address && data.address.trim().length
              ? data.address
              : "No address on file."}
          </div>
        </div>
      </div>
    </div>
  );
}
