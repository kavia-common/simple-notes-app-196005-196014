const STORAGE_KEY = "simple-notes-app:notes:v1";

function safeParse(json, fallback) {
  try {
    const parsed = JSON.parse(json);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  // Use crypto.randomUUID when available; otherwise fallback to timestamp+random.
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readAll() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const notes = safeParse(raw || "[]", []);
  return Array.isArray(notes) ? notes : [];
}

function writeAll(notes) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// PUBLIC_INTERFACE
export function localListNotes() {
  /** List notes from localStorage. */
  const notes = readAll();
  // Sort by updatedAt desc, then createdAt desc
  return notes.sort((a, b) => {
    const au = a.updatedAt || a.createdAt || "";
    const bu = b.updatedAt || b.createdAt || "";
    return bu.localeCompare(au);
  });
}

// PUBLIC_INTERFACE
export function localCreateNote({ title, content }) {
  /** Create note in localStorage. Returns created note. */
  const notes = readAll();
  const created = {
    id: makeId(),
    title: title ?? "",
    content: content ?? "",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  writeAll([created, ...notes]);
  return created;
}

// PUBLIC_INTERFACE
export function localUpdateNote(id, { title, content }) {
  /** Update note in localStorage. Returns updated note. */
  const notes = readAll();
  const idx = notes.findIndex((n) => String(n.id) === String(id));
  if (idx === -1) {
    const err = new Error("Note not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const updated = {
    ...notes[idx],
    title: title ?? "",
    content: content ?? "",
    updatedAt: nowIso(),
  };

  const next = [...notes];
  next[idx] = updated;
  writeAll(next);
  return updated;
}

// PUBLIC_INTERFACE
export function localDeleteNote(id) {
  /** Delete note from localStorage. Returns true if removed. */
  const notes = readAll();
  const next = notes.filter((n) => String(n.id) !== String(id));
  writeAll(next);
  return next.length !== notes.length;
}

// PUBLIC_INTERFACE
export function localClearAllNotes() {
  /** Utility to clear local notes (not used by UI, but handy for debugging). */
  window.localStorage.removeItem(STORAGE_KEY);
}
