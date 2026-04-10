import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Card from './Card';
import ScoreGauge from './ScoreGauge';
import StatusBadge from './StatusBadge';
import ContributionBadge from './ContributionBadge';
import ProgressBar from './ProgressBar';
import SalaryBandViz from './SalaryBandViz';
import { calcWeightedGoalScore, calcSalaryRecommendation, distributeBudget } from '../utils/calculations';
import { categoryLabels } from '../data/employees';

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
  { key: 'extras', label: 'Extra-Leistungen' },
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

export default function EmployeeDetail({ emp, onBack, onUpdate, budget, employees }) {
  const [activeTab, setActiveTab] = useState('goals');
  const [editingGoal, setEditingGoal] = useState(null);
  const [newExtra, setNewExtra] = useState('');
  const [newExtraCat, setNewExtraCat] = useState('initiative');
  const [editingSalary, setEditingSalary] = useState(false);

  const rec = calcSalaryRecommendation(emp);
  const goalScore = calcWeightedGoalScore(emp.personalGoals);
  const dist = distributeBudget(employees, budget);
  const alloc = dist?.allocations.find((a) => a.empId === emp.id);

  const updateGoalProgress = (goalId, newProgress) => {
    const clamped = Math.max(0, Math.min(100, newProgress));
    const updated = {
      ...emp,
      personalGoals: emp.personalGoals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              progress: clamped,
              status: clamped >= 100 ? 'completed' : clamped >= 60 ? 'on-track' : clamped >= 30 ? 'at-risk' : 'behind',
            }
          : g,
      ),
    };
    onUpdate(updated);
    setEditingGoal(null);
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
      <button className="btn btn--text" onClick={onBack}>← Zurück zum Dashboard</button>

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
            <h3 className="section-title">Persönliche Ziele</h3>
            {emp.personalGoals.map((goal) => (
              <Card key={goal.id}>
                <div className="goal-header">
                  <div style={{ flex: 1 }}>
                    <div className="goal-title-row">
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{goal.title}</span>
                      <StatusBadge status={goal.status} />
                    </div>
                    <span className="goal-weight">Gewichtung: {goal.weight}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {editingGoal === goal.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          defaultValue={goal.progress}
                          className="input input--small"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateGoalProgress(goal.id, parseInt(e.target.value));
                          }}
                          autoFocus
                        />
                        <button className="btn btn--cancel" onClick={() => setEditingGoal(null)}>✕</button>
                      </div>
                    ) : (
                      <button className="btn btn--ghost" onClick={() => setEditingGoal(goal.id)}>
                        Bearbeiten
                      </button>
                    )}
                  </div>
                </div>
                <div className="goal-progress-row">
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={goal.progress} color={goalStatusColor[goal.status] || 'var(--blue)'} />
                  </div>
                  <span className="goal-percent">{goal.progress}%</span>
                </div>
              </Card>
            ))}

            <h3 className="section-title" style={{ marginTop: 8 }}>Team-Ziele</h3>
            {emp.teamGoals.map((goal) => (
              <Card key={goal.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{goal.title}</span>
                  <ContributionBadge level={goal.contribution} />
                </div>
                <div className="goal-progress-row">
                  <div style={{ flex: 1 }}><ProgressBar value={goal.progress} color="var(--blue)" /></div>
                  <span className="goal-percent">{goal.progress}%</span>
                </div>
              </Card>
            ))}
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
    </motion.div>
  );
}
