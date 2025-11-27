import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../authContext.jsx";
import { resetAll } from "../api.js";

export default function DashboardPage() {
  const { userId, logout } = useAuth();
  const navigate = useNavigate();
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");

  async function handleReset() {
    if (!userId) return;
    const ok = window.confirm("Reset app for this user? This will clear all data.");
    if (!ok) return;
    try {
      setError("");
      setResetting(true);
      await resetAll(userId);
    } catch (e) {
      setError(e.message || "Reset failed");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center pt-20 px-4">
      <div className="flex flex-col items-center mb-10">
        <div className="sensus-logo">SENSUS</div>
        <div className="text-xs text-neutral-400 mt-2">
          Logged in as <span className="font-semibold">{userId}</span>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-8">
        <div className="flex flex-col items-center space-y-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
            Peeks
          </div>
          <div className="flex space-x-3">
            <button
              className="pill-btn"
              onClick={() => navigate("/peek")}
            >
              Peek Screen
            </button>
            <button
              className="pill-btn"
              onClick={() => navigate("/spectator")}
            >
              Spectator Data
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
            App Controls
          </div>
          <div className="flex space-x-3">
            <button
              className="pill-btn"
              onClick={() => navigate("/settings")}
            >
              Settings
            </button>
            <button
              className="pill-btn pill-btn-danger"
              onClick={handleReset}
              disabled={resetting}
            >
              {resetting ? "Resetting…" : "Reset App"}
            </button>
          </div>
        </div>

        <button
          className="pill-btn text-xs mt-6"
          onClick={() => {
            logout();
            navigate("/", { replace: true });
          }}
        >
          Log Out
        </button>

        {error && <div className="text-xs text-red-400 mt-2">{error}</div>}
      </div>
    </div>
  );
}
