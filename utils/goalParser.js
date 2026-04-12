/**
 * Parses a markdown file following the SMART goal template format.
 * Supports both "## Goal N: Title" and "## Title" header formats.
 * Returns an array of parsed goal objects.
 */
export function parseGoalsMarkdown(markdown) {
  const goals = [];
  const lines = markdown.split('\n');

  let currentGoal = null;
  let currentSection = null;
  let sectionBuffer = [];

  const sectionMap = {
    'WHY': 'why',
    'S': 'specific',
    'M': 'measurable',
    'A': 'achievable',
    'R': 'relevant',
    'T': 'timeBound',
  };

  function flushSection() {
    if (currentGoal && currentSection) {
      currentGoal[currentSection] = sectionBuffer.join('\n').trim();
    }
    sectionBuffer = [];
    currentSection = null;
  }

  function flushGoal() {
    flushSection();
    if (currentGoal && currentGoal.title) {
      goals.push({
        id: Date.now() + goals.length,
        title: currentGoal.title,
        why: currentGoal.why || '',
        specific: currentGoal.specific || '',
        measurable: currentGoal.measurable || '',
        achievable: currentGoal.achievable || '',
        relevant: currentGoal.relevant || '',
        timeBound: currentGoal.timeBound || '',
        progress: 0,
        weight: Math.round(100 / Math.max(goals.length + 1, 1)),
        status: 'not-started',
      });
    }
    currentGoal = null;
  }

  for (const line of lines) {
    // Match ## Goal N: Title or ## Title (but not ### subsections)
    const goalMatch = line.match(/^##\s+(?:Goal\s+\d+\s*:\s*)?(.+)/);
    if (goalMatch && !line.startsWith('###')) {
      flushGoal();
      currentGoal = { title: goalMatch[1].trim() };
      continue;
    }

    // Match ### subsections like "### WHY — Purpose" or "### S — Specific"
    const sectionMatch = line.match(/^###\s+(\w+)\s*[—–-]/);
    if (sectionMatch && currentGoal) {
      flushSection();
      const key = sectionMatch[1].toUpperCase();
      currentSection = sectionMap[key] || null;
      continue;
    }

    // Skip top-level # headers and --- separators
    if (line.match(/^#\s+/) || line.match(/^---\s*$/)) {
      continue;
    }

    // Accumulate content for current section
    if (currentSection) {
      sectionBuffer.push(line);
    }
  }

  // Flush the last goal
  flushGoal();

  // Recalculate weights evenly
  if (goals.length > 0) {
    const evenWeight = Math.round(100 / goals.length);
    goals.forEach((g, i) => {
      g.weight = i === goals.length - 1 ? 100 - evenWeight * (goals.length - 1) : evenWeight;
    });
  }

  return goals;
}
