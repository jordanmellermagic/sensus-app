// src/pages/HomePage.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserDataContext } from "../context/UserDataContext.jsx";
import StatusBanner from "../components/StatusBanner.jsx";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function HomePage() {
  const navigate = useNavigate();
  const { userId, setUserId, error, isOffline } = useUserDataContext();

  // Login state
  const [localId, setLocalId] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  // Admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [adminUserId, setAdminUserId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminStatus, setAdminStatus] = useState("");
  const [adminError, setAdminError] = useState("");

  const loggedIn = Boolean(userId);

  const handleLogin = async () => {
    setLoginError("");
    setAdminStatus("");

    if (!API_BASE) {
      setLoginError("API base URL not set.");
      return;
    }

    if (!localId.trim() || !password.trim()) {
      setLoginError("Enter both fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/user/${encodeURIComponent(localId)}/change_password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            old_password: password,
            new_password: password
          })
        }
      );

      if (!res.ok) {
        if (res.status === 403) setLoginError("Incorrect password.");
        else if (res.status === 404) setLoginError("User not found.");
        else setLoginError("Unable to reach server.");
        return;
      }

      setUserId(localId);

      // Admin user?
      setIsAdmin(localId.toLowerCase() === "admin");

    } catch (err) {
      setLoginError("Unable to reach server.");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminCreate = async () => {
    setAdminError("");
    setAdminStatus("");

    if (!adminKey || !adminUserId || !adminPassword) {
      setAdminError("Fill all fields.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/auth/create_user?admin_key=${encodeURIComponent(adminKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: adminUserId,
            password: adminPassword
          })
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAdminError(json.detail || "Admin action failed.");
        return;
      }

      if (json.status === "created") {
        setAdminStatus(`User "${json.user_id}" created.`);
      } else {
        setAdminStatus(`Password updated for "${json.user_id}".`);
      }

    } catch (err) {
      setAdminError("Unable to reach server.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <StatusBanner error={error} isOffline={isOffline} />

      <div className="flex-1 flex flex-col items-center pt-20 px-6">

        {/* Header */}
        <h1 className="text-4xl font-semibold tracking-[0.25em] uppercase mb-12">
          Sensus
        </h1>

        {/* LOGIN CARD — hidden when logged in */}
        {!loggedIn && (
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-700 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase">Performer Login</h2>

            <div>
              <label className="text-xs uppercase text-neutral-400">User ID</label>
              <input
                value={localId}
                onChange={(e) => setLocalId(e.target.value)}
                className="w-full mt-1 bg-neutral-800 border border-neutral-600 rounded-xl px-4 py-2"
              />
            </div>

            <div>
              <label className="text-xs uppercase text-neutral-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 bg-neutral-800 border border-neutral-600 rounded-xl px-4 py-2"
              />
            </div>

            {loginError && (
              <div className="text-xs text-red-400">{loginError}</div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-white text-black rounded-xl py-2.5 font-medium mt-2 disabled:opacity-50"
            >
              {loading ? "Checking…" : "Log In"}
            </button>
          </div>
        )}

        {/* LOGGED IN STATUS */}
        {loggedIn && (
          <p className="text-neutral-400 text-sm mb-6">
            Logged in as <span className="text-white font-semibold">{userId}</span>
          </p>
        )}

        {/* Buttons */}
        {loggedIn && (
          <div className="w-full max-w-sm flex flex-row gap-4 mb-10">
            <button
              onClick={() => navigate("/peek")}
              className="flex-1 bg-neutral-900 border border-neutral-700 py-3 rounded-xl"
            >
              Phone Peek
            </button>

            <button
              onClick={() => navigate("/spectator")}
              className="flex-1 bg-neutral-900 border border-neutral-700 py-3 rounded-xl"
            >
              Spectator Data
            </button>
          </div>
        )}

        {/* ADMIN PANEL — ONLY FOR ADMIN LOGIN */}
        {loggedIn && isAdmin && (
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-700 rounded-2xl p-6 space-y-3 mt-4">
            <h3 className="text-xs uppercase text-neutral-400 mb-2">
              Admin: Create / Update User
            </h3>

            <input
              type="password"
              placeholder="Admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-600 rounded-xl px-4 py-2"
            />

            <input
              placeholder="User ID"
              value={adminUserId}
              onChange={(e) => setAdminUserId(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-600 rounded-xl px-4 py-2"
            />

            <input
              type="password"
              placeholder="Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-600 rounded-xl px-4 py-2"
            />

            {adminError && <div className="text-xs text-red-400">{adminError}</div>}
            {adminStatus && (
              <div className="text-xs text-emerald-400">{adminStatus}</div>
            )}

            <button
              onClick={handleAdminCreate}
              className="w-full bg-white text-black rounded-xl py-2.5 font-medium"
            >
              Create / Update User
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
