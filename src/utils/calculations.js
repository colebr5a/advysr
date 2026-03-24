export function totalExpenses(profile) {
  return (profile.fixedExpenses?.total || 0) + (profile.variableExpenses?.total || 0);
}

export function monthlySurplus(profile) {
  return (profile.monthlyIncome || 0) - totalExpenses(profile);
}

export function savingsRate(profile) {
  if (!profile.monthlyIncome) return 0;
  return Math.max(0, monthlySurplus(profile) / profile.monthlyIncome);
}

export function totalDebt(profile) {
  return (profile.debts || []).reduce((sum, d) => sum + d.balance, 0);
}

export function netWorth(profile) {
  return (profile.currentSavings || 0) + (profile.emergencyFundBalance || 0) - totalDebt(profile);
}

export function emergencyFundTarget(profile, months = 6) {
  return totalExpenses(profile) * months;
}
