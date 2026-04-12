'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import DashboardView from './DashboardView';
import EmployeeDetail from './EmployeeDetail';

export default function App({ user }) {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [budget, setBudget] = useState(15000);
  const [competencies, setCompetencies] = useState([]);
  const [settings, setSettings] = useState({ budget: 15000, githubOrg: '' });
  const [loading, setLoading] = useState(true);

  const saveTimeoutRef = useRef(null);
  const budgetTimeoutRef = useRef(null);
  const initialLoadDone = useRef(false);

  // Fetch data on mount
  useEffect(() => {
    async function load() {
      try {
        const [empRes, rolesRes, setRes, compRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/roles'),
          fetch('/api/settings'),
          fetch('/api/competencies'),
        ]);
        const empData = await empRes.json();
        const rolesData = await rolesRes.json();
        const setData = await setRes.json();
        const compData = await compRes.json();
        setEmployees(empData);
        setRoles(rolesData);
        setSettings(setData);
        setBudget(setData.budget);
        setCompetencies(compData);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
        initialLoadDone.current = true;
      }
    }
    load();
  }, []);

  // Auto-save employee on update (debounced 300ms)
  const handleUpdate = useCallback((updated) => {
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      fetch(`/api/employees/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch((err) => console.error('Failed to save employee:', err));
    }, 300);
  }, []);

  // Auto-save budget (debounced 300ms)
  const handleBudgetChange = useCallback((newBudget) => {
    setBudget(newBudget);
    setSettings(prev => ({ ...prev, budget: newBudget }));

    if (!initialLoadDone.current) return;
    if (budgetTimeoutRef.current) clearTimeout(budgetTimeoutRef.current);
    budgetTimeoutRef.current = setTimeout(() => {
      fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, budget: newBudget }),
      }).catch((err) => console.error('Failed to save settings:', err));
    }, 300);
  }, [settings]);

  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings);
    setBudget(newSettings.budget);

    if (budgetTimeoutRef.current) clearTimeout(budgetTimeoutRef.current);
    budgetTimeoutRef.current = setTimeout(() => {
      fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      }).catch((err) => console.error('Failed to save settings:', err));
    }, 300);
  }, []);

  // Role CRUD
  const handleAddRole = useCallback(async (newRole) => {
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRole),
      });
      const created = await res.json();
      setRoles((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error('Failed to create role:', err);
    }
  }, []);

  const handleUpdateRole = useCallback(async (updated) => {
    try {
      const res = await fetch(`/api/roles/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const saved = await res.json();
      setRoles((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      // Update salaryBand/marketRate on employees with this role
      setEmployees((prev) =>
        prev.map((e) =>
          e.role === saved.name
            ? { ...e, salaryBand: saved.salaryBand, marketRate: saved.marketRate }
            : e
        )
      );
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  }, []);

  const handleDeleteRole = useCallback(async (id) => {
    try {
      await fetch(`/api/roles/${id}`, { method: 'DELETE' });
      setRoles((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete role:', err);
    }
  }, []);

  // Add new employee via POST
  const handleAddEmployee = useCallback(async (newEmp) => {
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmp),
      });
      const created = await res.json();
      setEmployees((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error('Failed to create employee:', err);
    }
  }, []);

  // Delete employee via DELETE
  const handleDeleteEmployee = useCallback(async (id) => {
    try {
      await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      console.error('Failed to delete employee:', err);
    }
  }, [selectedId]);

  const selectedEmp = employees.find((e) => e.id === selectedId);

  if (loading) {
    return (
      <div className="app-shell">
        <header className="header">
          <div className="header-brand">
            <div className="header-logo">◆</div>
            <h1 className="header-title">PerformanceHub</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user?.image && (
              <img src={user.image} alt="" style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border)' }} />
            )}
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.name}</span>
            <button
              className="btn btn--ghost"
              style={{ fontSize: 11 }}
              onClick={() => { import('next-auth/react').then(m => m.signOut({ callbackUrl: '/' })); }}
            >
              Abmelden
            </button>
          </div>
        </header>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
          Daten werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="header">
        <div className="header-brand">
          <div className="header-logo">◆</div>
          <h1 className="header-title">PerformanceHub</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user?.image && (
            <img src={user.image} alt="" style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border)' }} />
          )}
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.name}</span>
          <button
            className="btn btn--ghost"
            style={{ fontSize: 11 }}
            onClick={() => { import('next-auth/react').then(m => m.signOut({ callbackUrl: '/' })); }}
          >
            Abmelden
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {selectedEmp ? (
          <EmployeeDetail
            key={selectedEmp.id}
            emp={selectedEmp}
            onBack={() => setSelectedId(null)}
            onUpdate={handleUpdate}
            onDelete={handleDeleteEmployee}
            budget={budget}
            employees={employees}
            competencies={competencies}
            settings={settings}
          />
        ) : (
          <DashboardView
            key="dashboard"
            employees={employees}
            roles={roles}
            onSelect={(emp) => setSelectedId(emp.id)}
            onAddEmployee={handleAddEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onAddRole={handleAddRole}
            onUpdateRole={handleUpdateRole}
            onDeleteRole={handleDeleteRole}
            budget={budget}
            onBudgetChange={handleBudgetChange}
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
