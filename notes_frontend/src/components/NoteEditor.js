import React, { useEffect, useMemo, useState } from "react";

function useDebouncedEffect(effect, deps, delayMs) {
  useEffect(() => {
    const t = window.setTimeout(() => effect(), delayMs);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delayMs]);
}

export default function NoteEditor({
  note,
  onChange,
  onDelete,
  isLoading,
  isOffline,
  focusTitleSignal,
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const hasSelection = Boolean(note);

  const meta = useMemo(() => {
    if (!note) return null;
    const updated = note.updatedAt || note.createdAt;
    return updated ? new Date(updated).toLocaleString() : null;
  }, [note]);

  // Sync local form when selection changes
  useEffect(() => {
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
  }, [note?.id]); // intentional: only on note change, not while typing

  // Auto-save with debounce
  useDebouncedEffect(
    () => {
      if (!note) return;
      // avoid spamming updates if unchanged
      if ((note.title ?? "") === title && (note.content ?? "") === content) return;
      onChange(note.id, { title, content });
    },
    [note?.id, title, content],
    450
  );

  // Focus management: when a new note is added, parent bumps focusTitleSignal
  useEffect(() => {
    if (!hasSelection) return;
    const el = document.getElementById("note-title");
    if (el) el.focus();
  }, [focusTitleSignal, hasSelection]);

  return (
    <section className="panel panel--editor" aria-label="Note editor">
      <div className="panel__header panel__header--tight">
        <div>
          <h2 className="panel__title">Editor</h2>
          <p className="panel__subtitle">
            {hasSelection ? (isOffline ? "Editing locally" : "Editing") : "Select a note to begin"}
          </p>
        </div>

        {hasSelection ? (
          <button className="btn btn--danger" onClick={() => onDelete(note)}>
            Delete
          </button>
        ) : null}
      </div>

      <div className="panel__content panel__content--editor">
        {isLoading ? (
          <div className="empty">
            <div className="empty__title">Loading…</div>
            <div className="empty__text">Preparing editor.</div>
          </div>
        ) : !hasSelection ? (
          <div className="empty">
            <div className="empty__title">No note selected</div>
            <div className="empty__text">Choose a note from the list, or create a new one.</div>
          </div>
        ) : (
          <>
            <div className="field">
              <label className="label" htmlFor="note-title">
                Title
              </label>
              <input
                id="note-title"
                className="input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled"
                autoComplete="off"
              />
            </div>

            <div className="field field--grow">
              <label className="label" htmlFor="note-content">
                Content
              </label>
              <textarea
                id="note-content"
                className="textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note…"
              />
            </div>

            <div className="editor-meta" aria-live="polite">
              {meta ? <span>Last updated: {meta}</span> : <span />}
              <span className="editor-meta__right">
                {isOffline ? "Offline mode" : "Online"}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
