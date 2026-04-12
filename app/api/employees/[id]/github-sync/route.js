import { NextResponse } from 'next/server';
import { getEmployees, saveEmployees, getSettings } from '@/lib/data';
import { execSync } from 'child_process';

function searchPRs(githubOrg, username, startDate, endDate, option) {
  try {
    const searchQuery = `is:merged is:pr user:${githubOrg} merged:${startDate}..${endDate} ${option}:${username}`;
    const result = execSync(`gh search prs --limit 500 --json repository,url "${searchQuery}"`, {
      encoding: 'utf-8',
      timeout: 30000,
    });
    return result ? JSON.parse(result) : [];
  } catch {
    return [];
  }
}

export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { endDate, startDate: requestedStartDate } = body;

  if (!endDate) {
    return NextResponse.json({ error: 'endDate is required' }, { status: 400 });
  }

  const employees = await getEmployees();
  const index = employees.findIndex(e => e.id === parseInt(id));
  if (index === -1) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  const emp = employees[index];
  if (!emp.githubUsername) {
    return NextResponse.json({ error: 'Employee has no githubUsername set' }, { status: 400 });
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

  // Fetch PR data
  const assignedPRs = searchPRs(githubOrg, emp.githubUsername, startDate, endDate, 'assignee');
  const reviewedPRs = searchPRs(githubOrg, emp.githubUsername, startDate, endDate, 'reviewed-by');

  const repositories = [...new Set(assignedPRs.map(pr => pr.repository.name))];

  const newPeriod = {
    timePeriod: `${startDate}-to-${endDate}`,
    startDate,
    endDate,
    pullRequestsCount: assignedPRs.length,
    reviewsCount: reviewedPRs.length,
    repositoriesCount: repositories.length,
    repositories,
    pullRequests: assignedPRs.map(pr => pr.url),
    reviewedPullRequests: reviewedPRs.map(pr => pr.url),
  };

  githubData.periods.push(newPeriod);
  githubData.periods.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
  githubData.lastSyncedEnd = endDate;

  emp.githubData = githubData;
  employees[index] = emp;
  await saveEmployees(employees);

  return NextResponse.json(githubData);
}
