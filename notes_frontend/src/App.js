import React, { useCallback, useMemo, useState } from "react";
import "./App.css";
import Header from "./components/Header";
import NotesList from "./components/NotesList";
import NoteEditor from "./components/NoteEditor";
import Toast from "./components/Toast";
import { useNotes } from "./hooks/useNotes";

// PUBLIC_INTERFACE
function App() {
  /** Main Notes application entry point. */
  const {
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
    dismissToast,
    addToast,
  } = useNotes();

  // Signal increments to re-focus title input after creating a note
  const [focusTitleSignal, setFocusTitleSignal] = useState(0);

  const handleAdd = useCallback(async () => {
    try {
      await create();
      setFocusTitleSignal((n) => n + 1);
    } catch {
      addToast("error", "Failed to create note.");
    }
  }, [addToast, create]);

  const handleDelete = useCallback(
    async (note) => {
      const title = (note?.title || "Untitled").trim() || "Untitled";
      const ok = window.confirm(`Delete "${title}"? This cannot be undone.`);
      if (!ok) return;

      try {
        await remove(note);
      } catch {
        // remove() already toasts on failure; keep quiet here
      }
    },
    [remove]
  );

  const handleChange = useCallback(
    async (id, payload) => {
      try {
        await update(id, payload);
      } catch {
        // update() handles error toast and reload on fatal mismatch
      }
    },
    [update]
  );

  const apiHint = useMemo(() => {
    if (!apiBaseHint) return "Tip: set REACT_APP_API_BASE (or REACT_APP_BACKEND_URL) to enable backend sync.";
    return `API: ${apiBaseHint}`;
  }, [apiBaseHint]);

  return (
    <div className="App">
      <div className="app-shell">
        <Header isOffline={isOffline} />

        <main className="split" aria-label="Notes workspace">
          <NotesList
            notes={notes}
            selectedId={selectedId}
            onSelect={select}
            onAdd={handleAdd}
            onDelete={handleDelete}
            isLoading={isLoading}
          />

          <NoteEditor
            note={selectedNote}
            onChange={handleChange}
            onDelete={handleDelete}
            isLoading={isLoading}
            isOffline={isOffline}
            focusTitleSignal={focusTitleSignal}
          />
        </main>

        <footer className="app-footer">
          <span className="app-footer__hint">{apiHint}</span>
        </footer>

        <div className="toast-stack" aria-label="Notifications">
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onDismiss={dismissToast} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
