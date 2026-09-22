"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "@/components/Header";
import { createResearchNote, listResearchNotes, ResearchNote } from "@/lib/clientRecords";

export default function ResearchPage() {
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [symbol, setSymbol] = useState("");
  const [title, setTitle] = useState("");
  const [thesis, setThesis] = useState("");
  const [status, setStatus] = useState("Watching");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const data = await listResearchNotes();
    setNotes(data.notes);
  }

  useEffect(() => {
    refresh().catch((e) => setError(e instanceof Error ? e.message : "Could not load research notes."));
  }, []);

  async function addNote(e: FormEvent) {
    e.preventDefault();
    if (!symbol.trim() || !title.trim() || !thesis.trim()) return;
    setBusy(true);
    setError("");
    try {
      await createResearchNote({
        symbol: symbol.trim().toUpperCase(),
        title: title.trim(),
        thesis: thesis.trim(),
        status,
      });
      setSymbol("");
      setTitle("");
      setThesis("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save research note.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <Header active="research" status="Shared research" />
      <section className="workspace-shell">
        <p className="eyebrow">INTERNAL · RESEARCH JOURNAL</p>
        <h1 className="workspace-title">Research</h1>
        <p className="workspace-sub">
          Shared research notes stored on the DP Alpha server computer, alongside TradingAgent analysis and client records.
        </p>

        {error && <div className="agent-error record-error">{error}</div>}

        <div className="record-layout">
          <section className="research-list">
            {notes.map((note) => (
              <article className="research-note-card" key={note.id}>
                <div className="research-note-head"><strong>{note.symbol}</strong><span>{note.status}</span></div>
                <h2>{note.title}</h2>
                <p>{note.thesis}</p>
                <small>{new Date(note.created_at).toLocaleString()} · {note.created_by}</small>
              </article>
            ))}
            {notes.length === 0 && (
              <div className="agent-empty-state">
                <span className="agent-orb">R</span>
                <div><h2>No research notes yet</h2><p>Create the first dated thesis from the form.</p></div>
              </div>
            )}
          </section>

          <form className="side-card position-form" onSubmit={addNote}>
            <div className="side-title"><h3>New research note</h3></div>
            <label>Symbol<input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="RELIANCE" required /></label>
            <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
            <label>Status<select value={status} onChange={(e) => setStatus(e.target.value)}><option>Watching</option><option>Researching</option><option>Ready</option><option>Closed</option></select></label>
            <label>Thesis<textarea value={thesis} onChange={(e) => setThesis(e.target.value)} required /></label>
            <button className="primary-btn position-submit" disabled={busy} type="submit">{busy ? "Saving…" : "Save research note"}</button>
            <small className="record-disclaimer">Stored in the shared SQLite database on the self-hosted DP Alpha computer.</small>
          </form>
        </div>
      </section>
    </main>
  );
}
