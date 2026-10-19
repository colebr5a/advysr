export const RISK_ASSUMPTIONS = {
  conservative: { meanReturn: 0.05, stdDev: 0.06, label: '~4–6% historical annual return' },
  moderate:     { meanReturn: 0.08, stdDev: 0.10, label: '~7–9% historical annual return' },
  aggressive:   { meanReturn: 0.105, stdDev: 0.16, label: '~9–12% historical annual return' },
};

export function getRiskAssumptions(riskTolerance) {
  return RISK_ASSUMPTIONS[riskTolerance] || RISK_ASSUMPTIONS.moderate;
}
