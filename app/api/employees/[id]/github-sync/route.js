import { NextResponse } from 'next/server';
import { getEmployees, saveEmployees, getSettings } from '@/lib/data';
import { execFileSync } from 'child_process';

// Validate inputs to prevent injection — only allow safe characters
function validateGhInput(value, label) {
  if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
    throw new Error(`Invalid ${label}: "${value}"`);
  }
  return value;
}

function validateDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid ${label}: "${value}"`);
  }
  return value;
}

function searchPRs(githubOrg, username, startDate, endDate, option) {
  const safeOrg = validateGhInput(githubOrg, 'githubOrg');
  const safeUser = validateGhInput(username, 'username');
  const safeStart = validateDate(startDate, 'startDate');
  const safeEnd = validateDate(endDate, 'endDate');
  const safeOption = validateGhInput(option, 'option');

  const searchTerms = ['is:merged', 'is:pr', `user:${safeOrg}`, `merged:${safeStart}..${safeEnd}`, `${safeOption}:${safeUser}`];
  try {
    const result = execFileSync('gh', ['search', 'prs', '--limit', '500', '--json', 'repository,url', ...searchTerms], {
      encoding: 'utf-8',
      timeout: 30000,
      env: { ...process.env, PATH: process.env.PATH + ':/opt/homebrew/bin:/usr/local/bin' },
    });
    return result ? JSON.parse(result) : [];
  } catch (err) {
    console.error(`gh search failed for ${safeOption}:${safeUser}:`, err.message);
    return [];
  }
}

// Split a date range into monthly chunks: [{start, end}, ...]
function getMonthlyRanges(startDate, endDate) {
  const ranges = [];
  let cursor = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  while (cursor < end) {
    const monthStart = new Date(cursor);
    // Move to first day of next month
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    // Cap at endDate
    const periodEnd = monthEnd > end ? end : monthEnd;

    const fmt = (d) => d.toISOString().split('T')[0];
    ranges.push({ start: fmt(monthStart), end: fmt(periodEnd) });

    cursor = monthEnd;
  }
  return ranges;
}

export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { endDate, startDate: requestedStartDate, githubUsername: bodyUsername } = body;

  if (!endDate) {
    return NextResponse.json({ error: 'endDate is required' }, { status: 400 });
  }

  const employees = await getEmployees();
  const index = employees.findIndex(e => e.id === parseInt(id));
  if (index === -1) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  const emp = employees[index];
  // Accept username from request body (in case save hasn't flushed yet) or from stored data
  const username = bodyUsername || emp.githubUsername;
  if (!username) {
    return NextResponse.json({ error: 'Employee has no githubUsername set' }, { status: 400 });
  }
  // Persist the username if it came from the body
  if (bodyUsername && bodyUsername !== emp.githubUsername) {
    emp.githubUsername = bodyUsername;
  }

  const settings = await getSettings();
  const githubOrg = settings.githubOrg || 'collaborationFactory';

  // Determine startDate
  const githubData = emp.githubData || { lastSyncedEnd: null, periods: [] };
  let startDate = requestedStartDate;
  if (!startDate && githubData.lastSyncedEnd) {
    startDate = githubData.lastSyncedEnd;
  }
  if (!startDate) {
    return NextResponse.json({ error: 'startDate is required for initial sync' }, { status: 400 });
  }

  // Split into monthly ranges and fetch each
  const monthlyRanges = getMonthlyRanges(startDate, endDate);

  try {
    for (const range of monthlyRanges) {
      // Skip if we already have data for this exact period
      const exists = githubData.periods.some(p => p.startDate === range.start && p.endDate === range.end);
      if (exists) continue;

      const assignedPRs = searchPRs(githubOrg, username, range.start, range.end, 'assignee');
      const reviewedPRs = searchPRs(githubOrg, username, range.start, range.end, 'reviewed-by');
      const repositories = [...new Set(assignedPRs.map(pr => pr.repository.name))];

      githubData.periods.push({
        timePeriod: `${range.start}-to-${range.end}`,
        startDate: range.start,
        endDate: range.end,
        pullRequestsCount: assignedPRs.length,
        reviewsCount: reviewedPRs.length,
        repositoriesCount: repositories.length,
        repositories,
        pullRequests: assignedPRs.map(pr => pr.url),
        reviewedPullRequests: reviewedPRs.map(pr => pr.url),
      });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  githubData.periods.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  githubData.lastSyncedEnd = endDate;

  emp.githubData = githubData;
  employees[index] = emp;
  await saveEmployees(employees);

  return NextResponse.json(githubData);
}
