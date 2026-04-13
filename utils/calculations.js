export function calcWeightedGoalScore(goals) {
  if (!goals.length) return 0;
  const totalWeight = goals.reduce((s, g) => s + (g.weight || 0), 0);
  if (!totalWeight) return goals.reduce((s, g) => s + g.progress, 0) / goals.length;
  return goals.reduce((s, g) => s + (g.progress * (g.weight || 0)) / totalWeight, 0);
}

export function calcSalaryRecommendation(emp, { inflation } = {}) {
  const goalScore = calcWeightedGoalScore(emp.personalGoals);
  const teamAvg =
    emp.teamGoals.reduce((s, g) => s + g.progress, 0) / (emp.teamGoals.length || 1);
  const extrasBonus = Math.min(emp.extras.length * 0.4, 2.0);
  const highlightsBonus = Math.min(emp.highlights.length * 0.25, 1.5);

  // Competency score: percentage of met competencies + milestone bonus for targets
  const assessments = emp.competencyAssessments || [];
  let competencyScore = 0;
  if (assessments.length > 0) {
    const metCount = assessments.filter(a => a.met).length;
    const baseScore = metCount / assessments.length;

    // Milestone bonus: for target competencies, completed milestones add up to 20% bonus
    const targetAssessments = assessments.filter(a => a.isTarget && a.milestones.length > 0);
    let milestoneBonus = 0;
    if (targetAssessments.length > 0) {
      const totalMilestones = targetAssessments.reduce((s, a) => s + a.milestones.length, 0);
      const doneMilestones = targetAssessments.reduce((s, a) => s + a.milestones.filter(m => m.status === 'done').length, 0);
      milestoneBonus = (doneMilestones / totalMilestones) * 0.2;
    }

    competencyScore = Math.min(baseScore + milestoneBonus, 1.0);
  }

  const performanceMultiplier =
    (goalScore / 100) * 0.25 +
    (teamAvg / 100) * 0.2 +
    (emp.performanceScore / 5) * 0.2 +
    competencyScore * 0.2 +
    (extrasBonus / 2) * 0.1 +
    (highlightsBonus / 1.5) * 0.05;

  const marketGap = ((emp.marketRate - emp.currentSalary) / emp.currentSalary) * 100;
  const bandPosition =
    ((emp.currentSalary - emp.salaryBand.min) /
      (emp.salaryBand.max - emp.salaryBand.min)) *
    100;

  let baseIncrease = inflation != null ? inflation : emp.inflation;
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
    increaseAbsolute: newSalary - emp.currentSalary,
    marketGap: Math.round(marketGap * 10) / 10,
    bandPosition: Math.round(bandPosition),
    performanceMultiplier: Math.round(performanceMultiplier * 100),
    competencyScore: Math.round(competencyScore * 100),
  };
}

export function distributeBudget(employees, budget, { inflation } = {}) {
  if (!budget || budget <= 0) return null;

  const recs = employees.map((emp) => {
    const rec = calcSalaryRecommendation(emp, { inflation });
    return { emp, rec, idealIncrease: rec.newSalary - emp.currentSalary };
  });

  const totalIdeal = recs.reduce((s, r) => s + r.idealIncrease, 0);

  // If budget covers everything, use ideal recommendations
  if (budget >= totalIdeal) {
    return {
      totalIdeal,
      remaining: budget - totalIdeal,
      allocations: recs.map((r) => ({
        empId: r.emp.id,
        allocated: r.idealIncrease,
        newSalary: r.rec.newSalary,
        percentage: r.rec.percentage,
        isCapped: false,
      })),
    };
  }

  // Otherwise distribute proportionally based on ideal increase weights
  const ratio = budget / totalIdeal;
  const allocations = recs.map((r) => {
    const allocated = Math.round(r.idealIncrease * ratio);
    const newSalary = r.emp.currentSalary + allocated;
    const percentage = Math.round((allocated / r.emp.currentSalary) * 1000) / 10;
    return {
      empId: r.emp.id,
      allocated,
      newSalary,
      percentage,
      isCapped: true,
    };
  });

  return {
    totalIdeal,
    remaining: budget - allocations.reduce((s, a) => s + a.allocated, 0),
    allocations,
  };
}
