import { motion } from 'motion/react';
import Card from './Card';
import SalaryBandViz from './SalaryBandViz';
import { calcWeightedGoalScore, calcSalaryRecommendation } from '../utils/calculations';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export default function DashboardView({ employees, onSelect }) {
  const avgScore = employees.reduce((s, e) => s + e.performanceScore, 0) / employees.length;
  const avgGoal = employees.reduce((s, e) => s + calcWeightedGoalScore(e.personalGoals), 0) / employees.length;
  const totalExtras = employees.reduce((s, e) => s + e.extras.length, 0);
  const topPerformer = [...employees].sort((a, b) => b.performanceScore - a.performanceScore)[0];

  const kpis = [
    { label: 'Ø Performance', value: avgScore.toFixed(1), sub: '/ 5.0', color: 'var(--accent)' },
    { label: 'Ø Zielerreichung', value: `${Math.round(avgGoal)}%`, sub: 'gewichtet', color: 'var(--blue)' },
    { label: 'Extra-Leistungen', value: totalExtras, sub: 'erfasst', color: 'var(--purple)' },
    { label: 'Top Performer', value: topPerformer.avatar, sub: topPerformer.name, color: 'var(--warning)' },
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

      <motion.div variants={fadeUp}>
        <h3 className="section-title">Mitarbeiter</h3>
        <div className="employee-list">
          {employees.map((emp) => {
            const rec = calcSalaryRecommendation(emp);
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
                      Empf.: <span className="stat-value" style={{ color: 'var(--purple)' }}>+{rec.percentage}%</span>
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
          <h3 className="section-title" style={{ marginBottom: 16 }}>Gehaltsempfehlungen – Übersicht</h3>
          {employees.map((emp) => {
            const rec = calcSalaryRecommendation(emp);
            return (
              <div key={emp.id} className="salary-overview-row">
                <div className="salary-overview-header">
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{emp.name}</span>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      €{emp.currentSalary.toLocaleString('de-DE')} →{' '}
                      <span style={{ color: 'var(--purple)', fontWeight: 600 }}>
                        €{rec.newSalary.toLocaleString('de-DE')}
                      </span>
                    </span>
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>+{rec.percentage}%</span>
                  </div>
                </div>
                <SalaryBandViz current={emp.currentSalary} band={emp.salaryBand} market={emp.marketRate} newSalary={rec.newSalary} />
              </div>
            );
          })}
        </Card>
      </motion.div>
    </motion.div>
  );
}
