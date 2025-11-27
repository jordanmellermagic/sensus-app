import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../authContext.jsx";
import { changePassword } from "../api.js";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    if (!oldPassword || !newPassword) {
      setMessage("Enter both old and new password.");
      return;
    }
    try {
      setSaving(true);
      await changePassword(userId, oldPassword, newPassword);
      setMessage("Password updated.");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      setMessage(err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 pt-6">
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <button onClick={() => navigate("/dashboard")}>← Home</button>
        <div className="w-8" />
      </div>

      <div className="mt-8 text-center text-lg font-medium">Settings</div>

      <div className="max-w-md mx-auto mt-10 card px-5 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-400 mb-1">
              Old Password
            </div>
            <input
              className="w-full rounded-full border border-neutral-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-neutral-300"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-400 mb-1">
              New Password
            </div>
            <input
              className="w-full rounded-full border border-neutral-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-neutral-300"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          {message && (
            <div className="text-xs text-neutral-300">{message}</div>
          )}
          <button
            type="submit"
            className="w-full pill-btn pill-btn-primary"
            disabled={saving}
          >
            {saving ? "Saving…" : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
