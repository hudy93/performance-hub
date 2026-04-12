'use client';

import { useState } from 'react';
import Card from './Card';
import { competencyCategoryLabels, competencyTagLabels, competencyTagColors } from '@/utils/constants';

export default function CompetencyTab({ emp, competencies, onUpdate }) {
  const [expandedId, setExpandedId] = useState(null);
  const [newMilestone, setNewMilestone] = useState({});

  const assessments = emp.competencyAssessments || [];

  const getAssessment = (compId) => assessments.find(a => a.competencyId === compId);

  const toggleMet = (compId) => {
    const existing = getAssessment(compId);
    let updated;
    if (existing) {
      updated = assessments.map(a =>
        a.competencyId === compId ? { ...a, met: !a.met } : a
      );
    } else {
      updated = [...assessments, { competencyId: compId, met: true, isTarget: false, milestones: [] }];
    }
    onUpdate({ ...emp, competencyAssessments: updated });
  };

  const toggleTarget = (compId) => {
    const existing = getAssessment(compId);
    let updated;
    if (existing) {
      updated = assessments.map(a =>
        a.competencyId === compId ? { ...a, isTarget: !a.isTarget } : a
      );
    } else {
      updated = [...assessments, { competencyId: compId, met: false, isTarget: true, milestones: [] }];
    }
    onUpdate({ ...emp, competencyAssessments: updated });
  };

  const addMilestone = (compId) => {
    const text = newMilestone[compId]?.title;
    const date = newMilestone[compId]?.dueDate;
    if (!text?.trim()) return;
    const updated = assessments.map(a => {
      if (a.competencyId !== compId) return a;
      return {
        ...a,
        milestones: [...a.milestones, { id: Date.now(), title: text, status: 'pending', dueDate: date || '' }],
      };
    });
    onUpdate({ ...emp, competencyAssessments: updated });
    setNewMilestone(prev => ({ ...prev, [compId]: { title: '', dueDate: '' } }));
  };

  const toggleMilestone = (compId, msId) => {
    const updated = assessments.map(a => {
      if (a.competencyId !== compId) return a;
      return {
        ...a,
        milestones: a.milestones.map(m =>
          m.id === msId ? { ...m, status: m.status === 'done' ? 'pending' : 'done' } : m
        ),
      };
    });
    onUpdate({ ...emp, competencyAssessments: updated });
  };

  const deleteMilestone = (compId, msId) => {
    const updated = assessments.map(a => {
      if (a.competencyId !== compId) return a;
      return { ...a, milestones: a.milestones.filter(m => m.id !== msId) };
    });
    onUpdate({ ...emp, competencyAssessments: updated });
  };

  // Group competencies by category
  const grouped = {};
  competencies.forEach(comp => {
    if (!grouped[comp.category]) grouped[comp.category] = [];
    grouped[comp.category].push(comp);
  });

  const metCount = assessments.filter(a => a.met).length;
  const totalCount = competencies.length;
  const targetCount = assessments.filter(a => a.isTarget).length;
  const targetDoneCount = assessments
    .filter(a => a.isTarget)
    .reduce((sum, a) => sum + a.milestones.filter(m => m.status === 'done').length, 0);
  const targetTotalCount = assessments
    .filter(a => a.isTarget)
    .reduce((sum, a) => sum + a.milestones.length, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Card>
          <div className="kpi-label">Erfüllt</div>
          <div className="kpi-value" style={{ color: 'var(--accent)' }}>{metCount}/{totalCount}</div>
          <div className="kpi-sub">Kompetenzen</div>
        </Card>
        <Card>
          <div className="kpi-label">Entwicklungsziele</div>
          <div className="kpi-value" style={{ color: 'var(--warning)' }}>{targetCount}</div>
          <div className="kpi-sub">markiert</div>
        </Card>
        <Card>
          <div className="kpi-label">Meilensteine</div>
          <div className="kpi-value" style={{ color: 'var(--blue)' }}>{targetDoneCount}/{targetTotalCount}</div>
          <div className="kpi-sub">erledigt</div>
        </Card>
      </div>

      {Object.entries(grouped).map(([category, comps]) => (
        <div key={category}>
          <h3 className="section-title" style={{ marginTop: 8 }}>
            {competencyCategoryLabels[category] || category}
          </h3>
          {comps.map(comp => {
            const assessment = getAssessment(comp.id);
            const isMet = assessment?.met || false;
            const isTarget = assessment?.isTarget || false;
            const milestones = assessment?.milestones || [];
            const expectation = comp.expectations[emp.role];
            const isExpanded = expandedId === comp.id;
            const ms = newMilestone[comp.id] || { title: '', dueDate: '' };

            return (
              <Card key={comp.id} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{comp.name}</span>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: `color-mix(in srgb, ${competencyTagColors[comp.tag]} 15%, transparent)`,
                        color: competencyTagColors[comp.tag],
                        letterSpacing: '0.5px',
                      }}>
                        {competencyTagLabels[comp.tag]}
                      </span>
                    </div>
                    {expectation && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
                        {expectation}
                      </p>
                    )}
                    {!expectation && (
                      <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: '4px 0 0', fontStyle: 'italic' }}>
                        Keine Erwartung für Rolle „{emp.role}" definiert
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 12 }}>
                    <button
                      className="btn btn--ghost"
                      style={{
                        background: isMet ? 'var(--accent-dim)' : 'transparent',
                        color: isMet ? 'var(--accent)' : 'var(--text-dim)',
                        border: isMet ? 'none' : '1px solid var(--border)',
                      }}
                      onClick={() => toggleMet(comp.id)}
                      title={isMet ? 'Erfüllt' : 'Nicht erfüllt'}
                    >
                      {isMet ? '✓ Erfüllt' : '○ Offen'}
                    </button>
                    <button
                      className="btn btn--ghost"
                      style={{
                        background: isTarget ? 'var(--warning-dim)' : 'transparent',
                        color: isTarget ? 'var(--warning)' : 'var(--text-dim)',
                        border: isTarget ? 'none' : '1px solid var(--border)',
                        fontSize: 11,
                      }}
                      onClick={() => toggleTarget(comp.id)}
                      title={isTarget ? 'Als Entwicklungsziel markiert' : 'Als Entwicklungsziel markieren'}
                    >
                      {isTarget ? '★ Ziel' : '☆ Ziel'}
                    </button>
                  </div>
                </div>

                {isTarget && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Meilensteine</span>
                      <button
                        className="btn btn--ghost"
                        style={{ fontSize: 10 }}
                        onClick={() => setExpandedId(isExpanded ? null : comp.id)}
                      >
                        {isExpanded ? '− Zuklappen' : '+ Hinzufügen'}
                      </button>
                    </div>

                    {milestones.map(m => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                        <button
                          style={{
                            width: 18, height: 18, borderRadius: 4, border: `1px solid ${m.status === 'done' ? 'var(--accent)' : 'var(--border-light)'}`,
                            background: m.status === 'done' ? 'var(--accent-dim)' : 'transparent',
                            color: m.status === 'done' ? 'var(--accent)' : 'transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                          }}
                          onClick={() => toggleMilestone(comp.id, m.id)}
                        >
                          {m.status === 'done' ? '✓' : ''}
                        </button>
                        <span style={{
                          flex: 1, fontSize: 12, color: m.status === 'done' ? 'var(--text-dim)' : 'var(--text)',
                          textDecoration: m.status === 'done' ? 'line-through' : 'none',
                        }}>
                          {m.title}
                        </span>
                        {m.dueDate && (
                          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                            {new Date(m.dueDate).toLocaleDateString('de-DE')}
                          </span>
                        )}
                        <button
                          className="btn btn--ghost"
                          style={{ color: 'var(--danger)', padding: '2px 6px', fontSize: 10 }}
                          onClick={() => deleteMilestone(comp.id, m.id)}
                        >✕</button>
                      </div>
                    ))}

                    {isExpanded && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <input
                          className="input"
                          style={{ flex: 1 }}
                          placeholder="Meilenstein beschreiben..."
                          value={ms.title}
                          onChange={(e) => setNewMilestone(prev => ({ ...prev, [comp.id]: { ...ms, title: e.target.value } }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') addMilestone(comp.id); }}
                        />
                        <input
                          type="date"
                          className="input"
                          style={{ width: 140 }}
                          value={ms.dueDate}
                          onChange={(e) => setNewMilestone(prev => ({ ...prev, [comp.id]: { ...ms, dueDate: e.target.value } }))}
                        />
                        <button className="btn btn--primary" onClick={() => addMilestone(comp.id)}>+</button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ))}
    </div>
  );
}
