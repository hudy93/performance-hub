import { useState, useEffect, useCallback } from "react";

const FONT_URL = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&display=swap";

const COLORS = {
  bg: "#0C0F14",
  surface: "#151921",
  surfaceHover: "#1C2230",
  border: "#252D3A",
  borderLight: "#2E3848",
  text: "#E8ECF1",
  textMuted: "#8892A2",
  textDim: "#5C6578",
  accent: "#4ADE80",
  accentDim: "rgba(74,222,128,0.12)",
  accentGlow: "rgba(74,222,128,0.25)",
  warning: "#FBBF24",
  warningDim: "rgba(251,191,36,0.12)",
  danger: "#F87171",
  dangerDim: "rgba(248,113,113,0.12)",
  blue: "#60A5FA",
  blueDim: "rgba(96,165,250,0.12)",
  purple: "#A78BFA",
  purpleDim: "rgba(167,139,250,0.12)",
};

const initialEmployees = [
  {
    id: 1, name: "Laura Müller", role: "Senior Engineer", department: "Engineering", avatar: "LM",
    currentSalary: 78000, salaryBand: { min: 70000, mid: 82000, max: 95000 },
    marketRate: 85000, inflation: 3.2,
    personalGoals: [
      { id: 1, title: "AWS Solutions Architect Zertifizierung", progress: 85, weight: 25, status: "on-track" },
      { id: 2, title: "3 Tech-Talks halten", progress: 66, weight: 15, status: "on-track" },
      { id: 3, title: "Mentoring von 2 Junioren", progress: 100, weight: 20, status: "completed" },
    ],
    teamGoals: [
      { id: 1, title: "System-Latenz um 40% reduzieren", progress: 72, contribution: "high" },
      { id: 2, title: "Test-Coverage auf 85% erhöhen", progress: 90, contribution: "medium" },
    ],
    extras: [
      { id: 1, text: "On-Call Wochenenden übernommen (3x)", category: "reliability", date: "2025-Q4" },
      { id: 2, text: "Interne Dokumentation komplett überarbeitet", category: "initiative", date: "2025-Q3" },
      { id: 3, text: "Neues CI/CD Pipeline-Konzept entwickelt", category: "innovation", date: "2026-Q1" },
    ],
    highlights: ["Teamübergreifende Zusammenarbeit", "Proaktive Problemlösung", "Wissenstransfer"],
    performanceScore: 4.2, lastReview: "2025-10-15",
  },
  {
    id: 2, name: "Thomas Weber", role: "Product Manager", department: "Product", avatar: "TW",
    currentSalary: 72000, salaryBand: { min: 65000, mid: 78000, max: 90000 },
    marketRate: 80000, inflation: 3.2,
    personalGoals: [
      { id: 1, title: "Product Analytics Framework aufbauen", progress: 60, weight: 30, status: "at-risk" },
      { id: 2, title: "Stakeholder-NPS auf 8+ bringen", progress: 45, weight: 25, status: "behind" },
      { id: 3, title: "OKR-Prozess einführen", progress: 100, weight: 20, status: "completed" },
    ],
    teamGoals: [
      { id: 1, title: "Feature-Adoption Rate +30%", progress: 55, contribution: "high" },
      { id: 2, title: "Sprint Velocity stabilisieren", progress: 80, contribution: "medium" },
    ],
    extras: [
      { id: 1, text: "Kunden-Workshop-Reihe initiiert", category: "initiative", date: "2025-Q4" },
      { id: 2, text: "Cross-functional Retros eingeführt", category: "culture", date: "2026-Q1" },
    ],
    highlights: ["Kundenorientierung", "Strukturiertes Arbeiten"],
    performanceScore: 3.5, lastReview: "2025-10-15",
  },
  {
    id: 3, name: "Sarah Koch", role: "UX Designerin", department: "Design", avatar: "SK",
    currentSalary: 62000, salaryBand: { min: 55000, mid: 68000, max: 80000 },
    marketRate: 70000, inflation: 3.2,
    personalGoals: [
      { id: 1, title: "Design System v2.0 launchen", progress: 95, weight: 35, status: "on-track" },
      { id: 2, title: "Usability Testing Prozess etablieren", progress: 100, weight: 25, status: "completed" },
      { id: 3, title: "Figma-to-Code Workflow optimieren", progress: 70, weight: 15, status: "on-track" },
    ],
    teamGoals: [
      { id: 1, title: "User Satisfaction Score >4.5", progress: 88, contribution: "high" },
      { id: 2, title: "Design Review Cycle < 2 Tage", progress: 95, contribution: "high" },
    ],
    extras: [
      { id: 1, text: "Accessibility Audit durchgeführt und Fixes geleitet", category: "quality", date: "2025-Q4" },
      { id: 2, text: "Design-Meetup im Unternehmen organisiert", category: "culture", date: "2026-Q1" },
      { id: 3, text: "Onboarding-Materialien für neue Designer erstellt", category: "initiative", date: "2025-Q3" },
    ],
    highlights: ["Exzellente Qualität", "Teamkultur-Beitrag", "Eigeninitiative", "Accessibility-Champion"],
    performanceScore: 4.6, lastReview: "2025-10-15",
  },
  {
    id: 4, name: "Markus Braun", role: "DevOps Engineer", department: "Engineering", avatar: "MB",
    currentSalary: 70000, salaryBand: { min: 65000, mid: 78000, max: 90000 },
    marketRate: 82000, inflation: 3.2,
    personalGoals: [
      { id: 1, title: "Kubernetes Migration abschließen", progress: 40, weight: 35, status: "behind" },
      { id: 2, title: "Disaster Recovery Plan erstellen", progress: 30, weight: 25, status: "at-risk" },
      { id: 3, title: "Monitoring-Dashboard aufbauen", progress: 80, weight: 15, status: "on-track" },
    ],
    teamGoals: [
      { id: 1, title: "System-Latenz um 40% reduzieren", progress: 72, contribution: "low" },
      { id: 2, title: "99.9% Uptime erreichen", progress: 65, contribution: "high" },
    ],
    extras: [
      { id: 1, text: "Notfall-Deployment am Wochenende durchgeführt", category: "reliability", date: "2026-Q1" },
    ],
    highlights: ["Zuverlässigkeit in Krisen"],
    performanceScore: 2.8, lastReview: "2025-10-15",
  },
];

