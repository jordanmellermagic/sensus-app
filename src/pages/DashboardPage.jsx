import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../authContext.jsx";
import { resetAll } from "../api.js";

export default function DashboardPage() {
  const { userId, logout } = useAuth();
  const navigate = useNavigate();

  async function handleReset() {
    if (!window.confirm("Reset all data for this user?")) return;
    try {
      await resetAll(userId);
      window.alert("App data reset.");
    } catch (err) {
      console.error(err);
      window.alert(err.message || "Failed to reset.");
    }
  }

  return (
    <div className="app-shell">
      <div className="card">
        <h1 className="app-title">Sensus</h1>
        <p className="app-subtitle">Logged in as {userId || "unknown"}</p>

        <div className="section-title">Peeks</div>
        <div className="dashboard-grid">
          <button
            className="tile-button"
            onClick={() => navigate("/peek")}
          >
            <span>Peek Screen</span>
          </button>
          <button
            className="tile-button"
            onClick={() => navigate("/spectator")}
          >
            <span>Spectator Data</span>
          </button>
        </div>

        <div className="section-title">App controls</div>
        <div className="dashboard-grid">
          <button
            className="tile-button"
            onClick={() => navigate("/settings")}
          >
            <span>Settings</span>
          </button>
          <button
            className="tile-button tile-button-danger"
            onClick={handleReset}
          >
            <span>Reset App</span>
          </button>
        </div>

        <div className="dashboard-footer">
          <button
            className="link-like"
            onClick={() => {
              logout();
              navigate("/", { replace: true });
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
