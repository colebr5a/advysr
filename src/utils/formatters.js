export const fmt = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(n);
export const fmtPct = (n) => `${(n * 100).toFixed(1)}%`;
export const fmtMonths = (n) => n === 1 ? '1 month' : `${n} months`;
