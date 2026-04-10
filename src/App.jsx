import { useState, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import DashboardView from './components/DashboardView';
import EmployeeDetail from './components/EmployeeDetail';
import { initialEmployees } from './data/employees';

export default function App() {
  const [employees, setEmployees] = useState(initialEmployees);
  const [selectedId, setSelectedId] = useState(null);

  const selectedEmp = employees.find((e) => e.id === selectedId);

  const handleUpdate = useCallback((updated) => {
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  }, []);

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
          />
        ) : (
          <DashboardView
            key="dashboard"
            employees={employees}
            onSelect={(emp) => setSelectedId(emp.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
