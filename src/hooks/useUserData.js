import { useEffect, useState, useRef } from "react";
import { getUser, postUser, createUserIfNotExists } from "../api/client";

export function useUserData(userId, pollingInterval = 2000) {
  const [userData, setUserData] = useState(null);
  const pollingRef = useRef(null);

  // 🔥 NEW MERGE LOGIC
  function mergeUserData(prev, next) {
    if (!next) return prev;
    if (!prev) return next;

    // If clearSpectator flag is present, wipe only spectator fields
    if (next._clearSpectator) {
      return {
        ...prev,
        first_name: "",
        last_name: "",
        phone_number: "",
        birthday: "",
        days_alive: 0,
        address: "",
        // preserve these
        note_name: prev.note_name,
        screenshot_base64: prev.screenshot_base64,
        command: prev.command,
      };
    }

    // Normal merge for live updates
    const merged = { ...prev };

    for (const key of Object.keys(next)) {
      const newVal = next[key];
      const oldVal = prev[key];

      if (typeof newVal === "string") {
        merged[key] = newVal.trim() !== "" ? newVal : oldVal;
      } else if (newVal !== undefined && newVal !== null) {
        merged[key] = newVal;
      } else {
        merged[key] = oldVal;
      }
    }

    return merged;
  }

  // Load once when userId changes
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function load() {
      const data = await createUserIfNotExists(userId);
      if (!cancelled) {
        setUserData((prev) => mergeUserData(prev, data));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Polling for updates
  useEffect(() => {
    if (!userId) return;

    pollingRef.current = setInterval(async () => {
      try {
        const data = await getUser(userId);
        setUserData((prev) => mergeUserData(prev, data));
      } catch (e) {
        console.warn("Polling failed", e);
      }
    }, pollingInterval);

    return () => clearInterval(pollingRef.current);
  }, [userId, pollingInterval]);

  return { userData, setUserData, refresh: () => createUserIfNotExists(userId) };
}
