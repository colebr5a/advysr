export const fmtPct0 = v => `${Math.round(v * 100)}%`;

export const fmtYears = months => {
  const y = months / 12;
  return Number.isInteger(y) ? `${y} yr${y === 1 ? '' : 's'}` : `${y.toFixed(1)} yrs`;
};
