import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../authContext.jsx";
import { changePassword } from "../api.js";

export default function SettingsPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    if (!oldPassword || !newPassword) {
      setMessage("Fill in both fields.");
      return;
    }
    setLoading(true);
    try {
      await changePassword(userId, oldPassword, newPassword);
      setMessage("Password updated.");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="card">
        <h1 className="app-title">Sensus</h1>
        <p className="app-subtitle">Settings</p>

        <form onSubmit={handleSubmit}>
          <div className="input-row">
            <label className="label" htmlFor="oldPassword">
              Old password
            </label>
            <input
              id="oldPassword"
              className="input"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </div>

          <div className="input-row">
            <label className="label" htmlFor="newPassword">
              New password
            </label>
            <input
              id="newPassword"
              className="input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <button
            className="button button-block"
            type="submit"
            disabled={loading}
          >
            {loading ? "Saving…" : "Save changes"}
          </button>
        </form>

        {message && (
          <p className="meta-text" style={{ marginTop: 12 }}>
            {message}
          </p>
        )}

        <button
          className="link-like"
          style={{ marginTop: 14 }}
          onClick={() => navigate("/dashboard")}
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}
