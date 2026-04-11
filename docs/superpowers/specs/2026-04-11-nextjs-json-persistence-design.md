# Next.js Migration + JSON Persistence

## Summary

Migrate PerformanceHub from Vite + React SPA to Next.js App Router with JSON file-based persistence. Locally, employee data and settings are read/written to JSON files on disk. On Vercel, the same code works but changes are ephemeral (reset on redeploy).

## Requirements

- Full CRUD for employees (create, read, update, delete)
- Persist budget setting
- Auto-save on every change (debounced)
- Local: persistent JSON files with real data
- Vercel: demo data bundled with app, changes persist in-session but reset on redeploy
- No environment variable switching needed — filesystem ephemeral nature handles the difference

## Architecture

### App Router Structure

```
app/
  layout.js          — root layout, imports globals.css, fonts
  page.js            — renders App client component
  globals.css        — moved from src/styles/index.css
  api/
    employees/
      route.js       — GET (list all), POST (create)
      [id]/
        route.js     — PUT (update), DELETE (delete)
    settings/
      route.js       — GET, PUT
components/           — all existing components (with "use client")
  App.jsx            — main app, fetches from API instead of importing mock data
  Card.jsx
  ContributionBadge.jsx
  DashboardView.jsx
  EmployeeDetail.jsx
  ProgressBar.jsx
  ProgressRing.jsx
  SalaryBandViz.jsx
  ScoreGauge.jsx
  StatusBadge.jsx
utils/
  calculations.js    — unchanged
data/
  demo-employees.json — demo data (committed to repo)
  demo-settings.json  — demo settings (committed to repo)
  employees.json      — real data (gitignored)
  settings.json       — real settings (gitignored)
```

### Data Layer

**JSON Files:**
- `data/employees.json` — array of employee objects, gitignored
- `data/settings.json` — `{ "budget": 15000 }`, gitignored
- `data/demo-employees.json` — same schema, committed, used as fallback
- `data/demo-settings.json` — `{ "budget": 15000 }`, committed

**Initialization:** On first API GET, if the real JSON file doesn't exist, read from demo file. No copy — just read the demo as fallback. Writes always go to the real file (locally this persists, on Vercel it's ephemeral).

**Concurrency:** Simple read-then-write with no locking. This is a single-user local tool, not a multi-user server.

### API Routes

| Method | Route | Request Body | Response |
|--------|-------|-------------|----------|
| GET | `/api/employees` | — | `Employee[]` |
| POST | `/api/employees` | `Employee` (without id) | `Employee` (with generated id) |
| PUT | `/api/employees/[id]` | `Employee` | `Employee` |
| DELETE | `/api/employees/[id]` | — | `{ success: true }` |
| GET | `/api/settings` | — | `{ budget: number }` |
| PUT | `/api/settings` | `{ budget: number }` | `{ budget: number }` |

### Employee Data Shape

```json
{
  "id": 1,
  "name": "Laura Mueller",
  "role": "Senior Engineer",
  "department": "Engineering",
  "avatar": "LM",
  "currentSalary": 78000,
  "salaryBand": { "min": 70000, "mid": 82000, "max": 95000 },
  "marketRate": 85000,
  "inflation": 3.2,
  "personalGoals": [
    { "id": 1, "title": "...", "progress": 85, "weight": 25, "status": "on-track" }
  ],
  "teamGoals": [
    { "id": 1, "title": "...", "progress": 72, "contribution": "high" }
  ],
  "extras": [
    { "id": 1, "text": "...", "category": "reliability", "date": "2025-Q4" }
  ],
  "highlights": ["..."],
  "performanceScore": 4.2,
  "lastReview": "2025-10-15"
}
```

### Frontend Changes

**App.jsx:**
- Remove `import { initialEmployees }` — fetch from `/api/employees` on mount
- Remove `useState(initialEmployees)` — initialize as empty array, populate after fetch
- Add `useEffect` to fetch employees and settings on mount
- Add debounced auto-save: on employee state change, PUT to `/api/employees/[id]`; on budget change, PUT to `/api/settings`
- Add loading state while fetching

**All components:**
- Add `"use client"` directive (they use useState, motion, event handlers)
- No other changes needed

**DashboardView.jsx:**
- `onBudgetChange` now triggers auto-save through App

**EmployeeDetail.jsx:**
- `onUpdate` now triggers auto-save through App

### Migration Checklist

1. Replace `package.json` — remove Vite deps, add `next`, `react`, `react-dom`
2. Remove `vite.config.js`
3. Create `next.config.js`
4. Create `app/layout.js` with font imports and metadata
5. Create `app/page.js` as thin wrapper for App component
6. Move `src/styles/index.css` → `app/globals.css`
7. Move `src/components/*` → `components/*`
8. Move `src/utils/*` → `utils/*`
9. Convert `src/data/employees.js` → `data/demo-employees.json` + `data/demo-settings.json`
10. Create `data/` helper module for reading/writing JSON files
11. Create API route handlers
12. Update `App.jsx` — fetch from API, add auto-save with debounce
13. Add `"use client"` to all components
14. Update `.gitignore` — add `data/employees.json`, `data/settings.json`
15. Update `index.html` references → Next.js handles this via layout.js
16. Remove `src/main.jsx` and `index.html` (Next.js handles entry point)

### What Stays Unchanged

- All visual components (Card, ScoreGauge, ProgressBar, ProgressRing, SalaryBandViz, StatusBadge, ContributionBadge)
- CSS design system and variables
- `utils/calculations.js`
- Motion/Framer animations
- All component props and interfaces
- `categoryLabels` — moves to a shared constants file or stays in demo data
