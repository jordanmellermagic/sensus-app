// src/pages/HomePage.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserDataContext } from "../context/UserDataContext.jsx";
import StatusBanner from "../components/StatusBanner.jsx";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function HomePage() {
  const navigate = useNavigate();
  const { userId, setUserId, error, isOffline, userIdJustChanged } =
    useUserDataContext();

  // Login state
  const [localId, setLocalId] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [adminUserId, setAdminUserId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminStatus, setAdminStatus] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  // When userId restored from localStorage, we treat as logged in
  useEffect(() => {
    if (userId) {
      setLocalId(userId);
    }
  }, [userId]);

  const doLogin = async () => {
    setLoginError("");
    setAdminStatus("");

    if (!API_BASE) {
      setLoginError("API base URL not set.");
      return;
    }

    const id = localId.trim();
    const pwd = password.trim();

    if (!id || !pwd) {
      setLoginError("Enter both User ID and password.");
      return;
    }

    setLoginLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/user/${encodeURIComponent(id)}/change_password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            old_password: pwd,
            new_password: pwd,
          }),
        }
      );

      if (!res.ok) {
        if (res.status === 403) setLoginError("Incorrect password.");
        else if (res.status === 404) setLoginError("User not found.");
        else setLoginError("Unable to reach server.");
        return;
      }

      // success
      setUserId(id);

      // If this user IS the admin account → reveal admin panel
      setIsAdmin(id.toLowerCase() === "admin");

    } catch (err) {
      setLoginError("Unable to read server.");
      console.error(err);
    } finally {
      setLoginLoading(false);
    }
  };

  const doAdminCreate = async () => {
    setAdminError("");
    setAdminStatus("");

    if (!adminKey.trim() || !adminUserId.trim() || !adminPassword.trim()) {
      setAdminError("Fill out all fields.");
      return;
    }

    setAdminLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/auth/create_user?admin_key=${encodeURIComponent(adminKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: adminUserId.trim(),
            password: adminPassword.trim(),
          }),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAdminError(json.detail || "Admin request failed.");
        return;
      }

      if (json.status === "created") {
        setAdminStatus(`Created user "${json.user_id}"`);
      } else if (json.status === "updated") {
        setAdminStatus(`Updated password for "${json.user_id}"`);
      } else {
        setAdminStatus("Success.");
      }
    } catch (err) {
      setAdminError("Unable to reach server.");
    } finally {
      setAdminLoading(false);
    }
  };

  const loggedIn = Boolean(userId);

  const canNavigate = loggedIn;

  return (
    <div className="min-h-screen flex flex-col bg-black text-white relative">
      <StatusBanner error={error} isOffline={isOffline} />

      {/* ID saved pill */}
      {userIdJustChanged && (
        <div className="absolute top-2 inset-x-0 flex justify-center z-20">
          <div className="rounded-full bg-neutral-900 border border-neutral-700 px-4 py-1 text-xs text-neutral-200 shadow">
            Logged in as <span className="font-semibold">{userIdJustChanged}</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-start pt-16 px-6 gap-10">

        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl font-semibold tracking-[0.25em] uppercase">
            Sensus
          </h1>
          <p className="mt-2 text-xs text-neutral-500 uppercase tracking-wide">
            Login
          </p>
        </header>

        {/* LOGIN CARD — hidden when logged in */}
        {!loggedIn && (
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900/60 border border-neutral-800 px-4 py-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase text-neutral-300">
              Performer Login
            </h2>

            <label className="text-xs uppercase text-neutral-400">User ID</label>
            <input
              value={localId}
              onChange={(e) => setLocalId(e.target.value)}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 outline-none focus:border-blue-500"
            />

            <label className="text-xs uppercase text-neutral-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 outline-none focus:border-blue-500"
            />

            {loginError && <div className="text-xs text-red-400">{loginError}</div>}

            <button
              onClick={doLogin}
              disabled={loginLoading}
              className="mt-2 w-full rounded-xl bg-neutral-100 text-black py-2.5 text-sm font-medium disabled:opacity-50"
            >
              {loginLoading ? "Checking…" : "Log In"}
            </button>
          </div>
        )}

        {/* LOGGED IN DISPLAY */}
        {loggedIn && (
          <div className="text-center text-neutral-400 text-sm mb-[-20px]">
            Logged in as <span className="font-semibold">{userId}</span>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="w-full max-w-sm flex flex-row gap-4 mt-6">
          <button
            disabled={!canNavigate}
            onClick={() => navigate("/peek")}
            className="flex-1 rounded-2xl py-4 text-sm font-semibold border border-neutral-700 bg-neutral-900 disabled:opacity-40"
          >
            Phone Peek
          </button>

          <button
            disabled={!canNavigate}
            onClick={() => navigate("/spectator")}
            className="flex-1 rounded-2xl py-4 text-sm font-semibold border border-neutral-700 bg-neutral-900 disabled:opacity-40"
          >
            Spectator Data
          </button>
        </div>

        {/* ADMIN PANEL — only visible for admin user */}
        {loggedIn && isAdmin && (
          <div className="w-full max-w-sm rounded-2xl bg-neutral-950/80 border border-neutral-800 px-4 py-4 space-y-2 mt-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-400">
              Admin: Create / Update User
            </h3>

            <label className="text-[11px] text-neutral-500 uppercase">Admin Key</label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-2"
            />

            <label className="text-[11px] text-neutral-500 uppercase">User ID</label>
            <input
              value={adminUserId}
              onChange={(e) => setAdminUserId(e.target.value)}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-2"
            />

            <label className="text-[11px] text-neutral-500 uppercase">Password</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-2"
            />

            {adminError && <div className="text-[11px] text-red-400">{adminError}</div>}
            {adminStatus && (
              <div className="text-[11px] text-emerald-400">{adminStatus}</div>
            )}

            <button
              onClick={doAdminCreate}
              disabled={adminLoading}
              className="mt-1 w-full rounded-xl bg-neutral-100 text-black py-2 text-xs font-semibold disabled:opacity-50"
            >
              {adminLoading ? "Saving…" : "Create / Update User"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
