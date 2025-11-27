import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../authContext.jsx";
import { login as loginApi } from "../api.js";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId || !password) {
      setError("Enter your user ID and password.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await loginApi(userId, password);
      auth.login(userId);
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="card">
        <h1 className="app-title">Sensus</h1>
        <p className="app-subtitle">Spectator control panel</p>

        <form onSubmit={handleSubmit}>
          <div className="input-row">
            <label className="label" htmlFor="userId">
              User ID
            </label>
            <input
              id="userId"
              className="input"
              autoComplete="username"
              value={userId}
              onChange={(e) => setUserId(e.target.value.trim())}
            />
          </div>

          <div className="input-row">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            className="button button-block"
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in…" : "Log In"}
          </button>

          {error && <div className="error-text">{error}</div>}
        </form>

        <p className="meta-text" style={{ marginTop: 16 }}>
          This page is only visible to you. During performance, spectators only
          ever see the black Peek Screen.
        </p>
      </div>
    </div>
  );
}
