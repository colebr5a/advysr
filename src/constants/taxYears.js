// Federal tax parameters by tax year. Update once a year when the IRS publishes
// the next year's inflation adjustments (brackets ~October, retirement limits
// ~November). Each bracket entry is [taxable income where the rate starts, rate].
//
// Sources:
//   2026 brackets & standard deduction — IRS IR-2025-103 (Rev. Proc. 2025-32)
//     https://www.irs.gov/node/151941
//   2026 retirement limits — IRS release "401(k) limit increases to $24,500 for 2026"
//     https://www.irs.gov/node/152316 (Notice 2025-67)
//   2027 brackets & standard deduction — IRS IR-2026-133 (Rev. Proc. 2026-35)
//     https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2027-taxpayers-continue-to-benefit-from-the-working-families-tax-cuts
//   2027 retirement limits — IRS IR-2026-136 (Notice 2026-66)
//     https://www.irs.gov/newsroom/401k-limit-increases-to-25500-for-2027-ira-limit-remains-7500
//   Head-of-household brackets (not in the IRS press releases) — Tax Foundation
//     tables citing the Rev. Procs: taxfoundation.org/data/all/federal/{2026,2027}-tax-brackets/

export const FILING_STATUSES = [
  { value: 'single', label: 'Single' },
  { value: 'mfj', label: 'Married, filing jointly' },
  { value: 'hoh', label: 'Head of household' },
];

export const TAX_YEARS = {
  2026: {
    standardDeduction: { single: 16100, mfj: 32200, hoh: 24150 },
    brackets: {
      single: [[0, 0.10], [12400, 0.12], [50400, 0.22], [105700, 0.24], [201775, 0.32], [256225, 0.35], [640600, 0.37]],
      mfj:    [[0, 0.10], [24800, 0.12], [100800, 0.22], [211400, 0.24], [403550, 0.32], [512450, 0.35], [768700, 0.37]],
      hoh:    [[0, 0.10], [17700, 0.12], [67450, 0.22], [105700, 0.24], [201750, 0.32], [256200, 0.35], [640600, 0.37]],
    },
    limits: { k401: 24500, k401CatchUp50: 8000, k401CatchUp60to63: 11250, ira: 7500, iraCatchUp50: 1100 },
    rothIraPhaseOut: { single: [153000, 168000], hoh: [153000, 168000], mfj: [242000, 252000] },
    // Traditional IRA deduction phase-out when the contributor is covered by a workplace plan.
    tradIraDeductionPhaseOut: { single: [81000, 91000], hoh: [81000, 91000], mfj: [129000, 149000] },
  },
  2027: {
    standardDeduction: { single: 16600, mfj: 33200, hoh: 24925 },
    brackets: {
      single: [[0, 0.10], [12800, 0.12], [52025, 0.22], [109125, 0.24], [208325, 0.32], [264550, 0.35], [661375, 0.37]],
      mfj:    [[0, 0.10], [25600, 0.12], [104050, 0.22], [218250, 0.24], [416650, 0.32], [529100, 0.35], [793650, 0.37]],
      hoh:    [[0, 0.10], [18250, 0.12], [69650, 0.22], [109100, 0.24], [208300, 0.32], [264550, 0.35], [661350, 0.37]],
    },
    limits: { k401: 25500, k401CatchUp50: 8500, k401CatchUp60to63: 11750, ira: 7500, iraCatchUp50: 1100 },
    rothIraPhaseOut: { single: [158000, 173000], hoh: [158000, 173000], mfj: [250000, 260000] },
    tradIraDeductionPhaseOut: { single: [83000, 93000], hoh: [83000, 93000], mfj: [133000, 153000] },
  },
};

const YEARS = Object.keys(TAX_YEARS).map(Number).sort((a, b) => a - b);

/**
 * Parameters for `year`. Outside the table, falls back to the nearest known
 * year and marks the result `approximate` so the UI can say so.
 */
export function taxYear(year = new Date().getFullYear()) {
  const known = TAX_YEARS[year];
  if (known) return { year, approximate: false, ...known };
  const nearest = year > YEARS[YEARS.length - 1] ? YEARS[YEARS.length - 1] : YEARS[0];
  return { year: nearest, requestedYear: year, approximate: true, ...TAX_YEARS[nearest] };
}
