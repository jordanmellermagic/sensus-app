import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../authContext.jsx";
import { resetAll } from "../api.js";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { userId, logout } = useAuth();
  const [resetting, setResetting] = React.useState(false);
  const [message, setMessage] = React.useState("");

  async function handleReset() {
    if (!window.confirm("Reset all data for this user?")) return;
    setResetting(true);
    setMessage("");
    try {
      await resetAll(userId);
      setMessage("All data cleared.");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setMessage(err.message || "Reset failed");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="screen screen-center">
      <div className="dashboard">
        <div className="logo-title">S E N S U S</div>
        <p className="subtitle">Logged in as {userId}</p>

        <div className="section-label">Peeks</div>
        <div className="button-row">
          <button
            className="btn large"
            onClick={() => navigate("/peek")}
          >
            Peek Screen
          </button>
          <button
            className="btn large"
            onClick={() => navigate("/spectator")}
          >
            Spectator Data
          </button>
        </div>

        <div className="section-label">App Controls</div>
        <div className="button-row">
          <button
            className="btn large"
            onClick={() => navigate("/settings")}
          >
            Settings
          </button>
          <button
            className="btn large danger"
            onClick={handleReset}
            disabled={resetting}
          >
            {resetting ? "Resetting..." : "Reset App"}
          </button>
        </div>

        {message && <div className="message">{message}</div>}

        <button className="btn ghost wide logout" onClick={logout}>
          Log Out
        </button>
      </div>
    </div>
  );
}