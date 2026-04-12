'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Card from './Card';
import ScoreGauge from './ScoreGauge';
import StatusBadge from './StatusBadge';
import ContributionBadge from './ContributionBadge';
import ProgressBar from './ProgressBar';
import SalaryBandViz from './SalaryBandViz';
import CompetencyTab from './CompetencyTab';
import GitHubActivityTab from './GitHubActivityTab';
import GoalUploadModal from './GoalUploadModal';
import { calcWeightedGoalScore, calcSalaryRecommendation, distributeBudget } from '@/utils/calculations';
import { categoryLabels } from '@/utils/constants';

const categoryColors = {
  reliability: 'var(--blue)',
  initiative: 'var(--accent)',
  innovation: 'var(--purple)',
  culture: 'var(--warning)',
  quality: 'var(--blue)',
};

const goalStatusColor = {
  completed: 'var(--accent)',
  'on-track': 'var(--blue)',
  'at-risk': 'var(--warning)',
  behind: 'var(--danger)',
};

const tabs = [
  { key: 'goals', label: 'Ziele' },
  { key: 'competencies', label: 'Kompetenzen' },
  { key: 'extras', label: 'Extra-Leistungen' },
  { key: 'github', label: 'GitHub' },
  { key: 'salary', label: 'Gehalt & Empfehlung' },
];

const pageMotion = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.2 } },
};

