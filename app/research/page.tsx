"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "@/components/Header";

type Note = { id: string; symbol: string; title: string; thesis: string; status: string; createdAt: string; };

export default function ResearchPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [symbol, setSymbol] = useState("");
  const [title, setTitle] = useState("");
  const [thesis, setThesis] = useState("");
  const [status, setStatus] = useState("Watching");

  useEffect(() => {
    try { setNotes(JSON.parse(localStorage.getItem("dp-alpha-research-notes") || "[]")); } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("dp-alpha-research-notes", JSON.stringify(notes));
  }, [notes]);

  function addNote(e: FormEvent) {
    e.preventDefault();
    if (!symbol.trim() || !title.trim() || !thesis.trim()) return;
    setNotes(items => [{
      id: crypto.randomUUID(),
      symbol: symbol.trim().toUpperCase(),
      title: title.trim(),
      thesis: thesis.trim(),
      status,
      createdAt: new Date().toISOString(),
    }, ...items]);
    setSymbol(""); setTitle(""); setThesis("");
  }

  return (
    <main>
      <Header active="research" status="Internal research" />
      <section className="workspace-shell">
        <p className="eyebrow">INTERNAL · RESEARCH JOURNAL</p>
        <h1 className="workspace-title">Research</h1>
        <p className="workspace-sub">Capture human research notes alongside TradingAgent analysis so every idea has a dated rationale and track record.</p>

        <div className="record-layout">
          <section className="research-list">
            {notes.map(note => (
              <article className="research-note-card" key={note.id}>
                <div className="research-note-head"><strong>{note.symbol}</strong><span>{note.status}</span></div>
                <h2>{note.title}</h2>
                <p>{note.thesis}</p>
                <small>{new Date(note.createdAt).toLocaleString()}</small>
              </article>
            ))}
            {notes.length === 0 && <div className="agent-empty-state"><span className="agent-orb">R</span><div><h2>No research notes yet</h2><p>Create the first dated thesis from the form.</p></div></div>}
          </section>

          <form className="side-card position-form" onSubmit={addNote}>
            <div className="side-title"><h3>New research note</h3></div>
            <label>Symbol<input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="RELIANCE" required /></label>
            <label>Title<input value={title} onChange={e => setTitle(e.target.value)} required /></label>
            <label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option>Watching</option><option>Researching</option><option>Ready</option><option>Closed</option></select></label>
            <label>Thesis<textarea value={thesis} onChange={e => setThesis(e.target.value)} required /></label>
            <button className="primary-btn position-submit" type="submit">Save research note</button>
            <small className="record-disclaimer">Temporary browser storage for now; this journal will move to the database with client records.</small>
          </form>
        </div>
      </section>
    </main>
  );
}
