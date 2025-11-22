import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useUserData } from "../hooks/useUserData.js";
import { postUser } from "../api/client.js";

const UserDataContext = createContext(null);

export function UserDataProvider({ children }) {
  const [userId, setUserId] = useState("");
  const [hasRequestedNotification, setHasRequestedNotification] =
    useState(false);
  const [userIdJustChanged, setUserIdJustChanged] = useState(null);
  const { data, isLoading, error, isOffline } = useUserData(userId, 1000);
  const lastNoteNameRef = useRef(null);

  // Load saved ID on startup
  useEffect(() => {
    const stored = window.localStorage.getItem("sensus_user_id");
    if (stored) setUserId(stored);
  }, []);

  // Whenever the userId changes → persist it and create the user in API
  useEffect(() => {
    if (!userId) return;

    // Save locally
    window.localStorage.setItem("sensus_user_id", userId);

    // Show confirmation bubble
    setUserIdJustChanged(userId);
    const timeout = setTimeout(() => setUserIdJustChanged(null), 2000);

    // 🔥 CREATE USER IN API AUTOMATICALLY
    (async () => {
      try {
        await postUser(userId, {
          first_name: "",
          last_name: "",
          phone_number: "",
          birthday: "",
          days_alive: 0,
          address: "",
          note_name: "",
          screenshot_base64: "",
          command: ""
        });
      } catch (err) {
        console.error("Failed to create user record:", err);
      }
    })();

    return () => clearTimeout(timeout);
  }, [userId]);

  // Detect note_name changes and notify
  useEffect(() => {
    if (!data) return;

    const current = data.note_name;
    const prev = lastNoteNameRef.current;
    lastNoteNameRef.current = current;

    if (current && current !== prev) {
      maybeNotifyNoteName(current, setHasRequestedNotification);
    }
  }, [data]);

  const value = {
    userId,
    setUserId,
    userData: data,
    isLoading,
    error,
    isOffline,
    userIdJustChanged,
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
}

// Notification helper
function maybeNotifyNoteName(noteName, setHasRequestedNotification) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification("New note", { body: noteName });
    return;
  }

  if (Notification.permission === "default") {
    setHasRequestedNotification((requested) => {
      if (requested) return requested;
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          new Notification("New note", { body: noteName });
        }
      });
      return true;
    });
  }
}

export function useUserDataContext() {
  const ctx = useContext(UserDataContext);
  if (!ctx)
    throw new Error("useUserDataContext must be used inside UserDataProvider");
  return ctx;
}