const tabContent = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export default function EmployeeDetail({ emp, onBack, onUpdate, onDelete, budget, employees, competencies, settings }) {
  const [activeTab, setActiveTab] = useState('goals');
  const [editingGoal, setEditingGoal] = useState(null);
  const [editGoalData, setEditGoalData] = useState(null);
  const [editingTeamGoal, setEditingTeamGoal] = useState(null);
  const [editTeamGoalData, setEditTeamGoalData] = useState(null);
  const [newExtra, setNewExtra] = useState('');
  const [newExtraCat, setNewExtraCat] = useState('initiative');
  const [editingSalary, setEditingSalary] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', why: '', specific: '', measurable: '', achievable: '', relevant: '', timeBound: '', weight: '20' });
  const [newTeamGoal, setNewTeamGoal] = useState({ title: '', measurable: '', deadline: '', contribution: 'medium' });
  const [showGoalUpload, setShowGoalUpload] = useState(false);

  const rec = calcSalaryRecommendation(emp);
  const goalScore = calcWeightedGoalScore(emp.personalGoals);
  const dist = distributeBudget(employees, budget);
  const alloc = dist?.allocations.find((a) => a.empId === emp.id);

  const startEditGoal = (goal) => {
    setEditingGoal(goal.id);
    setEditGoalData({
      title: goal.title,
      why: goal.why || '',
      specific: goal.specific || '',
      measurable: goal.measurable || '',
      achievable: goal.achievable || '',
      relevant: goal.relevant || '',
      timeBound: goal.timeBound || '',
      weight: String(goal.weight),
      progress: String(goal.progress),
    });
  };

  const saveGoalEdit = (goalId) => {
    const progress = Math.max(0, Math.min(100, parseInt(editGoalData.progress) || 0));
    onUpdate({
      ...emp,
      personalGoals: emp.personalGoals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              title: editGoalData.title,
              why: editGoalData.why,
              specific: editGoalData.specific,
              measurable: editGoalData.measurable,
              achievable: editGoalData.achievable,
              relevant: editGoalData.relevant,
              timeBound: editGoalData.timeBound,
              weight: parseInt(editGoalData.weight) || 20,
              progress,
              status: progress >= 100 ? 'completed' : progress >= 60 ? 'on-track' : progress >= 30 ? 'at-risk' : 'behind',
            }
          : g,
      ),
    });
    setEditingGoal(null);
    setEditGoalData(null);
  };

  const startEditTeamGoal = (goal) => {
    setEditingTeamGoal(goal.id);
    setEditTeamGoalData({
      title: goal.title,
      measurable: goal.measurable || '',
      deadline: goal.deadline || '',
      contribution: goal.contribution,
      progress: String(goal.progress),
    });
  };

  const saveTeamGoalEdit = (goalId) => {
    const progress = Math.max(0, Math.min(100, parseInt(editTeamGoalData.progress) || 0));
    onUpdate({
      ...emp,
      teamGoals: emp.teamGoals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              title: editTeamGoalData.title,
              measurable: editTeamGoalData.measurable,
              deadline: editTeamGoalData.deadline,
              contribution: editTeamGoalData.contribution,
              progress,
            }
          : g,
      ),
    });
    setEditingTeamGoal(null);
    setEditTeamGoalData(null);
  };

  const addPersonalGoal = () => {
    if (!newGoal.title.trim()) return;
    onUpdate({
      ...emp,
      personalGoals: [...emp.personalGoals, {
        id: Date.now(),
        title: newGoal.title,
        why: newGoal.why,
        specific: newGoal.specific,
        measurable: newGoal.measurable,
        achievable: newGoal.achievable,
        relevant: newGoal.relevant,
        timeBound: newGoal.timeBound,
        progress: 0,
        weight: parseInt(newGoal.weight) || 20,
        status: 'not-started',
      }],
    });
    setNewGoal({ title: '', why: '', specific: '', measurable: '', achievable: '', relevant: '', timeBound: '', weight: '20' });
  };

  const deletePersonalGoal = (goalId) => {
    onUpdate({
      ...emp,
      personalGoals: emp.personalGoals.filter((g) => g.id !== goalId),
    });
  };

  const addTeamGoal = () => {
    if (!newTeamGoal.title.trim() || !newTeamGoal.measurable.trim() || !newTeamGoal.deadline) return;
    onUpdate({
      ...emp,
      teamGoals: [...emp.teamGoals, {
        id: Date.now(),
        title: newTeamGoal.title,
        measurable: newTeamGoal.measurable,
        deadline: newTeamGoal.deadline,
        progress: 0,
        contribution: newTeamGoal.contribution,
      }],
    });
    setNewTeamGoal({ title: '', measurable: '', deadline: '', contribution: 'medium' });
  };

  const deleteTeamGoal = (goalId) => {
    onUpdate({
      ...emp,
      teamGoals: emp.teamGoals.filter((g) => g.id !== goalId),
    });
  };

  const importGoals = (goals) => {
    const maxId = emp.personalGoals.reduce((max, g) => Math.max(max, g.id), 0);
    const newGoals = goals.map((g, i) => ({ ...g, id: maxId + i + 1 }));
    onUpdate({
      ...emp,
      personalGoals: [...emp.personalGoals, ...newGoals],
    });
  };

  const addExtra = () => {
    if (!newExtra.trim()) return;
    onUpdate({
      ...emp,
      extras: [...emp.extras, { id: Date.now(), text: newExtra, category: newExtraCat, date: '2026-Q2' }],
    });
    setNewExtra('');
  };

  return (
    <motion.div {...pageMotion} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn--text" onClick={onBack}>← Zurück zum Dashboard</button>
        <button
          className="btn btn--ghost"
          style={{ color: 'var(--danger)', fontSize: 12 }}
          onClick={() => {
            if (confirm(`${emp.name} wirklich löschen?`)) onDelete(emp.id);
          }}
        >
          Mitarbeiter löschen
        </button>
      </div>

      {/* Header */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div className="employee-avatar employee-avatar--large">{emp.avatar}</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, color: 'var(--text)', margin: 0 }}>
              {emp.name}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '2px 0 0' }}>
              {emp.role} · {emp.department}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>GitHub:</span>
              <input
                className="input"
                style={{ width: 160, padding: '3px 8px', fontSize: 11 }}
                placeholder="GitHub Username..."
                defaultValue={emp.githubUsername || ''}
                onBlur={(e) => {
                  if (e.target.value !== (emp.githubUsername || '')) {
                    onUpdate({ ...emp, githubUsername: e.target.value });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onUpdate({ ...emp, githubUsername: e.target.value });
                    e.target.blur();
                  }
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {emp.highlights.map((h, i) => (
                <span key={i} className="badge badge--highlight">{h}</span>
              ))}
            </div>
          </div>
          <ScoreGauge score={emp.performanceScore} />
        </div>
      </Card>

      {/* KPI row */}
      <div className="detail-kpi-grid">
        <Card>
          <div className="kpi-label">Zielerreichung</div>
          <div className="kpi-value" style={{ color: 'var(--accent)' }}>{Math.round(goalScore)}%</div>
          <div className="kpi-sub">gewichtet</div>
        </Card>
        <Card>
          <div className="kpi-label">Gehaltsempfehlung</div>
          <div className="kpi-value" style={{ color: 'var(--purple)' }}>+{rec.percentage}%</div>
          <div className="kpi-sub">€{rec.newSalary.toLocaleString('de-DE')}</div>
        </Card>
        <Card>
          <div className="kpi-label">Marktvergleich</div>
          <div className="kpi-value" style={{ color: rec.marketGap > 0 ? 'var(--danger)' : 'var(--accent)' }}>
            {rec.marketGap > 0 ? `−${rec.marketGap}%` : `+${Math.abs(rec.marketGap)}%`}
          </div>
          <div className="kpi-sub">vs. Marktniveau</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'goals' && (
          <motion.div key="goals" {...tabContent} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="section-title" style={{ margin: 0 }}>Persönliche Ziele</h3>
              <button className="btn btn--ghost" onClick={() => setShowGoalUpload(true)}>
                ↑ Aus Markdown importieren
              </button>
            </div>
            {emp.personalGoals.map((goal) => (
              <Card key={goal.id}>
                {editingGoal === goal.id && editGoalData ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>Ziel bearbeiten (SMART)</div>
                    <input className="input" value={editGoalData.title} onChange={(e) => setEditGoalData({ ...editGoalData, title: e.target.value })} placeholder="Titel des Ziels" />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4 }}>WHY — Zweck</div>
                      <textarea className="input" style={{ width: '100%', minHeight: 60, resize: 'vertical' }} value={editGoalData.why} onChange={(e) => setEditGoalData({ ...editGoalData, why: e.target.value })} placeholder="Warum ist dieses Ziel wichtig?" />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4 }}>S — Spezifisch</div>
                      <textarea className="input" style={{ width: '100%', minHeight: 60, resize: 'vertical' }} value={editGoalData.specific} onChange={(e) => setEditGoalData({ ...editGoalData, specific: e.target.value })} placeholder="Was genau soll erreicht werden?" />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4 }}>M — Messbar</div>
                      <textarea className="input" style={{ width: '100%', minHeight: 60, resize: 'vertical' }} value={editGoalData.measurable} onChange={(e) => setEditGoalData({ ...editGoalData, measurable: e.target.value })} placeholder="Woran wird der Erfolg gemessen?" />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4 }}>A — Erreichbar</div>
                      <textarea className="input" style={{ width: '100%', minHeight: 60, resize: 'vertical' }} value={editGoalData.achievable} onChange={(e) => setEditGoalData({ ...editGoalData, achievable: e.target.value })} placeholder="Warum ist das Ziel realistisch erreichbar?" />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4 }}>R — Relevant</div>
                      <textarea className="input" style={{ width: '100%', minHeight: 60, resize: 'vertical' }} value={editGoalData.relevant} onChange={(e) => setEditGoalData({ ...editGoalData, relevant: e.target.value })} placeholder="Warum ist dieses Ziel relevant?" />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4 }}>T — Terminiert</div>
                      <textarea className="input" style={{ width: '100%', minHeight: 60, resize: 'vertical' }} value={editGoalData.timeBound} onChange={(e) => setEditGoalData({ ...editGoalData, timeBound: e.target.value })} placeholder="Zeitplan und Meilensteine" />
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="number" min="0" max="100" className="input input--small" style={{ width: 60 }} value={editGoalData.weight} onChange={(e) => setEditGoalData({ ...editGoalData, weight: e.target.value })} />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>% Gewicht</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="number" min="0" max="100" className="input input--small" style={{ width: 60 }} value={editGoalData.progress} onChange={(e) => setEditGoalData({ ...editGoalData, progress: e.target.value })} />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>% Fortschritt</span>
                      </div>
                      <div style={{ flex: 1 }} />
                      <button className="btn btn--ghost" onClick={() => { setEditingGoal(null); setEditGoalData(null); }}>Abbrechen</button>
                      <button className="btn btn--primary" onClick={() => saveGoalEdit(goal.id)}>Speichern</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="goal-header">
                      <div style={{ flex: 1 }}>
                        <div className="goal-title-row">
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{goal.title}</span>
                          <StatusBadge status={goal.status} />
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                          <span className="goal-weight">Gewichtung: {goal.weight}%</span>
                          {goal.measurable && (
                            <span style={{ fontSize: 11, color: 'var(--blue)' }}>Messbar: {goal.measurable.length > 80 ? goal.measurable.substring(0, 80) + '...' : goal.measurable}</span>
                          )}
                          {(goal.timeBound || goal.deadline) && (
                            <span style={{ fontSize: 11, color: 'var(--warning)' }}>Frist: {new Date(goal.timeBound || goal.deadline).toLocaleDateString('de-DE')}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button className="btn btn--ghost" onClick={() => startEditGoal(goal)}>Bearbeiten</button>
                        <button className="btn btn--ghost" style={{ color: 'var(--danger)' }} onClick={() => deletePersonalGoal(goal.id)}>✕</button>
                      </div>
                    </div>
                    {goal.why && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        <strong style={{ color: 'var(--text-dim)', fontSize: 11 }}>WHY:</strong> {goal.why.substring(0, 200)}{goal.why.length > 200 ? '...' : ''}
                      </div>
                    )}
                    <div className="goal-progress-row">
                      <div style={{ flex: 1 }}>
                        <ProgressBar value={goal.progress} color={goalStatusColor[goal.status] || 'var(--blue)'} />
                      </div>
                      <span className="goal-percent">{goal.progress}%</span>
                    </div>
                  </>
                )}
              </Card>
            ))}

            <Card className="card--dashed">
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                Neues Ziel (SMART)
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10 }}>
                WHY · Spezifisch · Messbar · Erreichbar · Relevant · Terminiert
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="Titel des Ziels"
                  className="input"
                />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4 }}>WHY — Zweck</div>
                  <textarea className="input" style={{ width: '100%', minHeight: 50, resize: 'vertical' }} value={newGoal.why} onChange={(e) => setNewGoal({ ...newGoal, why: e.target.value })} placeholder="Warum ist dieses Ziel wichtig?" />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4 }}>S — Spezifisch</div>
                  <textarea className="input" style={{ width: '100%', minHeight: 50, resize: 'vertical' }} value={newGoal.specific} onChange={(e) => setNewGoal({ ...newGoal, specific: e.target.value })} placeholder="Was genau soll erreicht werden?" />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4 }}>M — Messbar</div>
                  <textarea className="input" style={{ width: '100%', minHeight: 50, resize: 'vertical' }} value={newGoal.measurable} onChange={(e) => setNewGoal({ ...newGoal, measurable: e.target.value })} placeholder="Woran wird der Erfolg gemessen?" />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4 }}>A — Erreichbar</div>
                  <textarea className="input" style={{ width: '100%', minHeight: 50, resize: 'vertical' }} value={newGoal.achievable} onChange={(e) => setNewGoal({ ...newGoal, achievable: e.target.value })} placeholder="Warum ist das Ziel realistisch erreichbar?" />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4 }}>R — Relevant</div>
                  <textarea className="input" style={{ width: '100%', minHeight: 50, resize: 'vertical' }} value={newGoal.relevant} onChange={(e) => setNewGoal({ ...newGoal, relevant: e.target.value })} placeholder="Warum ist dieses Ziel relevant?" />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4 }}>T — Terminiert</div>
                  <textarea className="input" style={{ width: '100%', minHeight: 50, resize: 'vertical' }} value={newGoal.timeBound} onChange={(e) => setNewGoal({ ...newGoal, timeBound: e.target.value })} placeholder="Zeitplan und Meilensteine" />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newGoal.weight}
                      onChange={(e) => setNewGoal({ ...newGoal, weight: e.target.value })}
                      className="input input--small"
                      style={{ width: 60 }}
                      placeholder="%"
                    />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>% Gewicht</span>
                  </div>
                  <div style={{ flex: 1 }} />
                  <button
                    className="btn btn--primary"
                    disabled={!newGoal.title}
                    onClick={addPersonalGoal}
                  >+ Hinzufügen</button>
                </div>
              </div>
            </Card>

            <h3 className="section-title" style={{ marginTop: 8 }}>Team-Ziele</h3>
            {emp.teamGoals.map((goal) => (
              <Card key={goal.id}>
                {editingTeamGoal === goal.id && editTeamGoalData ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>Team-Ziel bearbeiten (SMART)</div>
                    <input className="input" value={editTeamGoalData.title} onChange={(e) => setEditTeamGoalData({ ...editTeamGoalData, title: e.target.value })} placeholder="S — Spezifisches Ziel" />
                    <input className="input" value={editTeamGoalData.measurable} onChange={(e) => setEditTeamGoalData({ ...editTeamGoalData, measurable: e.target.value })} placeholder="M — Messkriterium" />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="date" className="input" style={{ flex: 1 }} value={editTeamGoalData.deadline} onChange={(e) => setEditTeamGoalData({ ...editTeamGoalData, deadline: e.target.value })} title="T — Frist" />
                      <select className="select" value={editTeamGoalData.contribution} onChange={(e) => setEditTeamGoalData({ ...editTeamGoalData, contribution: e.target.value })}>
                        <option value="high">Hoch</option>
                        <option value="medium">Mittel</option>
                        <option value="low">Niedrig</option>
                      </select>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="number" min="0" max="100" className="input input--small" style={{ width: 60 }} value={editTeamGoalData.progress} onChange={(e) => setEditTeamGoalData({ ...editTeamGoalData, progress: e.target.value })} />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>%</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn btn--ghost" onClick={() => { setEditingTeamGoal(null); setEditTeamGoalData(null); }}>Abbrechen</button>
                      <button className="btn btn--primary" onClick={() => saveTeamGoalEdit(goal.id)}>Speichern</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{goal.title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ContributionBadge level={goal.contribution} />
                        <button className="btn btn--ghost" onClick={() => startEditTeamGoal(goal)}>✎</button>
                        <button className="btn btn--ghost" style={{ color: 'var(--danger)', padding: '2px 6px' }} onClick={() => deleteTeamGoal(goal.id)}>✕</button>
                      </div>
                    </div>
                    {(goal.measurable || goal.deadline) && (
                      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                        {goal.measurable && (
                          <span style={{ fontSize: 11, color: 'var(--blue)' }}>Messbar: {goal.measurable}</span>
                        )}
                        {goal.deadline && (
                          <span style={{ fontSize: 11, color: 'var(--warning)' }}>Frist: {new Date(goal.deadline).toLocaleDateString('de-DE')}</span>
                        )}
                      </div>
                    )}
                    <div className="goal-progress-row">
                      <div style={{ flex: 1 }}><ProgressBar value={goal.progress} color="var(--blue)" /></div>
                      <span className="goal-percent">{goal.progress}%</span>
                    </div>
                  </>
                )}
              </Card>
            ))}

            <Card className="card--dashed">
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                Neues Team-Ziel (SMART)
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10 }}>
                Spezifisch · Messbar · Erreichbar · Relevant · Terminiert
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  value={newTeamGoal.title}
                  onChange={(e) => setNewTeamGoal({ ...newTeamGoal, title: e.target.value })}
                  placeholder="S — Was soll das Team erreichen?"
                  className="input"
                />
                <input
                  value={newTeamGoal.measurable}
                  onChange={(e) => setNewTeamGoal({ ...newTeamGoal, measurable: e.target.value })}
                  placeholder="M — Woran wird der Erfolg gemessen? (z.B. 'Latenz < 200ms')"
                  className="input"
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="date"
                    value={newTeamGoal.deadline}
                    onChange={(e) => setNewTeamGoal({ ...newTeamGoal, deadline: e.target.value })}
                    className="input"
                    style={{ flex: 1 }}
                    title="T — Frist"
                  />
                  <select
                    value={newTeamGoal.contribution}
                    onChange={(e) => setNewTeamGoal({ ...newTeamGoal, contribution: e.target.value })}
                    className="select"
                  >
                    <option value="high">Beitrag: Hoch</option>
                    <option value="medium">Beitrag: Mittel</option>
                    <option value="low">Beitrag: Niedrig</option>
                  </select>
                  <button
                    className="btn btn--primary"
                    disabled={!newTeamGoal.title || !newTeamGoal.measurable || !newTeamGoal.deadline}
                    onClick={addTeamGoal}
                  >+ Hinzufügen</button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'competencies' && (
          <motion.div key="competencies" {...tabContent}>
            <CompetencyTab emp={emp} competencies={competencies || []} onUpdate={onUpdate} />
          </motion.div>
        )}

        {activeTab === 'extras' && (
          <motion.div key="extras" {...tabContent} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 className="section-title">Besondere Leistungen & Auffälligkeiten</h3>
            {emp.extras.map((extra) => (
              <Card key={extra.id} style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div className="cat-dot" style={{ background: categoryColors[extra.category] || 'var(--accent)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)' }}>{extra.text}</div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: categoryColors[extra.category] || 'var(--text-muted)', fontWeight: 600 }}>
                        {categoryLabels[extra.category] || extra.category}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{extra.date}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <Card className="card--dashed">
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                Neue Leistung erfassen
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  value={newExtra}
                  onChange={(e) => setNewExtra(e.target.value)}
                  placeholder="Beschreibung der Leistung..."
                  className="input"
                  style={{ flex: 1, minWidth: 200 }}
                  onKeyDown={(e) => { if (e.key === 'Enter') addExtra(); }}
                />
                <select
                  value={newExtraCat}
                  onChange={(e) => setNewExtraCat(e.target.value)}
                  className="select"
                >
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <button className="btn btn--primary" onClick={addExtra}>+ Hinzufügen</button>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'github' && (
          <motion.div key="github" {...tabContent}>
            <GitHubActivityTab emp={emp} onUpdate={onUpdate} />
          </motion.div>
        )}

        {activeTab === 'salary' && (
          <motion.div key="salary" {...tabContent} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '0 0 16px', fontFamily: 'var(--font-display)' }}>
                Gehaltsanalyse & Empfehlung
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <div className="kpi-label">Aktuelles Gehalt</div>
                  {editingSalary ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>€</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        defaultValue={emp.currentSalary}
                        className="input"
                        style={{ width: 120, fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)' }}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseInt(e.target.value);
                            if (val > 0) onUpdate({ ...emp, currentSalary: val });
                            setEditingSalary(false);
                          }
                          if (e.key === 'Escape') setEditingSalary(false);
                        }}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          if (val > 0) onUpdate({ ...emp, currentSalary: val });
                          setEditingSalary(false);
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', cursor: 'pointer' }}
                      onClick={() => setEditingSalary(true)}
                      title="Klicken zum Bearbeiten"
                    >
                      €{emp.currentSalary.toLocaleString('de-DE')}
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 6, fontFamily: 'var(--font-body)', fontWeight: 400 }}>✎</span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="kpi-label">Empfohlenes Gehalt</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--purple)', fontFamily: 'var(--font-display)' }}>
                    €{rec.newSalary.toLocaleString('de-DE')}
                  </div>
                </div>
              </div>
              <SalaryBandViz current={emp.currentSalary} band={emp.salaryBand} market={emp.marketRate} newSalary={rec.newSalary} />
            </Card>

            <Card>
              <h3 className="section-title" style={{ marginBottom: 14 }}>Berechnungsfaktoren</h3>
              <div>
                {[
                  { label: 'Inflation (Basisanpassung)', value: `${emp.inflation}%`, detail: 'Automatische Mindestanpassung', color: 'var(--text-muted)' },
                  { label: 'Performance Score', value: `${emp.performanceScore} / 5.0`, detail: `Multiplier: ${rec.performanceMultiplier}%`, color: emp.performanceScore >= 4 ? 'var(--accent)' : emp.performanceScore >= 3 ? 'var(--blue)' : 'var(--danger)' },
                  { label: 'Gewichtete Zielerreichung', value: `${Math.round(goalScore)}%`, detail: `${emp.personalGoals.filter((g) => g.status === 'completed').length} von ${emp.personalGoals.length} Zielen erledigt`, color: 'var(--blue)' },
                  { label: 'Marktposition', value: `€${emp.marketRate.toLocaleString('de-DE')}`, detail: `Differenz: ${rec.marketGap > 0 ? '−' : '+'}${Math.abs(rec.marketGap)}%`, color: rec.marketGap > 0 ? 'var(--danger)' : 'var(--accent)' },
                  { label: 'Position im Gehaltsband', value: `${rec.bandPosition}%`, detail: rec.bandPosition < 30 ? 'Unteres Drittel → Aufholbedarf' : rec.bandPosition > 80 ? 'Oberes Drittel → Gedämpft' : 'Mittlerer Bereich', color: rec.bandPosition < 30 ? 'var(--warning)' : rec.bandPosition > 80 ? 'var(--text-dim)' : 'var(--accent)' },
                  { label: 'Extra-Leistungen Bonus', value: `${emp.extras.length} erfasst`, detail: `+${Math.min(emp.extras.length * 0.4, 2.0).toFixed(1)}% Bonus`, color: 'var(--purple)' },
                  { label: 'Highlights & Auffälligkeiten', value: `${emp.highlights.length} Stück`, detail: `+${Math.min(emp.highlights.length * 0.25, 1.5).toFixed(2)}% Bonus`, color: 'var(--warning)' },
                  { label: 'Kompetenz-Erfüllung', value: `${rec.competencyScore || 0}%`, detail: `${(emp.competencyAssessments || []).filter(a => a.met).length} von ${(emp.competencyAssessments || []).length} erfüllt`, color: 'var(--blue)' },
                ].map((factor, i) => (
                  <div key={i} className="factor-row">
                    <div>
                      <div className="factor-label">{factor.label}</div>
                      <div className="factor-detail">{factor.detail}</div>
                    </div>
                    <div className="factor-value" style={{ color: factor.color }}>{factor.value}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="card--gradient-purple">
              <div className="salary-summary">
                <div>
                  <div className="kpi-label">Empfohlene Gehaltserhöhung</div>
                  <div className="salary-summary-value">+{rec.percentage}%</div>
                </div>
                <div className="salary-summary-detail">
                  <div>€{emp.currentSalary.toLocaleString('de-DE')} → €{rec.newSalary.toLocaleString('de-DE')}</div>
                  <div style={{ marginTop: 2 }}>+€{(rec.newSalary - emp.currentSalary).toLocaleString('de-DE')} / Jahr</div>
                </div>
              </div>
            </Card>

            {alloc && (
              <Card style={{ background: 'linear-gradient(135deg, var(--surface), rgba(74,222,128,0.03))', borderColor: 'rgba(74,222,128,0.15)' }}>
                <div className="salary-summary">
                  <div>
                    <div className="kpi-label">Aus Budget (€{budget.toLocaleString('de-DE')})</div>
                    <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
                      +€{alloc.allocated.toLocaleString('de-DE')}
                    </div>
                  </div>
                  <div className="salary-summary-detail">
                    <div>€{emp.currentSalary.toLocaleString('de-DE')} → €{alloc.newSalary.toLocaleString('de-DE')}</div>
                    <div style={{ marginTop: 2 }}>+{alloc.percentage}%</div>
                    {alloc.isCapped && (
                      <div style={{ marginTop: 4, color: 'var(--warning)', fontSize: 11 }}>
                        Durch Budget begrenzt (ideal: +€{rec.increaseAbsolute.toLocaleString('de-DE')})
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showGoalUpload && (
        <GoalUploadModal
          onImport={importGoals}
          onClose={() => setShowGoalUpload(false)}
        />
      )}
    </motion.div>
  );
}