const categoryLabels = {
  reliability: "Zuverlässigkeit",
  initiative: "Eigeninitiative",
  innovation: "Innovation",
  culture: "Kultur",
  quality: "Qualität",
};

const categoryColors = {
  reliability: COLORS.blue,
  initiative: COLORS.accent,
  innovation: COLORS.purple,
  culture: COLORS.warning,
  quality: COLORS.blue,
};

function calcWeightedGoalScore(goals) {
  if (!goals.length) return 0;
  const totalWeight = goals.reduce((s, g) => s + (g.weight || 0), 0);
  if (!totalWeight) return goals.reduce((s, g) => s + g.progress, 0) / goals.length;
  return goals.reduce((s, g) => s + (g.progress * (g.weight || 0)) / totalWeight, 0);
}

function calcSalaryRecommendation(emp) {
  const goalScore = calcWeightedGoalScore(emp.personalGoals);
  const teamAvg = emp.teamGoals.reduce((s, g) => s + g.progress, 0) / (emp.teamGoals.length || 1);
  const extrasBonus = Math.min(emp.extras.length * 0.4, 2.0);
  const highlightsBonus = Math.min(emp.highlights.length * 0.25, 1.5);
  const performanceMultiplier = (goalScore / 100) * 0.3 + (teamAvg / 100) * 0.2 + (emp.performanceScore / 5) * 0.3 + (extrasBonus / 2) * 0.1 + (highlightsBonus / 1.5) * 0.1;
  const marketGap = ((emp.marketRate - emp.currentSalary) / emp.currentSalary) * 100;
  const bandPosition = ((emp.currentSalary - emp.salaryBand.min) / (emp.salaryBand.max - emp.salaryBand.min)) * 100;
  let baseIncrease = emp.inflation;
  baseIncrease += performanceMultiplier * 6;
  if (marketGap > 5) baseIncrease += Math.min(marketGap * 0.3, 3);
  if (bandPosition < 30) baseIncrease += 1.5;
  else if (bandPosition > 80) baseIncrease *= 0.7;
  const finalIncrease = Math.round(Math.max(0, Math.min(baseIncrease, 15)) * 10) / 10;
  const newSalary = Math.round(emp.currentSalary * (1 + finalIncrease / 100));
  return { percentage: finalIncrease, newSalary, marketGap: Math.round(marketGap * 10) / 10, bandPosition: Math.round(bandPosition), performanceMultiplier: Math.round(performanceMultiplier * 100) };
}

