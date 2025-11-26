// src/api/client.js

const API_BASE = import.meta.env.VITE_API_BASE;

if (!API_BASE) {
  console.warn("VITE_API_BASE is not set; API calls will fail.");
}

// Generic GET helper
async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
  });

  if (!res.ok) {
    const message = await safeError(res);
    throw new Error(message);
  }

  return res.json();
}

// Generic JSON POST helper
async function apiPost(path, bodyObj) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyObj),
  });

  if (!res.ok) {
    const message = await safeError(res);
    throw new Error(message);
  }

  return res.json();
}

// Multi-part POST helper (for screenshots)
async function apiPostForm(path, formData) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const message = await safeError(res);
    throw new Error(message);
  }

  return res.json();
}

// Helper for readable errors
async function safeError(res) {
  try {
    const j = await res.json();
    return j.detail || JSON.stringify(j);
  } catch {}
  return `HTTP ${res.status}`;
}

/* -------------------------------------------------------
   AUTH
------------------------------------------------------- */

export async function changePassword(userId, oldPassword, newPassword) {
  return apiPost(`/user/${encodeURIComponent(userId)}/change_password`, {
    old_password: oldPassword,
    new_password: newPassword,
  });
}

export async function adminCreateUser(adminKey, userId, password) {
  return apiPost(
    `/auth/create_user?admin_key=${encodeURIComponent(adminKey)}`,
    {
      user_id: userId,
      password,
    }
  );
}

/* -------------------------------------------------------
   DATA PEEK
------------------------------------------------------- */

export async function getDataPeek(userId) {
  return apiGet(`/data_peek/${encodeURIComponent(userId)}`);
}

export async function updateDataPeek(userId, data) {
  return apiPost(`/data_peek/${encodeURIComponent(userId)}`, data);
}

export async function clearDataPeek(userId) {
  return apiPost(`/data_peek/${encodeURIComponent(userId)}/clear`, {});
}

/* -------------------------------------------------------
   NOTE PEEK
------------------------------------------------------- */

export async function getNotePeek(userId) {
  return apiGet(`/note_peek/${encodeURIComponent(userId)}`);
}

export async function updateNotePeek(userId, data) {
  return apiPost(`/note_peek/${encodeURIComponent(userId)}`, data);
}

export async function clearNotePeek(userId) {
  return apiPost(`/note_peek/${encodeURIComponent(userId)}/clear`, {});
}

/* -------------------------------------------------------
   SCREEN PEEK
------------------------------------------------------- */

export async function getScreenPeek(userId) {
  return apiGet(`/screen_peek/${encodeURIComponent(userId)}`);
}

export async function updateScreenPeek(userId, { contact, url, file }) {
  const form = new FormData();

  if (contact !== undefined) form.append("contact", contact);
  if (url !== undefined) form.append("url", url);
  if (file) form.append("screenshot", file);

  return apiPostForm(`/screen_peek/${encodeURIComponent(userId)}`, form);
}

export async function clearScreenPeek(userId) {
  return apiPost(`/screen_peek/${encodeURIComponent(userId)}/clear`, {});
}

/* -------------------------------------------------------
   COMMANDS
------------------------------------------------------- */

export async function getCommands(userId) {
  return apiGet(`/commands/${encodeURIComponent(userId)}`);
}

export async function updateCommands(userId, command) {
  return apiPost(`/commands/${encodeURIComponent(userId)}`, {
    command,
  });
}

export async function clearCommands(userId) {
  return apiPost(`/commands/${encodeURIComponent(userId)}/clear`, {});
}
