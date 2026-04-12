import { NextResponse } from 'next/server';
import { getEmployees, saveEmployees, getSettings } from '@/lib/data';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function validateInput(value, label) {
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

async function searchPRs(githubOrg, username, startDate, endDate, option) {
  const safeOrg = validateInput(githubOrg, 'githubOrg');
  const safeUser = validateInput(username, 'username');
  const safeStart = validateDate(startDate, 'startDate');
  const safeEnd = validateDate(endDate, 'endDate');

  // GitHub Search API: option is "assignee" or "reviewed-by"
  const q = `is:merged is:pr user:${safeOrg} merged:${safeStart}..${safeEnd} ${option}:${safeUser}`;

  const allItems = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&per_page=${perPage}&page=${page}`;
    const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'performance-hub' };
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    }

    const res = await fetch(url, { headers });

    if (!res.ok) {
      const text = await res.text();
      console.error(`GitHub API error (${res.status}):`, text);
      // Rate limit — return what we have so far
      if (res.status === 403 || res.status === 429) break;
      throw new Error(`GitHub API error: ${res.status}`);
    }

    const data = await res.json();
    allItems.push(...data.items);

    if (data.items.length < perPage || allItems.length >= data.total_count) break;
    if (page >= 5) break; // Cap at 500 results
    page++;
  }

  // Extract repository name from html_url: https://github.com/org/repo/pull/123
  return allItems.map(item => ({
    url: item.html_url,
    repository: { name: item.repository_url.split('/').pop() },
  }));
}

// Split a date range into monthly chunks: [{start, end}, ...]
function getMonthlyRanges(startDate, endDate) {
  const ranges = [];
  let cursor = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  while (cursor < end) {
    const monthStart = new Date(cursor);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
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
  const username = bodyUsername || emp.githubUsername;
  if (!username) {
    return NextResponse.json({ error: 'Employee has no githubUsername set' }, { status: 400 });
  }
  if (bodyUsername && bodyUsername !== emp.githubUsername) {
    emp.githubUsername = bodyUsername;
  }

  const settings = await getSettings();
  const githubOrg = settings.githubOrg || 'collaborationFactory';

  const githubData = emp.githubData || { lastSyncedEnd: null, periods: [] };
  let startDate = requestedStartDate;
  if (!startDate && githubData.lastSyncedEnd) {
    startDate = githubData.lastSyncedEnd;
  }
  if (!startDate) {
    return NextResponse.json({ error: 'startDate is required for initial sync' }, { status: 400 });
  }

  const monthlyRanges = getMonthlyRanges(startDate, endDate);

  try {
    for (const range of monthlyRanges) {
      const exists = githubData.periods.some(p => p.startDate === range.start && p.endDate === range.end);
      if (exists) continue;

      const assignedPRs = await searchPRs(githubOrg, username, range.start, range.end, 'assignee');
      const reviewedPRs = await searchPRs(githubOrg, username, range.start, range.end, 'reviewed-by');
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