function ProgressRing({ value, size = 48, stroke = 4, color = COLORS.accent }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLORS.border} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
    </svg>
  );
}

function ProgressBar({ value, color = COLORS.accent, height = 6 }) {
  return (
    <div style={{ width: "100%", height, background: COLORS.border, borderRadius: height / 2, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(value, 100)}%`, height: "100%", background: color, borderRadius: height / 2, transition: "width 0.8s ease" }} />
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    completed: { label: "Erledigt", bg: COLORS.accentDim, color: COLORS.accent },
    "on-track": { label: "Im Plan", bg: COLORS.blueDim, color: COLORS.blue },
    "at-risk": { label: "Gefährdet", bg: COLORS.warningDim, color: COLORS.warning },
    behind: { label: "Verzögert", bg: COLORS.dangerDim, color: COLORS.danger },
  };
  const s = map[status] || map["on-track"];
  return (
    <span style={{ padding: "3px 10px", borderRadius: 99, background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, letterSpacing: 0.3 }}>
      {s.label}
    </span>
  );
}

function ContributionBadge({ level }) {
  const map = {
    high: { label: "Hoch", color: COLORS.accent },
    medium: { label: "Mittel", color: COLORS.warning },
    low: { label: "Niedrig", color: COLORS.textDim },
  };
  const c = map[level] || map.medium;
  return <span style={{ color: c.color, fontSize: 11, fontWeight: 600 }}>● {c.label}</span>;
}

function ScoreGauge({ score, max = 5 }) {
  const pct = (score / max) * 100;
  const color = pct >= 80 ? COLORS.accent : pct >= 60 ? COLORS.blue : pct >= 40 ? COLORS.warning : COLORS.danger;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <ProgressRing value={pct} size={56} stroke={5} color={color} />
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, fontFamily: "'Instrument Serif', serif" }}>{score.toFixed(1)}</div>
        <div style={{ fontSize: 11, color: COLORS.textMuted }}>von {max}.0</div>
      </div>
    </div>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: 20,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        ...style,
      }}
      onMouseEnter={(e) => { if (onClick) { e.currentTarget.style.borderColor = COLORS.borderLight; e.currentTarget.style.background = COLORS.surfaceHover; } }}
      onMouseLeave={(e) => { if (onClick) { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = COLORS.surface; } }}
    >
      {children}
    </div>
  );
}

function SalaryBandViz({ current, band, market, newSalary }) {
  const range = band.max - band.min;
  const pos = (v) => Math.max(0, Math.min(100, ((v - band.min) / range) * 100));
  return (
    <div style={{ padding: "12px 0" }}>
      <div style={{ position: "relative", height: 32, margin: "8px 0" }}>
        <div style={{ position: "absolute", top: 12, left: 0, right: 0, height: 8, background: COLORS.border, borderRadius: 4 }} />
        <div style={{ position: "absolute", top: 12, left: `${pos(band.min)}%`, width: `${pos(band.max) - pos(band.min)}%`, height: 8, background: "linear-gradient(90deg, rgba(74,222,128,0.15), rgba(96,165,250,0.15))", borderRadius: 4 }} />
        <div style={{ position: "absolute", top: 6, left: `${pos(current)}%`, transform: "translateX(-50%)", width: 20, height: 20, borderRadius: "50%", background: COLORS.accent, border: `3px solid ${COLORS.bg}`, zIndex: 3 }} title={`Aktuell: €${current.toLocaleString("de-DE")}`} />
        {newSalary && (
          <div style={{ position: "absolute", top: 6, left: `${pos(newSalary)}%`, transform: "translateX(-50%)", width: 20, height: 20, borderRadius: "50%", background: COLORS.purple, border: `3px solid ${COLORS.bg}`, zIndex: 2, opacity: 0.8 }} title={`Empfohlen: €${newSalary.toLocaleString("de-DE")}`} />
        )}
        <div style={{ position: "absolute", top: 4, left: `${pos(market)}%`, transform: "translateX(-50%)", zIndex: 1 }}>
          <div style={{ width: 2, height: 24, background: COLORS.warning, margin: "0 auto" }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: COLORS.textDim, marginTop: 4 }}>
        <span>€{band.min.toLocaleString("de-DE")}</span>
        <span style={{ color: COLORS.textMuted }}>Mitte: €{band.mid.toLocaleString("de-DE")}</span>
        <span>€{band.max.toLocaleString("de-DE")}</span>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.accent, display: "inline-block" }} /> Aktuell</span>
        {newSalary && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.purple, display: "inline-block" }} /> Empfohlen</span>}
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 2, height: 10, background: COLORS.warning, display: "inline-block" }} /> Markt</span>
      </div>
    </div>
  );
}

// ─── VIEWS ───

function DashboardView({ employees, onSelect }) {
  const avgScore = employees.reduce((s, e) => s + e.performanceScore, 0) / employees.length;
  const avgGoal = employees.reduce((s, e) => s + calcWeightedGoalScore(e.personalGoals), 0) / employees.length;
  const totalExtras = employees.reduce((s, e) => s + e.extras.length, 0);
  const topPerformer = [...employees].sort((a, b) => b.performanceScore - a.performanceScore)[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, fontWeight: 400, color: COLORS.text, margin: 0 }}>
          Performance Dashboard
        </h2>
        <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "4px 0 0" }}>Übersicht aller Mitarbeiter und Kennzahlen</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "Ø Performance", value: avgScore.toFixed(1), sub: "/ 5.0", color: COLORS.accent },
          { label: "Ø Zielerreichung", value: `${Math.round(avgGoal)}%`, sub: "gewichtet", color: COLORS.blue },
          { label: "Extra-Leistungen", value: totalExtras, sub: "erfasst", color: COLORS.purple },
          { label: "Top Performer", value: topPerformer.avatar, sub: topPerformer.name, color: COLORS.warning },
        ].map((kpi, i) => (
          <Card key={i}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>{kpi.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color, fontFamily: "'Instrument Serif', serif" }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>{kpi.sub}</div>
          </Card>
        ))}
      </div>

      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: "0 0 12px" }}>Mitarbeiter</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {employees.map((emp) => {
            const rec = calcSalaryRecommendation(emp);
            const goalScore = calcWeightedGoalScore(emp.personalGoals);
            return (
              <Card key={emp.id} onClick={() => onSelect(emp)} style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${COLORS.accentDim}, ${COLORS.blueDim})`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: COLORS.accent, flexShrink: 0,
                  }}>
                    {emp.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>{emp.name}</span>
                      <span style={{ fontSize: 11, color: COLORS.textMuted }}>{emp.role}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 6, fontSize: 12 }}>
                      <span style={{ color: COLORS.textMuted }}>Score: <span style={{ color: emp.performanceScore >= 4 ? COLORS.accent : emp.performanceScore >= 3 ? COLORS.blue : COLORS.danger, fontWeight: 600 }}>{emp.performanceScore}</span></span>
                      <span style={{ color: COLORS.textMuted }}>Ziele: <span style={{ fontWeight: 600, color: COLORS.text }}>{Math.round(goalScore)}%</span></span>
                      <span style={{ color: COLORS.textMuted }}>Empf. Erhöhung: <span style={{ fontWeight: 600, color: COLORS.purple }}>+{rec.percentage}%</span></span>
                    </div>
                  </div>
                  <div style={{ color: COLORS.textDim, fontSize: 18 }}>→</div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: "0 0 16px" }}>Gehaltsempfehlungen – Übersicht</h3>
        {employees.map((emp) => {
          const rec = calcSalaryRecommendation(emp);
          return (
            <div key={emp.id} style={{ padding: "12px 0", borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.text }}>{emp.name}</span>
                <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                  <span style={{ color: COLORS.textMuted }}>€{emp.currentSalary.toLocaleString("de-DE")} → <span style={{ color: COLORS.purple, fontWeight: 600 }}>€{rec.newSalary.toLocaleString("de-DE")}</span></span>
                  <span style={{ color: COLORS.accent, fontWeight: 700 }}>+{rec.percentage}%</span>
                </div>
              </div>
              <SalaryBandViz current={emp.currentSalary} band={emp.salaryBand} market={emp.marketRate} newSalary={rec.newSalary} />
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function EmployeeDetail({ emp, onBack, onUpdate }) {
  const [activeTab, setActiveTab] = useState("goals");
  const [editingGoal, setEditingGoal] = useState(null);
  const [newExtra, setNewExtra] = useState("");
  const [newExtraCat, setNewExtraCat] = useState("initiative");
  const rec = calcSalaryRecommendation(emp);
  const goalScore = calcWeightedGoalScore(emp.personalGoals);

  const updateGoalProgress = (goalId, newProgress) => {
    const updated = {
      ...emp,
      personalGoals: emp.personalGoals.map((g) =>
        g.id === goalId ? { ...g, progress: Math.max(0, Math.min(100, newProgress)), status: newProgress >= 100 ? "completed" : newProgress >= 60 ? "on-track" : newProgress >= 30 ? "at-risk" : "behind" } : g
      ),
    };
    onUpdate(updated);
    setEditingGoal(null);
  };

  const addExtra = () => {
    if (!newExtra.trim()) return;
    const updated = {
      ...emp,
      extras: [...emp.extras, { id: Date.now(), text: newExtra, category: newExtraCat, date: "2026-Q2" }],
    };
    onUpdate(updated);
    setNewExtra("");
  };

  const tabs = [
    { key: "goals", label: "Ziele" },
    { key: "extras", label: "Extra-Leistungen" },
    { key: "salary", label: "Gehalt & Empfehlung" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 13, padding: 0, textAlign: "left", fontFamily: "'DM Sans', sans-serif" }}>
        ← Zurück zum Dashboard
      </button>

      <Card>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${COLORS.accentDim}, ${COLORS.purpleDim})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: COLORS.accent, flexShrink: 0,
          }}>
            {emp.avatar}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, color: COLORS.text, margin: 0 }}>{emp.name}</h2>
            <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "2px 0 0" }}>{emp.role} · {emp.department}</p>
            <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
              {emp.highlights.map((h, i) => (
                <span key={i} style={{ padding: "3px 10px", borderRadius: 99, background: COLORS.accentDim, color: COLORS.accent, fontSize: 11, fontWeight: 500 }}>
                  {h}
                </span>
              ))}
            </div>
          </div>
          <ScoreGauge score={emp.performanceScore} />
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <Card>
          <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Zielerreichung</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.accent, fontFamily: "'Instrument Serif', serif" }}>{Math.round(goalScore)}%</div>
          <div style={{ fontSize: 11, color: COLORS.textDim }}>gewichtet</div>
        </Card>
        <Card>
          <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Gehaltsempfehlung</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.purple, fontFamily: "'Instrument Serif', serif" }}>+{rec.percentage}%</div>
          <div style={{ fontSize: 11, color: COLORS.textDim }}>€{rec.newSalary.toLocaleString("de-DE")}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>Marktvergleich</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: rec.marketGap > 0 ? COLORS.danger : COLORS.accent, fontFamily: "'Instrument Serif', serif" }}>
            {rec.marketGap > 0 ? `-${rec.marketGap}%` : `+${Math.abs(rec.marketGap)}%`}
          </div>
          <div style={{ fontSize: 11, color: COLORS.textDim }}>vs. Marktniveau</div>
        </Card>
      </div>

      <div style={{ display: "flex", gap: 4, background: COLORS.surface, borderRadius: 10, padding: 4, border: `1px solid ${COLORS.border}` }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              background: activeTab === tab.key ? COLORS.accentDim : "transparent",
              color: activeTab === tab.key ? COLORS.accent : COLORS.textMuted,
              fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "goals" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: 0 }}>Persönliche Ziele</h3>
          {emp.personalGoals.map((goal) => (
            <Card key={goal.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.text }}>{goal.title}</span>
                    <StatusBadge status={goal.status} />
                  </div>
                  <span style={{ fontSize: 11, color: COLORS.textDim }}>Gewichtung: {goal.weight}%</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {editingGoal === goal.id ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={goal.progress}
                        onKeyDown={(e) => { if (e.key === "Enter") updateGoalProgress(goal.id, parseInt(e.target.value)); }}
                        style={{ width: 50, padding: "4px 6px", borderRadius: 6, border: `1px solid ${COLORS.borderLight}`, background: COLORS.bg, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
                        autoFocus
                      />
                      <button onClick={() => setEditingGoal(null)} style={{ background: "none", border: "none", color: COLORS.textDim, cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingGoal(goal.id)} style={{ background: COLORS.accentDim, border: "none", color: COLORS.accent, cursor: "pointer", fontSize: 11, padding: "4px 10px", borderRadius: 6, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                      Bearbeiten
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <ProgressBar value={goal.progress} color={goal.status === "completed" ? COLORS.accent : goal.status === "on-track" ? COLORS.blue : goal.status === "at-risk" ? COLORS.warning : COLORS.danger} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, minWidth: 40, textAlign: "right" }}>{goal.progress}%</span>
              </div>
            </Card>
          ))}

          <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: "8px 0 0" }}>Team-Ziele</h3>
          {emp.teamGoals.map((goal) => (
            <Card key={goal.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.text }}>{goal.title}</span>
                <ContributionBadge level={goal.contribution} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}><ProgressBar value={goal.progress} color={COLORS.blue} /></div>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, minWidth: 40, textAlign: "right" }}>{goal.progress}%</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "extras" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: 0 }}>Besondere Leistungen & Auffälligkeiten</h3>
          {emp.extras.map((extra) => (
            <Card key={extra.id} style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: categoryColors[extra.category] || COLORS.accent, marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: COLORS.text }}>{extra.text}</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: categoryColors[extra.category] || COLORS.textMuted, fontWeight: 600 }}>
                      {categoryLabels[extra.category] || extra.category}
                    </span>
                    <span style={{ fontSize: 11, color: COLORS.textDim }}>{extra.date}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <Card style={{ borderStyle: "dashed" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8 }}>Neue Leistung erfassen</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                value={newExtra}
                onChange={(e) => setNewExtra(e.target.value)}
                placeholder="Beschreibung der Leistung..."
                style={{
                  flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.borderLight}`,
                  background: COLORS.bg, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                  outline: "none",
                }}
                onKeyDown={(e) => { if (e.key === "Enter") addExtra(); }}
              />
              <select
                value={newExtraCat}
                onChange={(e) => setNewExtraCat(e.target.value)}
                style={{
                  padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.borderLight}`,
                  background: COLORS.bg, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <button
                onClick={addExtra}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "none", background: COLORS.accent, color: COLORS.bg,
                  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}
              >
                + Hinzufügen
              </button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "salary" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, margin: "0 0 16px", fontFamily: "'Instrument Serif', serif" }}>Gehaltsanalyse & Empfehlung</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Aktuelles Gehalt</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, fontFamily: "'Instrument Serif', serif" }}>€{emp.currentSalary.toLocaleString("de-DE")}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Empfohlenes Gehalt</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.purple, fontFamily: "'Instrument Serif', serif" }}>€{rec.newSalary.toLocaleString("de-DE")}</div>
              </div>
            </div>
            <SalaryBandViz current={emp.currentSalary} band={emp.salaryBand} market={emp.marketRate} newSalary={rec.newSalary} />
          </Card>

          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: "0 0 14px" }}>Berechnungsfaktoren</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Inflation (Basisanpassung)", value: `${emp.inflation}%`, detail: "Automatische Mindestanpassung", color: COLORS.textMuted },
                { label: "Performance Score", value: `${emp.performanceScore} / 5.0`, detail: `Multiplier: ${rec.performanceMultiplier}%`, color: emp.performanceScore >= 4 ? COLORS.accent : emp.performanceScore >= 3 ? COLORS.blue : COLORS.danger },
                { label: "Gewichtete Zielerreichung", value: `${Math.round(goalScore)}%`, detail: `${emp.personalGoals.filter((g) => g.status === "completed").length} von ${emp.personalGoals.length} Zielen erledigt`, color: COLORS.blue },
                { label: "Marktposition", value: `€${emp.marketRate.toLocaleString("de-DE")}`, detail: `Differenz: ${rec.marketGap > 0 ? "-" : "+"}${Math.abs(rec.marketGap)}%`, color: rec.marketGap > 0 ? COLORS.danger : COLORS.accent },
                { label: "Position im Gehaltsband", value: `${rec.bandPosition}%`, detail: `${rec.bandPosition < 30 ? "Unteres Drittel → Aufholbedarf" : rec.bandPosition > 80 ? "Oberes Drittel → Gedämpft" : "Mittlerer Bereich"}`, color: rec.bandPosition < 30 ? COLORS.warning : rec.bandPosition > 80 ? COLORS.textDim : COLORS.accent },
                { label: "Extra-Leistungen Bonus", value: `${emp.extras.length} erfasst`, detail: `+${Math.min(emp.extras.length * 0.4, 2.0).toFixed(1)}% Bonus`, color: COLORS.purple },
                { label: "Highlights & Auffälligkeiten", value: `${emp.highlights.length} Stück`, detail: `+${Math.min(emp.highlights.length * 0.25, 1.5).toFixed(2)}% Bonus`, color: COLORS.warning },
              ].map((factor, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 6 ? `1px solid ${COLORS.border}` : "none" }}>
                  <div>
                    <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>{factor.label}</div>
                    <div style={{ fontSize: 11, color: COLORS.textDim }}>{factor.detail}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: factor.color }}>{factor.value}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ background: `linear-gradient(135deg, ${COLORS.surface}, rgba(167,139,250,0.05))`, borderColor: "rgba(167,139,250,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 4 }}>Empfohlene Gehaltserhöhung</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: COLORS.purple, fontFamily: "'Instrument Serif', serif" }}>+{rec.percentage}%</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: COLORS.textDim }}>€{emp.currentSalary.toLocaleString("de-DE")} → €{rec.newSalary.toLocaleString("de-DE")}</div>
                <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>+€{(rec.newSalary - emp.currentSalary).toLocaleString("de-DE")} / Jahr</div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ───

