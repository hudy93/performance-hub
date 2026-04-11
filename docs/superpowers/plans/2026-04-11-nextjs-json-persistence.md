# Next.js Migration + JSON Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate PerformanceHub from Vite SPA to Next.js App Router with JSON file-based persistence for employee data and budget settings.

**Architecture:** Next.js App Router with API Route Handlers that read/write local JSON files. All existing React components become client components with `"use client"` directives. Auto-save via debounced API calls on state changes.

**Tech Stack:** Next.js 15, React 19, motion (Framer Motion), Node.js fs/promises

---

## File Structure

```
performance-hub/
├── app/
│   ├── layout.js            — root layout, metadata, font imports, globals.css
│   ├── page.js              — thin server component, renders <App />
│   ├── globals.css           — moved from src/styles/index.css
│   └── api/
│       ├── employees/
│       │   ├── route.js      — GET all, POST new employee
│       │   └── [id]/
│       │       └── route.js  — PUT update, DELETE employee
│       └── settings/
│           └── route.js      — GET, PUT settings (budget)
├── components/
│   ├── App.jsx               — main app (fetches from API, auto-saves)
│   ├── Card.jsx
│   ├── ContributionBadge.jsx
│   ├── DashboardView.jsx
│   ├── EmployeeDetail.jsx
│   ├── ProgressBar.jsx
│   ├── ProgressRing.jsx
│   ├── SalaryBandViz.jsx
│   ├── ScoreGauge.jsx
│   └── StatusBadge.jsx
├── utils/
│   ├── calculations.js       — unchanged
│   └── constants.js           — categoryLabels export
├── lib/
│   └── data.js               — JSON file read/write helpers
├── data/
│   ├── demo-employees.json   — demo data (committed)
│   ├── demo-settings.json    — demo settings (committed)
│   ├── employees.json        — real data (gitignored)
│   └── settings.json         — real settings (gitignored)
├── next.config.js
├── jsconfig.json              — path aliases (@/components, etc.)
└── package.json
```

**Deleted files** (after migration):
- `src/` (entire directory)
- `vite.config.js`
- `index.html`

---

### Task 1: Scaffold Next.js project structure and dependencies

**Files:**
- Modify: `package.json`
- Create: `next.config.js`
- Create: `jsconfig.json`
- Delete: `vite.config.js`
- Delete: `index.html`

- [ ] **Step 1: Update package.json**

Replace the entire `package.json` with Next.js dependencies:

```json
{
  "name": "performance-hub-app",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "motion": "^12.38.0",
    "next": "^15.3.1",
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.4",
    "eslint": "^9.39.4",
    "eslint-config-next": "^15.3.1"
  }
}
```

- [ ] **Step 2: Create next.config.js**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

- [ ] **Step 3: Create jsconfig.json for path aliases**

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

- [ ] **Step 4: Delete Vite files**

```bash
rm vite.config.js index.html
```

- [ ] **Step 5: Delete node_modules and reinstall**

```bash
rm -rf node_modules package-lock.json
npm install
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: replace Vite with Next.js dependencies and config"
```

---

### Task 2: Create data layer (JSON read/write helpers + demo data)

**Files:**
- Create: `lib/data.js`
- Create: `data/demo-employees.json`
- Create: `data/demo-settings.json`
- Create: `utils/constants.js`
- Modify: `.gitignore`

- [ ] **Step 1: Create demo-employees.json**

Convert the existing `src/data/employees.js` array to JSON. Save to `data/demo-employees.json`:

