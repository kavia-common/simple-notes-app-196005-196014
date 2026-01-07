const DEFAULT_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

function getBaseUrl() {
  // Per requirement: prefer REACT_APP_API_BASE, fallback to REACT_APP_BACKEND_URL
  const fromApiBase = process.env.REACT_APP_API_BASE;
  const fromBackendUrl = process.env.REACT_APP_BACKEND_URL;

  const raw = (fromApiBase || fromBackendUrl || "").trim();
  if (!raw) return "";

  // Normalize: remove trailing slashes
  return raw.replace(/\/+$/, "");
}

async function requestJson(path, options = {}) {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    const err = new Error("Missing API base URL environment variable.");
    err.isNetworkOrServerError = true;
    throw err;
  }

  const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        ...DEFAULT_HEADERS,
        ...(options.headers || {}),
      },
    });
  } catch (e) {
    // network errors, CORS, DNS, etc.
    const err = new Error(e?.message || "Network error");
    err.isNetworkOrServerError = true;
    throw err;
  }

  // If backend returns non-OK, treat as backend unavailable for fallback purposes
  // (requirement: "network error or non-OK responses")
  if (!res.ok) {
    const err = new Error(`API error (${res.status})`);
    err.status = res.status;
    err.isNetworkOrServerError = true;
    try {
      err.body = await res.text();
    } catch {
      // ignore
    }
    throw err;
  }

  // Some endpoints may return empty body (e.g. DELETE)
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// PUBLIC_INTERFACE
export async function listNotes() {
  /** Fetch all notes from backend. Returns array of notes. */
  return requestJson("/notes", { method: "GET" });
}

// PUBLIC_INTERFACE
export async function createNote(payload) {
  /** Create a note {title, content}. Returns created note. */
  return requestJson("/notes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// PUBLIC_INTERFACE
export async function updateNote(id, payload) {
  /** Update note by id. Returns updated note. */
  return requestJson(`/notes/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// PUBLIC_INTERFACE
export async function deleteNote(id) {
  /** Delete note by id. Returns null or backend response. */
  return requestJson(`/notes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
