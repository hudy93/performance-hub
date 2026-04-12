# Performance Measurement Expansion — Design Spec

## Overview

Three features to expand the performance measurement model in Performance Hub:

1. **Role-based competency assessments** with target competency tracking
2. **Markdown goal upload** from structured SMART goal templates
3. **GitHub activity dashboard** with integrated data sync

---

## Feature 1: Competency Assessments

### Data Model

**Shared competency catalog** (`data/competencies.json`, imported from `data/Competence_Matrix.xlsx`):

```json
[
  {
    "id": 1,
    "name": "Code Quality & Design",
    "category": "Technology",
    "tag": "SKILL",
    "expectations": {
      "Junior Engineer": "Understands team coding conventions...",
      "Intermediate Engineer": "Produces clean, maintainable...",
      "Senior Engineer": "Applies deep understanding of...",
      "Staff Engineer": "Establishes coding standards..."
    }
  }
]
```

**6 Categories:** Technology, Open-mindedness & Willingness to Learn, Commitment, Scope & Scale, Interpersonal Skills, Team Contribution

**3 Tags:** SKILL, RESPONSIBILITY, SCALE

The role name (e.g., "Senior Engineer") is the key into `expectations`. When viewing an employee's competencies, the app looks up the employee's role and shows the matching expectation description.

**Employee model addition:**

```json
{
  "competencyAssessments": [
    {
      "competencyId": 1,
      "met": false,
      "isTarget": true,
      "milestones": [
        { "id": 1, "title": "Complete advanced React course", "status": "pending", "dueDate": "2026-06-30" }
      ]
    }
  ]
}
```

### API

- `GET /api/competencies` — returns the full competency catalog
- Employee competency assessments are stored on the employee object and updated via the existing `PUT /api/employees/[id]`

### UI — Employee Detail View

New **"Competencies" tab**:

- Competencies grouped by category
- Each competency shows: name, tag badge (SKILL/RESPONSIBILITY/SCALE), expectation text for the employee's current role
- Toggle for "met" / "not met"
- Star/flag toggle to mark as "target competency"
- Target competencies expand to show milestones (add/remove/toggle done with due date)

### Role Change Behavior

When an employee's role changes, competency assessments are re-initialized from the catalog. Existing assessments are preserved if the competency ID matches (only the displayed expectation text changes).

---

## Feature 2: Markdown Goal Upload

### Markdown Format

Follows the existing template (`data/personal_goal_template.md`):

```markdown
# Employee Name - Year Personal Goals

## Goal 1: Team Enablement and Stability

### WHY — Purpose
Free text...

### S — Specific
Free text...

### M — Measurable
Free text...

### A — Achievable
Free text...

### R — Relevant
Free text...

### T — Time-bound
Free text...

---

## Goal 2: OKR Ownership & Management Visibility
...
```

### Parser Logic

- Split on `##` headers — supports both `## Goal 1: Title` and `## Title` formats
- Title extracted from the header text (after the colon if numbered, otherwise the full header text)
- Each `### X —` subsection captured as rich text (preserving markdown formatting)
- Goals separated by `---` or next `## Goal` / `##` header
- Missing optional sections default to empty
- Parse errors shown per-goal in the preview

### Goal Model Migration

Replace the existing simple goal format (`measurable`, `deadline`) with the full SMART structure everywhere. Update demo data with SMART example goals. No backward compatibility needed — the app is still in dev phase.

### Data Model Update

Personal goals store full SMART fields as rich text:

```json
{
  "id": 1,
  "title": "Team Enablement and Stability",
  "why": "Simon holds deep expertise...",
  "specific": "Develop Daniel into...",
  "measurable": "By May: Document 3-5...",
  "achievable": "Simon is already recognized...",
  "relevant": "This ensures the squad's...",
  "timeBound": "End April: Identify...",
  "progress": 0,
  "weight": 50,
  "status": "not-started"
}
```

### UI Flow