```json
[
  {
    "id": 1,
    "name": "Laura Müller",
    "role": "Senior Engineer",
    "department": "Engineering",
    "avatar": "LM",
    "currentSalary": 78000,
    "salaryBand": { "min": 70000, "mid": 82000, "max": 95000 },
    "marketRate": 85000,
    "inflation": 3.2,
    "personalGoals": [
      { "id": 1, "title": "AWS Solutions Architect Zertifizierung", "progress": 85, "weight": 25, "status": "on-track" },
      { "id": 2, "title": "3 Tech-Talks halten", "progress": 66, "weight": 15, "status": "on-track" },
      { "id": 3, "title": "Mentoring von 2 Junioren", "progress": 100, "weight": 20, "status": "completed" }
    ],
    "teamGoals": [
      { "id": 1, "title": "System-Latenz um 40% reduzieren", "progress": 72, "contribution": "high" },
      { "id": 2, "title": "Test-Coverage auf 85% erhöhen", "progress": 90, "contribution": "medium" }
    ],
    "extras": [
      { "id": 1, "text": "On-Call Wochenenden übernommen (3x)", "category": "reliability", "date": "2025-Q4" },
      { "id": 2, "text": "Interne Dokumentation komplett überarbeitet", "category": "initiative", "date": "2025-Q3" },
      { "id": 3, "text": "Neues CI/CD Pipeline-Konzept entwickelt", "category": "innovation", "date": "2026-Q1" }
    ],
    "highlights": ["Teamübergreifende Zusammenarbeit", "Proaktive Problemlösung", "Wissenstransfer"],
    "performanceScore": 4.2,
    "lastReview": "2025-10-15"
  },
  {
    "id": 2,
    "name": "Thomas Weber",
    "role": "Product Manager",
    "department": "Product",
    "avatar": "TW",
    "currentSalary": 72000,
    "salaryBand": { "min": 65000, "mid": 78000, "max": 90000 },
    "marketRate": 80000,
    "inflation": 3.2,
    "personalGoals": [
      { "id": 1, "title": "Product Analytics Framework aufbauen", "progress": 60, "weight": 30, "status": "at-risk" },
      { "id": 2, "title": "Stakeholder-NPS auf 8+ bringen", "progress": 45, "weight": 25, "status": "behind" },
      { "id": 3, "title": "OKR-Prozess einführen", "progress": 100, "weight": 20, "status": "completed" }
    ],
    "teamGoals": [
      { "id": 1, "title": "Feature-Adoption Rate +30%", "progress": 55, "contribution": "high" },
      { "id": 2, "title": "Sprint Velocity stabilisieren", "progress": 80, "contribution": "medium" }
    ],
    "extras": [
      { "id": 1, "text": "Kunden-Workshop-Reihe initiiert", "category": "initiative", "date": "2025-Q4" },
      { "id": 2, "text": "Cross-functional Retros eingeführt", "category": "culture", "date": "2026-Q1" }
    ],
    "highlights": ["Kundenorientierung", "Strukturiertes Arbeiten"],
    "performanceScore": 3.5,
    "lastReview": "2025-10-15"
  },
  {
    "id": 3,
    "name": "Sarah Koch",
    "role": "UX Designerin",
    "department": "Design",
    "avatar": "SK",
    "currentSalary": 62000,
    "salaryBand": { "min": 55000, "mid": 68000, "max": 80000 },
    "marketRate": 70000,
    "inflation": 3.2,
    "personalGoals": [
      { "id": 1, "title": "Design System v2.0 launchen", "progress": 95, "weight": 35, "status": "on-track" },
      { "id": 2, "title": "Usability Testing Prozess etablieren", "progress": 100, "weight": 25, "status": "completed" },
      { "id": 3, "title": "Figma-to-Code Workflow optimieren", "progress": 70, "weight": 15, "status": "on-track" }
    ],
    "teamGoals": [
      { "id": 1, "title": "User Satisfaction Score >4.5", "progress": 88, "contribution": "high" },
      { "id": 2, "title": "Design Review Cycle < 2 Tage", "progress": 95, "contribution": "high" }
    ],
    "extras": [
      { "id": 1, "text": "Accessibility Audit durchgeführt und Fixes geleitet", "category": "quality", "date": "2025-Q4" },
      { "id": 2, "text": "Design-Meetup im Unternehmen organisiert", "category": "culture", "date": "2026-Q1" },
      { "id": 3, "text": "Onboarding-Materialien für neue Designer erstellt", "category": "initiative", "date": "2025-Q3" }
    ],
    "highlights": ["Exzellente Qualität", "Teamkultur-Beitrag", "Eigeninitiative", "Accessibility-Champion"],
    "performanceScore": 4.6,
    "lastReview": "2025-10-15"
  },
  {
    "id": 4,
    "name": "Markus Braun",
    "role": "DevOps Engineer",
    "department": "Engineering",
    "avatar": "MB",
    "currentSalary": 70000,
    "salaryBand": { "min": 65000, "mid": 78000, "max": 90000 },
    "marketRate": 82000,
    "inflation": 3.2,
    "personalGoals": [
      { "id": 1, "title": "Kubernetes Migration abschließen", "progress": 40, "weight": 35, "status": "behind" },
      { "id": 2, "title": "Disaster Recovery Plan erstellen", "progress": 30, "weight": 25, "status": "at-risk" },
      { "id": 3, "title": "Monitoring-Dashboard aufbauen", "progress": 80, "weight": 15, "status": "on-track" }
    ],
    "teamGoals": [
      { "id": 1, "title": "System-Latenz um 40% reduzieren", "progress": 72, "contribution": "low" },
      { "id": 2, "title": "99.9% Uptime erreichen", "progress": 65, "contribution": "high" }
    ],
    "extras": [
      { "id": 1, "text": "Notfall-Deployment am Wochenende durchgeführt", "category": "reliability", "date": "2026-Q1" }
    ],
    "highlights": ["Zuverlässigkeit in Krisen"],
    "performanceScore": 2.8,
    "lastReview": "2025-10-15"
  }
]
```

