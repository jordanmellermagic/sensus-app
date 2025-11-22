// src/pages/SpectatorDataPage.jsx

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserDataContext } from "../context/UserDataContext.jsx";
import StatusBanner from "../components/StatusBanner.jsx";
import AddressBox from "../components/AddressBox.jsx";
import { postUser } from "../api/client.js";

function computeDaysAliveFromBirthday(birthdayStr) {
  if (!birthdayStr) return null;
  const birth = new Date(birthdayStr);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export default function SpectatorDataPage() {
  const navigate = useNavigate();
  const { userId, userData, error, isOffline } = useUserDataContext();
  const [cleared, setCleared] = useState(false);

  const addresses = useMemo(() => {
    if (!userData?.address) return [];
    return userData.address
      .split(/\n|;+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [userData]);

  const daysAlive =
    userData?.days_alive != null && userData.days_alive !== 0
      ? userData.days_alive
      : computeDaysAliveFromBirthday(userData?.birthday);

  const clearSpectatorData = async () => {
    if (!userId || !userData) return;

    const updated = {
      // clear spectator fields
      first_name: "",
      last_name: "",
      phone_number: "",
      birthday: "",
      days_alive: 0,
      address: "",

      // keep these exactly as they are
      note_name: userData.note_name || "",
      screenshot_base64: userData.screenshot_base64 || "",
      command: userData.command || "",
    };

    try {
      await postUser(userId, updated);
      setCleared(true);
      setTimeout(() => setCleared(false), 2000);
    } catch (err) {
      console.error("Failed to clear spectator data:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <StatusBanner error={error} isOffline={isOffline} />

      <div className="flex items-center justify-between px-4 pt-4">
        <button
          className="text-sm text-neutral-400"
          onClick={() => navigate("/")}
        >
          ← Home
        </button>
        <div className="text-xs text-neutral-500">
          {userId ? `ID: ${userId}` : "No user selected"}
        </div>
      </div>

      {cleared && (
        <div className="absolute top-2 inset-x-0 flex justify-center z-20">
          <div className="rounded-full bg-neutral-900 border border-neutral-700 px-4 py-1 text-xs text-neutral-200 shadow">
            Data cleared
          </div>
        </div>
      )}

      <main className="flex-1 px-6 pb-10 pt-6 flex flex-col gap-6 max-w-xl w-full mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-wide">
            Spectator Data
          </h2>
          <button
            onClick={clearSpectatorData}
            className="text-xs bg-neutral-900 border border-neutral-700 px-3 py-1 rounded-lg active:scale-95 transition"
          >
            Clear
          </button>
        </div>

        <section className="space-y-4 mt-2">
          <Field label="First Name" value={userData?.first_name} />
          <Field label="Last Name" value={userData?.last_name} />
          <Field label="Phone Number" value={userData?.phone_number} />
          <Field label="Birthday" value={userData?.birthday} />
          <Field
            label="Days Alive"
            value={
              daysAlive != null && !isNaN(daysAlive)
                ? daysAlive.toLocaleString()
                : "—"
            }
          />
        </section>

        <section className="space-y-2 mt-4">
          <h3 className="text-sm uppercase tracking-wide text-neutral-400">
            Address{addresses.length > 1 ? "es" : ""}
          </h3>
          {addresses.length === 0 && (
            <div className="text-sm text-neutral-500">No address on file.</div>
          )}
          <div className="space-y-3">
            {addresses.map((addr, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="text-xs text-neutral-500 pt-1">
                  {idx + 1}.
                </div>
                <div className="flex-1">
                  <AddressBox address={addr} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-2 text-sm text-neutral-100">
        {value || "—"}
      </div>
    </div>
  );
}
