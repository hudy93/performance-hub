'use client';

import { useState, useRef } from 'react';
import { parseGoalsMarkdown } from '@/utils/goalParser';
import Card from './Card';

export default function GoalUploadModal({ onImport, onClose }) {
  const [parsedGoals, setParsedGoals] = useState(null);
  const [error, setError] = useState(null);
  const [expandedGoal, setExpandedGoal] = useState(null);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const goals = parseGoalsMarkdown(text);
      if (goals.length === 0) {
        setError('Keine Ziele im Markdown gefunden. Bitte Format prüfen.');
        setParsedGoals(null);
      } else {
        setParsedGoals(goals);
        setError(null);
      }
    } catch (err) {
      setError('Fehler beim Lesen der Datei: ' + err.message);
      setParsedGoals(null);
    }
  };

  const handleConfirm = () => {
    if (parsedGoals) {
      onImport(parsedGoals);
      onClose();
    }
  };

  const smartSections = [
    { key: 'why', label: 'WHY — Zweck' },
    { key: 'specific', label: 'S — Spezifisch' },
    { key: 'measurable', label: 'M — Messbar' },
    { key: 'achievable', label: 'A — Erreichbar' },
    { key: 'relevant', label: 'R — Relevant' },
    { key: 'timeBound', label: 'T — Terminiert' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        padding: 24, maxWidth: 640, width: '100%', maxHeight: '80vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            Ziele aus Markdown importieren
          </h3>
          <button className="btn btn--ghost" onClick={onClose} style={{ color: 'var(--text-dim)' }}>✕</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <input
            ref={fileRef}
            type="file"
            accept=".md,.markdown,.txt"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
          <button className="btn btn--primary" onClick={() => fileRef.current?.click()}>
            Markdown-Datei auswählen
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 12 }}>
            .md Datei im SMART-Format
          </span>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-dim)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: 12, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {parsedGoals && (
          <>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              {parsedGoals.length} Ziel{parsedGoals.length !== 1 ? 'e' : ''} erkannt — Vorschau:
            </div>

            {parsedGoals.map((goal, i) => (
              <Card key={i} style={{ marginBottom: 8 }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setExpandedGoal(expandedGoal === i ? null : i)}
                >
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{goal.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>
                      Gewicht: {goal.weight}%
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    {smartSections.filter(s => goal[s.key]).length}/6 Felder · {expandedGoal === i ? '▲' : '▼'}
                  </span>
                </div>

                {expandedGoal === i && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    {smartSections.map(s => (
                      <div key={s.key} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: goal[s.key] ? 'var(--blue)' : 'var(--text-dim)', marginBottom: 2 }}>
                          {s.label}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                          {goal[s.key] || '(nicht ausgefüllt)'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn--ghost" onClick={onClose}>Abbrechen</button>
              <button className="btn btn--primary" onClick={handleConfirm}>
                {parsedGoals.length} Ziel{parsedGoals.length !== 1 ? 'e' : ''} importieren
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
