import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as api from "../api/notesApi";
import {
  localCreateNote,
  localDeleteNote,
  localListNotes,
  localUpdateNote,
} from "../utils/localNotesStore";

function normalizeNote(note) {
  // Ensure we always have id/title/content at minimum
  return {
    id: note.id,
    title: note.title ?? "",
    content: note.content ?? "",
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

function sortNotes(notes) {
  return [...notes].sort((a, b) => {
    const au = a.updatedAt || a.createdAt || "";
    const bu = b.updatedAt || b.createdAt || "";
    return bu.localeCompare(au);
  });
}

function createToast(type, message) {
  return { id: `${Date.now()}_${Math.random().toString(16).slice(2)}`, type, message };
}

// PUBLIC_INTERFACE
export function useNotes() {
  /** Notes CRUD state + offline fallback. */
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Avoid repeated "switch to offline" toasts
  const hasAnnouncedOffline = useRef(false);

  const addToast = useCallback((type, message, { persistent = false } = {}) => {
    const toast = { ...createToast(type, message), persistent };
    setToasts((prev) => [...prev, toast]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const announceOfflineOnce = useCallback(() => {
    if (hasAnnouncedOffline.current) return;
    hasAnnouncedOffline.current = true;
    addToast("info", "Offline mode: changes stored locally", { persistent: false });
  }, [addToast]);

  const switchToOffline = useCallback(() => {
    setIsOffline(true);
    announceOfflineOnce();
  }, [announceOfflineOnce]);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!isOffline) {
        const remote = await api.listNotes();
        const normalized = Array.isArray(remote) ? remote.map(normalizeNote) : [];
        const sorted = sortNotes(normalized);
        setNotes(sorted);
        setSelectedId((prev) => (sorted.some((n) => String(n.id) === String(prev)) ? prev : (sorted[0]?.id ?? null)));
        setIsLoading(false);
        return;
      }
      // offline
      const local = localListNotes().map(normalizeNote);
      setNotes(sortNotes(local));
      setSelectedId((prev) => (local.some((n) => String(n.id) === String(prev)) ? prev : (local[0]?.id ?? null)));
      setIsLoading(false);
    } catch (e) {
      // Backend unreachable => offline fallback
      switchToOffline();
      const local = localListNotes().map(normalizeNote);
      setNotes(sortNotes(local));
      setSelectedId((prev) => (local.some((n) => String(n.id) === String(prev)) ? prev : (local[0]?.id ?? null)));
      setIsLoading(false);
    }
  }, [isOffline, switchToOffline]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const selectedNote = useMemo(
    () => notes.find((n) => String(n.id) === String(selectedId)) || null,
    [notes, selectedId]
  );

  const create = useCallback(async () => {
    const draft = { title: "", content: "" };

    try {
      if (!isOffline) {
        const created = await api.createNote(draft);
        const normalized = normalizeNote(created);
        setNotes((prev) => sortNotes([normalized, ...prev]));
        setSelectedId(normalized.id);
        return normalized;
      }
      const created = localCreateNote(draft);
      setNotes((prev) => sortNotes([normalizeNote(created), ...prev]));
      setSelectedId(created.id);
      return created;
    } catch (e) {
      switchToOffline();
      const created = localCreateNote(draft);
      setNotes((prev) => sortNotes([normalizeNote(created), ...prev]));
      setSelectedId(created.id);
      return created;
    }
  }, [isOffline, switchToOffline]);

  const update = useCallback(
    async (id, payload) => {
      // Optimistic UI: update local state immediately
      setNotes((prev) =>
        prev.map((n) => (String(n.id) === String(id) ? { ...n, ...payload, updatedAt: new Date().toISOString() } : n))
      );

      try {
        if (!isOffline) {
          const updated = await api.updateNote(id, payload);
          const normalized = normalizeNote(updated);
          setNotes((prev) => sortNotes(prev.map((n) => (String(n.id) === String(id) ? normalized : n))));
          return normalized;
        }
        const updated = localUpdateNote(id, payload);
        setNotes((prev) => sortNotes(prev.map((n) => (String(n.id) === String(id) ? normalizeNote(updated) : n))));
        return updated;
      } catch (e) {
        switchToOffline();
        try {
          const updated = localUpdateNote(id, payload);
          setNotes((prev) => sortNotes(prev.map((n) => (String(n.id) === String(id) ? normalizeNote(updated) : n))));
          return updated;
        } catch (e2) {
          addToast("error", "Failed to save changes.");
          // Reload to recover optimistic mismatch
          loadNotes();
          throw e2;
        }
      }
    },
    [addToast, isOffline, loadNotes, switchToOffline]
  );

  const remove = useCallback(
    async (note) => {
      const id = note?.id;
      if (id == null) return;

      // Optimistic remove
      setNotes((prev) => prev.filter((n) => String(n.id) !== String(id)));
      setSelectedId((prev) => (String(prev) === String(id) ? null : prev));

      try {
        if (!isOffline) {
          await api.deleteNote(id);
          return;
        }
        localDeleteNote(id);
      } catch (e) {
        switchToOffline();
        try {
          localDeleteNote(id);
        } catch {
          addToast("error", "Failed to delete note.");
          loadNotes();
          throw e;
        }
      }
    },
    [addToast, isOffline, loadNotes, switchToOffline]
  );

  const select = useCallback((id) => {
    setSelectedId(id);
  }, []);

  const apiBaseHint = useMemo(() => {
    const a = (process.env.REACT_APP_API_BASE || "").trim();
    const b = (process.env.REACT_APP_BACKEND_URL || "").trim();
    return a || b || "";
  }, []);

  return {
    notes,
    selectedId,
    selectedNote,
    isLoading,
    isOffline,
    toasts,
    apiBaseHint,

    select,
    create,
    update,
    remove,

    addToast,
    dismissToast,
    reload: loadNotes,
  };
}
