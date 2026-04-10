export function calcWeightedGoalScore(goals) {
  if (!goals.length) return 0;
  const totalWeight = goals.reduce((s, g) => s + (g.weight || 0), 0);
  if (!totalWeight) return goals.reduce((s, g) => s + g.progress, 0) / goals.length;
  return goals.reduce((s, g) => s + (g.progress * (g.weight || 0)) / totalWeight, 0);
}

export function calcSalaryRecommendation(emp) {
  const goalScore = calcWeightedGoalScore(emp.personalGoals);
  const teamAvg =
    emp.teamGoals.reduce((s, g) => s + g.progress, 0) / (emp.teamGoals.length || 1);
  const extrasBonus = Math.min(emp.extras.length * 0.4, 2.0);
  const highlightsBonus = Math.min(emp.highlights.length * 0.25, 1.5);

  const performanceMultiplier =
    (goalScore / 100) * 0.3 +
    (teamAvg / 100) * 0.2 +
    (emp.performanceScore / 5) * 0.3 +
    (extrasBonus / 2) * 0.1 +
    (highlightsBonus / 1.5) * 0.1;

  const marketGap = ((emp.marketRate - emp.currentSalary) / emp.currentSalary) * 100;
  const bandPosition =
    ((emp.currentSalary - emp.salaryBand.min) /
      (emp.salaryBand.max - emp.salaryBand.min)) *
    100;

  let baseIncrease = emp.inflation;
  baseIncrease += performanceMultiplier * 6;
  if (marketGap > 5) baseIncrease += Math.min(marketGap * 0.3, 3);
  if (bandPosition < 30) baseIncrease += 1.5;
  else if (bandPosition > 80) baseIncrease *= 0.7;

  const finalIncrease =
    Math.round(Math.max(0, Math.min(baseIncrease, 15)) * 10) / 10;
  const newSalary = Math.round(emp.currentSalary * (1 + finalIncrease / 100));

  return {
    percentage: finalIncrease,
    newSalary,
    marketGap: Math.round(marketGap * 10) / 10,
    bandPosition: Math.round(bandPosition),
    performanceMultiplier: Math.round(performanceMultiplier * 100),
  };
}