- [ ] **Step 2: Create demo-settings.json**

Save to `data/demo-settings.json`:

```json
{
  "budget": 15000
}
```

- [ ] **Step 3: Create constants.js**

Move `categoryLabels` from `src/data/employees.js` to `utils/constants.js`:

```js
export const categoryLabels = {
  reliability: "Zuverlässigkeit",
  initiative: "Eigeninitiative",
  innovation: "Innovation",
  culture: "Kultur",
  quality: "Qualität",
};
```

- [ ] **Step 4: Create lib/data.js — JSON read/write helpers**

```js
import { readFile, writeFile, access } from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJSON(filename, demoFilename) {
  const filePath = path.join(dataDir, filename);
  const demoPath = path.join(dataDir, demoFilename);

  if (await fileExists(filePath)) {
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  }

  const raw = await readFile(demoPath, 'utf-8');
  return JSON.parse(raw);
}

export async function writeJSON(filename, data) {
  const filePath = path.join(dataDir, filename);
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getEmployees() {
  return readJSON('employees.json', 'demo-employees.json');
}

export async function saveEmployees(employees) {
  await writeJSON('employees.json', employees);
}

export async function getSettings() {
  return readJSON('settings.json', 'demo-settings.json');
}

export async function saveSettings(settings) {
  await writeJSON('settings.json', settings);
}
```

- [ ] **Step 5: Update .gitignore**

Add these lines:

```
# local data
/data/employees.json
/data/settings.json
```

- [ ] **Step 6: Commit**

```bash
git add data/demo-employees.json data/demo-settings.json utils/constants.js lib/data.js .gitignore
git commit -m "feat: add data layer with JSON read/write helpers and demo data"
```

---

### Task 3: Create API route handlers

**Files:**
- Create: `app/api/employees/route.js`
- Create: `app/api/employees/[id]/route.js`
- Create: `app/api/settings/route.js`

- [ ] **Step 1: Create GET/POST employees route**

Save to `app/api/employees/route.js`:

```js
import { NextResponse } from 'next/server';
import { getEmployees, saveEmployees } from '@/lib/data';

export async function GET() {
  const employees = await getEmployees();
  return NextResponse.json(employees);
}

export async function POST(request) {
  const body = await request.json();
  const employees = await getEmployees();

  const maxId = employees.reduce((max, e) => Math.max(max, e.id), 0);
  const newEmployee = { ...body, id: maxId + 1 };

  employees.push(newEmployee);
  await saveEmployees(employees);

  return NextResponse.json(newEmployee, { status: 201 });
}
```

- [ ] **Step 2: Create PUT/DELETE employee by ID route**

Save to `app/api/employees/[id]/route.js`:

