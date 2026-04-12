'use client';

import { useState, useMemo } from 'react';
import Card from './Card';

export default function GitHubActivityTab({ emp, onUpdate }) {
  const githubData = emp.githubData || { periods: [], lastSyncedEnd: null };
  const hasPreviousData = githubData.periods.length > 0;

  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const body = { endDate };
      if (!hasPreviousData && startDate) {
        body.startDate = startDate;
      }
      const res = await fetch(`/api/employees/${emp.id}/github-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Sync fehlgeschlagen');
      }
      const newGithubData = await res.json();
      onUpdate({ ...emp, githubData: newGithubData });
    } catch (err) {
      setSyncError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Filter periods by their startDate (which month they represent)
  const filteredPeriods = useMemo(() => {
    return githubData.periods.filter(p => {
      if (filterFrom && p.startDate < filterFrom) return false;
      if (filterTo && p.startDate > filterTo) return false;
      return true;
    });
  }, [githubData.periods, filterFrom, filterTo]);

  // Calculate summary from filtered data
  const summary = useMemo(() => {
    const totalPRs = filteredPeriods.reduce((s, p) => s + p.pullRequestsCount, 0);
    const totalReviews = filteredPeriods.reduce((s, p) => s + p.reviewsCount, 0);
    const allRepos = new Set(filteredPeriods.flatMap(p => p.repositories || []));
    return { totalPRs, totalReviews, totalRepos: allRepos.size };
  }, [filteredPeriods]);

  // Chart dimensions
  const chartHeight = 160;
  const chartPadding = { top: 20, right: 20, bottom: 30, left: 40 };

  const maxValue = Math.max(
    ...filteredPeriods.map(p => Math.max(p.pullRequestsCount, p.reviewsCount)),
    1
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* GitHub Username */}
      {!emp.githubUsername && (
        <Card style={{ background: 'var(--warning-dim)', borderColor: 'rgba(251,191,36,0.3)' }}>
          <div style={{ fontSize: 12, color: 'var(--warning)' }}>
            Kein GitHub-Benutzername hinterlegt. Bitte im Mitarbeiterprofil setzen.
          </div>
        </Card>
      )}

      {/* Sync controls */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>
          GitHub Daten synchronisieren
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {!hasPreviousData && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Von:</span>
              <input
                type="date"
                className="input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          )}
          {hasPreviousData && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Letzter Sync bis: {githubData.lastSyncedEnd}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Bis:</span>
            <input
              type="date"
              className="input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            className="btn btn--primary"
            onClick={handleSync}
            disabled={syncing || !emp.githubUsername || (!hasPreviousData && !startDate)}
          >
            {syncing ? 'Synchronisiere...' : 'Sync starten'}
          </button>
        </div>
        {syncError && (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--danger)' }}>
            {syncError}
          </div>
        )}
      </Card>

      {hasPreviousData && (
        <>
          {/* Filter */}
          <Card>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Filter:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Von:</span>
                <input type="date" className="input" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Bis:</span>
                <input type="date" className="input" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
              </div>
              {(filterFrom || filterTo) && (
                <button className="btn btn--ghost" onClick={() => { setFilterFrom(''); setFilterTo(''); }}>
                  Zurücksetzen
                </button>
              )}
            </div>
          </Card>

          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Card>
              <div className="kpi-label">Pull Requests</div>
              <div className="kpi-value" style={{ color: 'var(--accent)' }}>{summary.totalPRs}</div>
              <div className="kpi-sub">erstellt</div>
            </Card>
            <Card>
              <div className="kpi-label">Reviews</div>
              <div className="kpi-value" style={{ color: 'var(--blue)' }}>{summary.totalReviews}</div>
              <div className="kpi-sub">durchgeführt</div>
            </Card>
            <Card>
              <div className="kpi-label">Repositories</div>
              <div className="kpi-value" style={{ color: 'var(--purple)' }}>{summary.totalRepos}</div>
              <div className="kpi-sub">beigetragen</div>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>
              Aktivität über Zeit
            </div>
            {filteredPeriods.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-dim)', fontSize: 12 }}>
                Keine Daten im gewählten Zeitraum
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${filteredPeriods.length * 80 + chartPadding.left + chartPadding.right} ${chartHeight + chartPadding.top + chartPadding.bottom}`}
                style={{ width: '100%', height: chartHeight + chartPadding.top + chartPadding.bottom }}
              >
                {/* Y-axis labels */}
                {[0, Math.round(maxValue / 2), maxValue].map((val, i) => {
                  const y = chartPadding.top + chartHeight - (val / maxValue) * chartHeight;
                  return (
                    <g key={i}>
                      <line
                        x1={chartPadding.left}
                        x2={chartPadding.left + filteredPeriods.length * 80}
                        y1={y} y2={y}
                        stroke="var(--border)" strokeWidth="1"
                      />
                      <text x={chartPadding.left - 8} y={y + 4} textAnchor="end" fill="var(--text-dim)" fontSize="10">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Bars */}
                {filteredPeriods.map((period, i) => {
                  const x = chartPadding.left + i * 80;
                  const prHeight = (period.pullRequestsCount / maxValue) * chartHeight;
                  const reviewHeight = (period.reviewsCount / maxValue) * chartHeight;
                  const barWidth = 24;

                  return (
                    <g key={i}>
                      {/* PR bar */}
                      <rect
                        x={x + 10}
                        y={chartPadding.top + chartHeight - prHeight}
                        width={barWidth}
                        height={prHeight}
                        rx={4}
                        fill="var(--accent)"
                        opacity="0.8"
                      />
                      {/* Review bar */}
                      <rect
                        x={x + 10 + barWidth + 4}
                        y={chartPadding.top + chartHeight - reviewHeight}
                        width={barWidth}
                        height={reviewHeight}
                        rx={4}
                        fill="var(--blue)"
                        opacity="0.8"
                      />
                      {/* X label */}
                      <text
                        x={x + 10 + barWidth}
                        y={chartPadding.top + chartHeight + 16}
                        textAnchor="middle"
                        fill="var(--text-dim)"
                        fontSize="10"
                      >
                        {period.startDate.substring(0, 7)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--accent)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>PRs erstellt</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--blue)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Reviews</span>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
