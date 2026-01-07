import React from "react";

export default function NotesList({
  notes,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  isLoading,
}) {
  return (
    <section className="panel panel--list" aria-label="Notes list">
      <div className="panel__header">
        <div>
          <h2 className="panel__title">Notes</h2>
          <p className="panel__subtitle">Your ideas, saved.</p>
        </div>

        <button className="btn btn--primary btn--large" onClick={onAdd}>
          Add Note
        </button>
      </div>

      <div className="panel__content">
        {isLoading ? (
          <div className="empty">
            <div className="empty__title">Loading…</div>
            <div className="empty__text">Fetching your notes.</div>
          </div>
        ) : notes.length === 0 ? (
          <div className="empty">
            <div className="empty__title">No notes yet</div>
            <div className="empty__text">Click “Add Note” to create your first note.</div>
          </div>
        ) : (
          <ul className="notes-list" role="listbox" aria-label="Notes">
            {notes.map((note) => {
              const active = String(note.id) === String(selectedId);
              const preview =
                (note.content || "").trim().split("\n").find(Boolean) || "No content";

              return (
                <li key={note.id} className={`notes-list__item ${active ? "is-active" : ""}`}>
                  <button
                    className="notes-list__button"
                    onClick={() => onSelect(note.id)}
                    aria-selected={active}
                    role="option"
                  >
                    <div className="notes-list__title-row">
                      <div className="notes-list__title">
                        {(note.title || "").trim() || "Untitled"}
                      </div>
                    </div>
                    <div className="notes-list__preview">{preview}</div>
                  </button>

                  <button
                    className="icon-btn"
                    onClick={() => onDelete(note)}
                    aria-label={`Delete note ${(note.title || "Untitled").trim()}`}
                    title="Delete"
                  >
                    🗑
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
