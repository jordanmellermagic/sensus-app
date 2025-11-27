import React, { useState } from "react";
import { useAuth } from "../authContext.jsx";
import { changePassword } from "../api.js";

export default function SettingsPage() {
  const { userId } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await changePassword(userId, oldPassword, newPassword);
      setMessage("Password updated.");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      setMessage(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen">
      <header className="top-bar">
        <div className="logo-small">Sensus</div>
        <div className="top-bar-sub">Settings</div>
      </header>
      <main className="content">
        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Current password</span>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>
          {message && <div className="message">{message}</div>}
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      </main>
    </div>
  );
}