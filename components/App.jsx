'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import DashboardView from './DashboardView';
import EmployeeDetail from './EmployeeDetail';

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [budget, setBudget] = useState(15000);
  const [loading, setLoading] = useState(true);

  const saveTimeoutRef = useRef(null);
  const budgetTimeoutRef = useRef(null);
  const initialLoadDone = useRef(false);

  // Fetch data on mount
  useEffect(() => {
    async function load() {
      try {
        const [empRes, setRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/settings'),
        ]);
        const empData = await empRes.json();
        const setData = await setRes.json();
        setEmployees(empData);
        setBudget(setData.budget);
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

    if (!initialLoadDone.current) return;
    if (budgetTimeoutRef.current) clearTimeout(budgetTimeoutRef.current);
    budgetTimeoutRef.current = setTimeout(() => {
      fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget: newBudget }),
      }).catch((err) => console.error('Failed to save settings:', err));
    }, 300);
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
          <div className="header-period">Q1 2026</div>
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
        <div className="header-period">Q1 2026</div>
      </header>

      <AnimatePresence mode="wait">
        {selectedEmp ? (
          <EmployeeDetail
            key={selectedEmp.id}
            emp={selectedEmp}
            onBack={() => setSelectedId(null)}
            onUpdate={handleUpdate}
            budget={budget}
            employees={employees}
          />
        ) : (
          <DashboardView
            key="dashboard"
            employees={employees}
            onSelect={(emp) => setSelectedId(emp.id)}
            onAddEmployee={handleAddEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            budget={budget}
            onBudgetChange={handleBudgetChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
