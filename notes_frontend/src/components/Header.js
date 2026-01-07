import React from "react";

export default function Header({ isOffline }) {
  return (
    <header className="app-header">
      <div className="app-header__left">
        <div className="app-mark" aria-hidden="true" />
        <div>
          <h1 className="app-title">Notes</h1>
          <p className="app-subtitle">Simple, fast, and calm.</p>
        </div>
      </div>

      {isOffline ? (
        <div className="offline-pill" role="status" aria-live="polite">
          Offline mode: changes stored locally
        </div>
      ) : (
        <div className="online-pill" role="status" aria-live="polite">
          Connected
        </div>
      )}
    </header>
  );
}
