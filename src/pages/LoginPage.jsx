import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api.js";
import { useAuth } from "../authContext.jsx";

export default function LoginPage() {
  const { login: setAuth } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!userId || !password) {
      setError("Enter your user ID and password.");
      return;
    }
    try {
      setSubmitting(true);
      await login(userId, password);
      setAuth(userId);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="card w-full max-w-sm px-6 py-7">
        <div className="flex flex-col items-center mb-6">
          <div className="sensus-logo">SENSUS</div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-400 mb-1">
              User ID
            </div>
            <input
              className="w-full rounded-full border border-neutral-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-neutral-300"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-400 mb-1">
              Password
            </div>
            <input
              className="w-full rounded-full border border-neutral-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-neutral-300"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <div className="text-xs text-red-400">{error}</div>}
          <button
            type="submit"
            className="w-full pill-btn pill-btn-primary mt-2"
            disabled={submitting}
          >
            {submitting ? "Logging in…" : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}
