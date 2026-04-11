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

export async function getRoles() {
  return readJSON('roles.json', 'demo-roles.json');
}

export async function saveRoles(roles) {
  await writeJSON('roles.json', roles);
}

export async function getSettings() {
  return readJSON('settings.json', 'demo-settings.json');
}

export async function saveSettings(settings) {
  await writeJSON('settings.json', settings);
}