1. "Import Goals" button in the goals section of employee detail view
2. File picker opens (accepts `.md` files)
3. Parsed goals shown in a preview modal with collapsible SMART sections
4. User confirms or cancels
5. On confirm, goals are **appended** to existing goals (not replaced)
6. Progress defaults to 0, status to "not-started"

---

## Feature 3: GitHub Activity Dashboard

### Data Model

**Employee model addition:**

```json
{
  "githubUsername": "slaven3kopic",
  "githubData": {
    "lastSyncedEnd": "2026-03-01",
    "periods": [
      {
        "timePeriod": "1-2026-to-3-2026",
        "startDate": "2026-01-01",
        "endDate": "2026-03-01",
        "pullRequestsCount": 12,
        "reviewsCount": 8,
        "repositoriesCount": 3,
        "repositories": ["repo-a", "repo-b"],
        "pullRequests": ["https://github.com/org/repo/pull/1"],
        "reviewedPullRequests": ["https://github.com/org/repo/pull/2"]
      }
    ]
  }
}
```

**Settings model addition:**

```json
{
  "githubOrg": "collaborationFactory"
}
```

### API

`POST /api/employees/[id]/github-sync`:

- Accepts `endDate` as required parameter
- `startDate` is automatically determined:
  - If previous data exists: uses `endDate` of the most recent period
  - If no previous data: `startDate` is also required (first sync)
- Reads employee's `githubUsername` and `settings.githubOrg`
- Runs `gh search prs` logic (ported from `utils/prs.js` into the API route — no shell-out to the script)
- Fetches: PRs assigned to user (merged), PRs reviewed by user (merged)
- Stores period data on the employee and returns updated GitHub data

### UI — Employee Detail View

New **"GitHub Activity" tab**:

- **Sync controls:**
  - If no previous data: date range picker (start + end) + "Sync" button
  - If previous data exists: end date picker only + "Sync" button, with label "Last synced to: YYYY-MM-DD"
- **Date range filter:** filters the displayed data (summary + chart) to a selected range from already-synced data — no new API call
- **Summary card:** total PRs authored, total reviews, total repositories (recalculated based on active filter)
- **Trend chart:** line/area chart with PR count and review count over time periods on x-axis

### Chart Implementation

Uses a lightweight approach — CSS-based or a small library like `recharts`. Animated with the existing `motion` library.

### Settings

`githubOrg` field added to the settings page as a text input (default: "collaborationFactory").

`githubUsername` field added to the employee detail view (editable in the header/info section).

---

## Salary Recommendation Algorithm Update

Updated weights incorporating competency assessment:

| Component | Old Weight | New Weight |
|-----------|-----------|------------|
| Personal goals | 30% | 25% |
| Team goals | 20% | 20% |
| Performance score | 30% | 20% |
| **Competency assessment** | — | **20%** |
| Extras | 10% | 10% |
| Highlights | 10% | 5% |

**Competency score calculation:** percentage of competencies marked as "met" for the employee's role. Target competency milestone completion boosts the competency component (e.g., 3 of 4 milestones done adds partial credit).

**GitHub activity is NOT included** in the salary algorithm — it's contextual information, not a direct performance metric.

---

## Files Affected

- `data/competencies.json` — new, competency catalog
- `data/demo-employees.json` — add competencyAssessments, githubUsername, githubData, updated goal structure
- `data/demo-settings.json` — add githubOrg
- `app/api/competencies/route.js` — new, GET competencies
- `app/api/employees/[id]/github-sync/route.js` — new, POST sync
- `app/api/settings/route.js` — handle githubOrg
- `components/EmployeeDetail.jsx` — new tabs (Competencies, GitHub Activity), goal upload button
- `components/CompetencyTab.jsx` — new component
- `components/GitHubActivityTab.jsx` — new component
- `components/GoalUploadModal.jsx` — new component
- `utils/calculations.js` — updated salary recommendation weights
- `utils/goalParser.js` — new, markdown goal parser
- `utils/constants.js` — competency categories, tags
