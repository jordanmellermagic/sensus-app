import { API_BASE } from "../api/client";

export async function requestNotificationPermission() {
  const result = await Notification.requestPermission();
  return result === "granted";
}

export async function subscribeToPush() {
  if (!("serviceWorker" in navigator)) {
    console.warn("No service worker support");
    return null;
  }

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
  });

  // Send subscription to backend
  await fetch(`${API_BASE}/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription }),
  });

  return subscription;
}