export default function PerformanceHub() {
  const [employees, setEmployees] = useState(initialEmployees);
  const [selectedId, setSelectedId] = useState(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_URL;
    document.head.appendChild(link);
    link.onload = () => setFontLoaded(true);
  }, []);

  const selectedEmp = employees.find((e) => e.id === selectedId);

  const handleUpdate = useCallback((updated) => {
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? { ...updated, performanceScore: updated.performanceScore } : e)));
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bg,
      color: COLORS.text,
      fontFamily: "'DM Sans', sans-serif",
      opacity: fontLoaded ? 1 : 0,
      transition: "opacity 0.3s",
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px 48px" }}>
        <header style={{ marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.blue})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16 }}>◆</span>
              </div>
              <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 400, margin: 0, color: COLORS.text }}>
                PerformanceHub
              </h1>
            </div>
          </div>
          <div style={{ fontSize: 11, color: COLORS.textDim }}>Q1 2026</div>
        </header>

        {selectedEmp ? (
          <EmployeeDetail
            emp={selectedEmp}
            onBack={() => setSelectedId(null)}
            onUpdate={handleUpdate}
          />
        ) : (
          <DashboardView employees={employees} onSelect={(emp) => setSelectedId(emp.id)} />
        )}
      </div>
    </div>
  );
}