```js
import { NextResponse } from 'next/server';
import { getEmployees, saveEmployees } from '@/lib/data';

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const employees = await getEmployees();

  const index = employees.findIndex((e) => e.id === parseInt(id));
  if (index === -1) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  employees[index] = { ...body, id: parseInt(id) };
  await saveEmployees(employees);

  return NextResponse.json(employees[index]);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const employees = await getEmployees();

  const filtered = employees.filter((e) => e.id !== parseInt(id));
  if (filtered.length === employees.length) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  await saveEmployees(filtered);
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create GET/PUT settings route**

Save to `app/api/settings/route.js`:

```js
import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/data';

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(request) {
  const body = await request.json();
  await saveSettings(body);
  return NextResponse.json(body);
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/
git commit -m "feat: add API route handlers for employees and settings CRUD"
```

---

### Task 4: Create Next.js app shell (layout + page)

**Files:**
- Create: `app/layout.js`
- Create: `app/page.js`
- Move: `src/styles/index.css` → `app/globals.css`

- [ ] **Step 1: Move CSS to app/globals.css**

```bash
cp src/styles/index.css app/globals.css
```

No content changes needed — the CSS works as-is.

- [ ] **Step 2: Create app/layout.js**

```jsx
import './globals.css';

export const metadata = {
  title: 'PerformanceHub',
  description: 'Employee performance management dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Create app/page.js**

```jsx
import App from '@/components/App';

export default function Page() {
  return <App />;
}
```

- [ ] **Step 4: Commit**

```bash
git add app/layout.js app/page.js app/globals.css
git commit -m "feat: add Next.js app shell with layout, page, and global styles"
```

---

### Task 5: Migrate components to Next.js structure

**Files:**
- Move: all `src/components/*.jsx` → `components/*.jsx`
- Move: `src/utils/calculations.js` → `utils/calculations.js`
- Modify: `components/App.jsx` (major rewrite — API fetching + auto-save)
- Modify: `components/EmployeeDetail.jsx` (update import path for categoryLabels)
- Add `"use client"` to: `App.jsx`, `DashboardView.jsx`, `EmployeeDetail.jsx`, `ScoreGauge.jsx`

- [ ] **Step 1: Move files from src/ to root**

```bash
cp -r src/components/* components/
cp src/utils/calculations.js utils/calculations.js
```

- [ ] **Step 2: Add "use client" directives**

Add `'use client';` as the first line of these files (they use hooks, event handlers, or motion):
- `components/App.jsx`
- `components/DashboardView.jsx`
- `components/EmployeeDetail.jsx`
- `components/ScoreGauge.jsx`

The other components (Card, ProgressBar, ProgressRing, StatusBadge, ContributionBadge, SalaryBandViz) don't use hooks or browser APIs, but since they're imported by client components they'll be bundled as client code automatically. Adding `"use client"` to them is not required but harmless — skip it to keep changes minimal.

- [ ] **Step 3: Update EmployeeDetail.jsx import**

Change the `categoryLabels` import from:
```js
import { categoryLabels } from '../data/employees';
```
to:
```js
import { categoryLabels } from '@/utils/constants';
```

- [ ] **Step 4: Rewrite components/App.jsx**

Replace the entire file with the API-fetching, auto-saving version:

```jsx
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
            budget={budget}
            onBudgetChange={handleBudgetChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 5: Add "use client" to DashboardView.jsx**

Add `'use client';` as the very first line of `components/DashboardView.jsx`. No other changes.

- [ ] **Step 6: Add "use client" to EmployeeDetail.jsx**

Add `'use client';` as the very first line of `components/EmployeeDetail.jsx` (before the existing `import { useState } from 'react';` line).

- [ ] **Step 7: Add "use client" to ScoreGauge.jsx**

Add `'use client';` as the very first line of `components/ScoreGauge.jsx`. This is needed because it imports ProgressRing which uses SVG with style transitions.

- [ ] **Step 8: Commit**

```bash
git add components/ utils/
git commit -m "feat: migrate components to Next.js with API fetching and auto-save"
```

---

### Task 6: Clean up old src/ directory and verify

**Files:**
- Delete: `src/` (entire directory)
- Delete: `eslint.config.js` (Vite-specific, replaced by Next.js eslint)

- [ ] **Step 1: Delete the old src/ directory**

```bash
rm -rf src/
```

- [ ] **Step 2: Delete old eslint config if it exists**

```bash
rm -f eslint.config.js
```

- [ ] **Step 3: Verify the app starts**

```bash
npm run dev
```

Expected: Next.js dev server starts on http://localhost:3000 with no compilation errors.

- [ ] **Step 4: Verify in browser**

Open http://localhost:3000. Expected:
- Dashboard loads with 4 employees (from demo data)
- Click an employee → detail view works
- Edit a goal → auto-saves (check `data/employees.json` appears)
- Edit budget → auto-saves (check `data/settings.json` appears)
- Refresh page → changes persist

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove old Vite src/ directory, migration complete"
```

---

### Task 7: Fix any remaining import paths and verify full functionality

**Files:**
- Potentially modify: any component with relative imports that broke during the move

- [ ] **Step 1: Check for broken imports**

Run the build to catch any import errors:

```bash
npm run build
```

Expected: Build succeeds with no errors. If there are import errors, fix them (likely relative paths like `../data/employees` or `../utils/calculations` that need updating to `@/utils/...` paths).

- [ ] **Step 2: Fix any broken imports found**

Common fixes needed:
- `DashboardView.jsx`: change `'../utils/calculations'` → `'@/utils/calculations'`
- `EmployeeDetail.jsx`: change `'../utils/calculations'` → `'@/utils/calculations'`

Update all relative imports in components to use the `@/` alias since files moved from `src/components/` to `components/`.

For component-to-component imports (e.g., `import Card from './Card'`), these still work since they're in the same directory — no changes needed.

- [ ] **Step 3: Run build again to confirm**

```bash
npm run build
```

Expected: Clean build, no errors.

- [ ] **Step 4: Commit if any fixes were made**

```bash
git add -A
git commit -m "fix: update import paths for Next.js directory structure"
```
