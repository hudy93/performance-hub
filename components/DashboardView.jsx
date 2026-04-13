'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import Card from './Card';
import ProgressBar from './ProgressBar';
import SalaryBandViz from './SalaryBandViz';
import { calcWeightedGoalScore, calcSalaryRecommendation, distributeBudget } from '@/utils/calculations';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

const emptyEmpForm = {
  name: '',
  roleId: '',
  currentSalary: '',
  performanceScore: '3.0',
};

const emptyRoleForm = {
  name: '',
  department: '',
  salaryBandMin: '',
  salaryBandMid: '',
  salaryBandMax: '',
  marketRate: '',
};

export default function DashboardView({ employees, roles, onSelect, onAddEmployee, onDeleteEmployee, onAddRole, onUpdateRole, onDeleteRole, budget, onBudgetChange, settings, onSettingsChange }) {
  const [editingBudget, setEditingBudget] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyEmpForm);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [roleForm, setRoleForm] = useState(emptyRoleForm);
  const [editingRoleId, setEditingRoleId] = useState(null);

  const avgScore = employees.length > 0 ? employees.reduce((s, e) => s + e.performanceScore, 0) / employees.length : 0;
  const avgGoal = employees.length > 0 ? employees.reduce((s, e) => s + calcWeightedGoalScore(e.personalGoals), 0) / employees.length : 0;
  const totalExtras = employees.reduce((s, e) => s + e.extras.length, 0);
  const topPerformer = [...employees].sort((a, b) => b.performanceScore - a.performanceScore)[0];

  const inflation = settings?.inflation ?? 3.2;
  const dist = distributeBudget(employees, budget, { inflation });
  const totalUsed = dist ? dist.allocations.reduce((s, a) => s + a.allocated, 0) : 0;
  const budgetUtilization = budget > 0 ? Math.round((totalUsed / budget) * 100) : 0;

  const kpis = [
    { label: 'Ø Performance', value: avgScore.toFixed(1), sub: '/ 5.0', color: 'var(--accent)' },
    { label: 'Ø Zielerreichung', value: `${Math.round(avgGoal)}%`, sub: 'gewichtet', color: 'var(--blue)' },
    { label: 'Extra-Leistungen', value: totalExtras, sub: 'erfasst', color: 'var(--purple)' },
    { label: 'Top Performer', value: topPerformer?.avatar || '—', sub: topPerformer?.name || 'Keine Mitarbeiter', color: 'var(--warning)' },
  ];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      style={{ display: 'flex', flexDirection: 'column', gap: 22 }}
    >
      <motion.div variants={fadeUp}>
        <h2 className="section-title section-title--serif">Performance Dashboard</h2>
        <p className="section-subtitle">Übersicht aller Mitarbeiter und Kennzahlen</p>
      </motion.div>

      <motion.div className="kpi-grid" variants={fadeUp}>
        {kpis.map((kpi, i) => (
          <Card key={i}>
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="kpi-sub">{kpi.sub}</div>
          </Card>
        ))}
      </motion.div>

      {/* Budget card */}
      <motion.div variants={fadeUp}>
        <Card style={{ background: 'linear-gradient(135deg, var(--surface), rgba(74,222,128,0.03))', borderColor: 'rgba(74,222,128,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div className="kpi-label">Verfügbares Budget</div>
              {editingBudget ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>€</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    defaultValue={budget}
                    className="input"
                    style={{ width: 140, fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-display)' }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt(e.target.value);
                        if (val >= 0) onBudgetChange(val);
                        setEditingBudget(false);
                      }
                      if (e.key === 'Escape') setEditingBudget(false);
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 0) onBudgetChange(val);
                      setEditingBudget(false);
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-display)', cursor: 'pointer', marginTop: 4 }}
                  onClick={() => setEditingBudget(true)}
                  title="Klicken zum Bearbeiten"
                >
                  €{budget.toLocaleString('de-DE')}
                  <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 8, fontFamily: 'var(--font-body)', fontWeight: 400 }}>✎</span>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="kpi-label">Auslastung</div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', marginTop: 4, color: budgetUtilization > 100 ? 'var(--danger)' : 'var(--accent)' }}>
                {budgetUtilization}%
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>Verteilt: €{totalUsed.toLocaleString('de-DE')}</span>
              <span>
                {dist && dist.remaining > 0
                  ? `Verbleibend: €${dist.remaining.toLocaleString('de-DE')}`
                  : dist && dist.totalIdeal > budget
                    ? `Fehlbetrag: €${(dist.totalIdeal - budget).toLocaleString('de-DE')}`
                    : 'Vollständig verteilt'}
              </span>
            </div>
            <ProgressBar
              value={Math.min(budgetUtilization, 100)}
              color={budgetUtilization > 100 ? 'var(--danger)' : 'var(--accent)'}
              height={8}
            />
          </div>

          {dist && dist.totalIdeal > budget && (
            <div style={{ fontSize: 11, color: 'var(--warning)', padding: '8px 12px', background: 'var(--warning-dim)', borderRadius: 'var(--radius-sm)', marginTop: 4 }}>
              Budget reicht nicht für ideale Empfehlungen (€{dist.totalIdeal.toLocaleString('de-DE')} benötigt). Erhöhungen werden proportional gekürzt.
            </div>
          )}
        </Card>
      </motion.div>

      {/* GitHub Org card */}
      <motion.div variants={fadeUp}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="kpi-label">GitHub Organisation</div>
              <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 4 }}>
                {settings?.githubOrg || ''}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                className="input"
                style={{ width: 200 }}
                placeholder="GitHub Org..."
                defaultValue={settings?.githubOrg || ''}
                onBlur={(e) => {
                  if (e.target.value !== settings?.githubOrg) {
                    onSettingsChange({ ...settings, githubOrg: e.target.value });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSettingsChange({ ...settings, githubOrg: e.target.value });
                    e.target.blur();
                  }
                }}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Inflation setting */}
      <motion.div variants={fadeUp}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="kpi-label">Inflationsrate (%)</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>Basisanpassung für alle Mitarbeiter</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                step="0.1"
                style={{ width: 80, textAlign: 'right' }}
                defaultValue={settings?.inflation ?? 3.2}
                onBlur={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0 && val <= 100 && val !== settings?.inflation) {
                    onSettingsChange({ ...settings, inflation: val });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0 && val <= 100) {
                      onSettingsChange({ ...settings, inflation: val });
                    }
                    e.target.blur();
                  }
                }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>%</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Role management */}
      <motion.div variants={fadeUp}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="section-title" style={{ margin: 0 }}>Rollen & Gehaltsbänder</h3>
          <button
            className="btn btn--ghost"
            onClick={() => setShowRoleManager(!showRoleManager)}
          >
            {showRoleManager ? '✕ Schließen' : '⚙ Verwalten'}
          </button>
        </div>

        {!showRoleManager && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {roles.map((r) => (
              <div key={r.id} style={{ padding: '6px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{r.name}</span>
                <span style={{ color: 'var(--text-dim)', marginLeft: 8 }}>
                  €{r.salaryBand.min.toLocaleString('de-DE')} – €{r.salaryBand.max.toLocaleString('de-DE')}
                </span>
              </div>
            ))}
          </div>
        )}

        {showRoleManager && (
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {roles.map((r) => {
                const isEditing = editingRoleId === r.id;
                if (isEditing) {
                  return (
                    <div key={r.id} style={{ padding: 12, background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <input className="input" placeholder="Rollenname" defaultValue={r.name} id={`role-name-${r.id}`} />
                        <input className="input" placeholder="Abteilung" defaultValue={r.department} id={`role-dept-${r.id}`} />
                        <input className="input" type="number" placeholder="Band Min" defaultValue={r.salaryBand.min} id={`role-min-${r.id}`} />
                        <input className="input" type="number" placeholder="Band Mitte" defaultValue={r.salaryBand.mid} id={`role-mid-${r.id}`} />
                        <input className="input" type="number" placeholder="Band Max" defaultValue={r.salaryBand.max} id={`role-max-${r.id}`} />
                        <input className="input" type="number" placeholder="Marktwert" defaultValue={r.marketRate} id={`role-market-${r.id}`} />
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                        <button className="btn btn--ghost" onClick={() => setEditingRoleId(null)}>Abbrechen</button>
                        <button className="btn btn--primary" onClick={() => {
                          onUpdateRole({
                            id: r.id,
                            name: document.getElementById(`role-name-${r.id}`).value,
                            department: document.getElementById(`role-dept-${r.id}`).value,
                            salaryBand: {
                              min: parseInt(document.getElementById(`role-min-${r.id}`).value),
                              mid: parseInt(document.getElementById(`role-mid-${r.id}`).value),
                              max: parseInt(document.getElementById(`role-max-${r.id}`).value),
                            },
                            marketRate: parseInt(document.getElementById(`role-market-${r.id}`).value),
                          });
                          setEditingRoleId(null);
                        }}>Speichern</button>
                      </div>
                    </div>
                  );
                }
                const empCount = employees.filter((e) => e.role === r.name).length;
                return (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {r.department} · €{r.salaryBand.min.toLocaleString('de-DE')} – €{r.salaryBand.max.toLocaleString('de-DE')} · Markt: €{r.marketRate.toLocaleString('de-DE')} · {empCount} Mitarbeiter
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn--ghost" onClick={() => setEditingRoleId(r.id)}>✎</button>
                      <button
                        className="btn btn--ghost"
                        style={{ color: empCount > 0 ? 'var(--text-dim)' : 'var(--danger)' }}
                        disabled={empCount > 0}
                        title={empCount > 0 ? 'Rolle wird noch verwendet' : 'Rolle löschen'}
                        onClick={() => onDeleteRole(r.id)}
                      >✕</button>
                    </div>
                  </div>
                );
              })}

              {/* Add new role */}
              <div style={{ padding: 12, borderTop: '1px solid var(--border)', marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Neue Rolle anlegen</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input className="input" placeholder="Rollenname" value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} />
                  <input className="input" placeholder="Abteilung" value={roleForm.department} onChange={(e) => setRoleForm({ ...roleForm, department: e.target.value })} />
                  <input className="input" type="number" placeholder="Band Min" value={roleForm.salaryBandMin} onChange={(e) => setRoleForm({ ...roleForm, salaryBandMin: e.target.value })} />
                  <input className="input" type="number" placeholder="Band Mitte" value={roleForm.salaryBandMid} onChange={(e) => setRoleForm({ ...roleForm, salaryBandMid: e.target.value })} />
                  <input className="input" type="number" placeholder="Band Max" value={roleForm.salaryBandMax} onChange={(e) => setRoleForm({ ...roleForm, salaryBandMax: e.target.value })} />
                  <input className="input" type="number" placeholder="Marktwert" value={roleForm.marketRate} onChange={(e) => setRoleForm({ ...roleForm, marketRate: e.target.value })} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    className="btn btn--primary"
                    disabled={!roleForm.name || !roleForm.department || !roleForm.salaryBandMin || !roleForm.salaryBandMax}
                    onClick={async () => {
                      await onAddRole({
                        name: roleForm.name,
                        department: roleForm.department,
                        salaryBand: {
                          min: parseInt(roleForm.salaryBandMin),
                          mid: parseInt(roleForm.salaryBandMid) || Math.round((parseInt(roleForm.salaryBandMin) + parseInt(roleForm.salaryBandMax)) / 2),
                          max: parseInt(roleForm.salaryBandMax),
                        },
                        marketRate: parseInt(roleForm.marketRate) || Math.round(parseInt(roleForm.salaryBandMid || ((parseInt(roleForm.salaryBandMin) + parseInt(roleForm.salaryBandMax)) / 2)) * 1.05),
                      });
                      setRoleForm(emptyRoleForm);
                    }}
                  >
                    Rolle anlegen
                  </button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </motion.div>

      <motion.div variants={fadeUp}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="section-title" style={{ margin: 0 }}>Mitarbeiter</h3>
          <button
            className="btn btn--primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '✕ Abbrechen' : '+ Hinzufügen'}
          </button>
        </div>

        {showAddForm && (() => {
          const selectedRole = roles.find((r) => r.id === parseInt(form.roleId));
          return (
            <Card className="card--dashed" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>
                Neuen Mitarbeiter anlegen
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <select className="select" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
                  <option value="">Rolle wählen...</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.department})</option>
                  ))}
                </select>
                <input className="input" type="number" placeholder="Aktuelles Gehalt" value={form.currentSalary} onChange={(e) => setForm({ ...form, currentSalary: e.target.value })} />
                <input className="input" type="number" step="0.1" min="1" max="5" placeholder="Performance Score (1-5)" value={form.performanceScore} onChange={(e) => setForm({ ...form, performanceScore: e.target.value })} />
              </div>
              {selectedRole && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-muted)' }}>
                  Gehaltsband: €{selectedRole.salaryBand.min.toLocaleString('de-DE')} – €{selectedRole.salaryBand.max.toLocaleString('de-DE')} (Mitte: €{selectedRole.salaryBand.mid.toLocaleString('de-DE')}) · Marktwert: €{selectedRole.marketRate.toLocaleString('de-DE')}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  className="btn btn--primary"
                  disabled={!form.name || !form.roleId || !form.currentSalary}
                  onClick={async () => {
                    const initials = form.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
                    const newEmp = {
                      name: form.name,
                      role: selectedRole.name,
                      department: selectedRole.department,
                      avatar: initials,
                      currentSalary: parseInt(form.currentSalary),
                      salaryBand: { ...selectedRole.salaryBand },
                      marketRate: selectedRole.marketRate,
                      personalGoals: [],
                      teamGoals: [],
                      extras: [],
                      highlights: [],
                      performanceScore: parseFloat(form.performanceScore) || 3.0,
                      lastReview: new Date().toISOString().split('T')[0],
                    };
                    await onAddEmployee(newEmp);
                    setForm(emptyEmpForm);
                    setShowAddForm(false);
                  }}
                >
                  Mitarbeiter anlegen
                </button>
              </div>
            </Card>
          );
        })()}

        <div className="employee-list">
          {employees.map((emp) => {
            const rec = calcSalaryRecommendation(emp, { inflation });
            const alloc = dist?.allocations.find((a) => a.empId === emp.id);
            const goalScore = calcWeightedGoalScore(emp.personalGoals);
            const scoreColor =
              emp.performanceScore >= 4 ? 'var(--accent)' :
              emp.performanceScore >= 3 ? 'var(--blue)' :
              'var(--danger)';

            return (
              <Card key={emp.id} onClick={() => onSelect(emp)} className="employee-row">
                <div className="employee-avatar">{emp.avatar}</div>
                <div className="employee-info">
                  <div>
                    <span className="employee-name">{emp.name}</span>
                    <span className="employee-role">{emp.role}</span>
                  </div>
                  <div className="employee-stats">
                    <span className="stat-label">
                      Score: <span className="stat-value" style={{ color: scoreColor }}>{emp.performanceScore}</span>
                    </span>
                    <span className="stat-label">
                      Ziele: <span className="stat-value" style={{ color: 'var(--text)' }}>{Math.round(goalScore)}%</span>
                    </span>
                    <span className="stat-label">
                      Budget: <span className="stat-value" style={{ color: 'var(--purple)' }}>
                        +€{(alloc?.allocated ?? rec.increaseAbsolute).toLocaleString('de-DE')}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="employee-arrow">→</div>
              </Card>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <h3 className="section-title" style={{ marginBottom: 16 }}>Budgetverteilung – Übersicht</h3>
          {employees.map((emp) => {
            const rec = calcSalaryRecommendation(emp, { inflation });
            const alloc = dist?.allocations.find((a) => a.empId === emp.id);
            const allocated = alloc?.allocated ?? rec.increaseAbsolute;
            const newSalary = alloc?.newSalary ?? rec.newSalary;
            const pct = alloc?.percentage ?? rec.percentage;
            const share = totalUsed > 0 ? Math.round((allocated / totalUsed) * 100) : 0;

            return (
              <div key={emp.id} className="salary-overview-row">
                <div className="salary-overview-header">
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{emp.name}</span>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      €{emp.currentSalary.toLocaleString('de-DE')} →{' '}
                      <span style={{ color: 'var(--purple)', fontWeight: 600 }}>
                        €{newSalary.toLocaleString('de-DE')}
                      </span>
                    </span>
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>+{pct}%</span>
                    <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>({share}% vom Budget)</span>
                  </div>
                </div>
                <SalaryBandViz current={emp.currentSalary} band={emp.salaryBand} market={emp.marketRate} newSalary={newSalary} />
                {alloc?.isCapped && (
                  <div style={{ fontSize: 11, color: 'var(--warning)', marginTop: 4 }}>
                    Ideal: +€{rec.increaseAbsolute.toLocaleString('de-DE')} (+{rec.percentage}%) · Gekürzt auf +€{allocated.toLocaleString('de-DE')}
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      </motion.div>
    </motion.div>
  );
}
