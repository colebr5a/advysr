// Asset class definitions — used for portfolio allocation charts and target comparisons
export const ASSET_CLASSES = {
  us_large_cap:      { label: 'US Large-Cap',        color: '#3b82f6', group: 'Stocks' },
  us_small_mid:      { label: 'US Small/Mid-Cap',    color: '#8b5cf6', group: 'Stocks' },
  international_dev: { label: 'Intl. Developed',     color: '#06b6d4', group: 'Stocks' },
  emerging_markets:  { label: 'Emerging Markets',    color: '#7c3aed', group: 'Stocks' },
  dividend:          { label: 'Dividend/Income',     color: '#60a5fa', group: 'Stocks' },
  sector_tech:       { label: 'Technology',          color: '#f59e0b', group: 'Sectors' },
  sector_health:     { label: 'Healthcare',          color: '#10b981', group: 'Sectors' },
  sector_energy:     { label: 'Energy',              color: '#f97316', group: 'Sectors' },
  sector_other:      { label: 'Other Sector',        color: '#6366f1', group: 'Sectors' },
  bonds_gov:         { label: 'Gov. Bonds',          color: '#4f46e5', group: 'Bonds' },
  bonds_corp:        { label: 'Corp. Bonds',         color: '#818cf8', group: 'Bonds' },
  bonds_total:       { label: 'Total Bond Market',   color: '#6366f1', group: 'Bonds' },
  reits:             { label: 'REITs',               color: '#a78bfa', group: 'Alternatives' },
  commodities:       { label: 'Commodities',         color: '#fb923c', group: 'Alternatives' },
  crypto:            { label: 'Crypto',              color: '#f97316', group: 'Alternatives' },
  leveraged:         { label: 'Leveraged ETFs',      color: '#ef4444', group: 'Alternatives' },
  cash:              { label: 'Cash/Money Market',   color: '#84cc16', group: 'Cash' },
  individual_stock:  { label: 'Individual Stock',    color: '#1d4ed8', group: 'Stocks' },
  other:             { label: 'Other',               color: '#6b7280', group: 'Other' },
};

// Target allocations by risk profile, keyed to ASSET_CLASSES
export const TARGET_ALLOCATIONS = {
  conservative: {
    bonds_gov:    0.30,
    bonds_corp:   0.20,
    dividend:     0.20,
    us_large_cap: 0.15,
    cash:         0.10,
    reits:        0.05,
  },
  moderate: {
    us_large_cap:      0.30,
    international_dev: 0.15,
    bonds_total:       0.15,
    us_small_mid:      0.10,
    sector_tech:       0.10,
    reits:             0.08,
    cash:              0.07,
    commodities:       0.05,
  },
  aggressive: {
    us_large_cap:     0.30,
    individual_stock: 0.20,
    emerging_markets: 0.15,
    us_small_mid:     0.10,
    sector_tech:      0.10,
    leveraged:        0.05,
    crypto:           0.05,
    commodities:      0.05,
  },
};

// Well-known ETF / fund ticker → asset class
const TICKER_MAP = {
  // US Large-Cap
  VOO: 'us_large_cap', SPY: 'us_large_cap', IVV: 'us_large_cap',
  VTI: 'us_large_cap', ITOT: 'us_large_cap', SCHB: 'us_large_cap',
  VUG: 'us_large_cap', MGK: 'us_large_cap', VONE: 'us_large_cap',

  // US Growth / Tech-heavy large cap
  QQQ: 'us_large_cap', QQQM: 'us_large_cap', ONEQ: 'us_large_cap',

  // US Small/Mid-Cap
  VB: 'us_small_mid', IJR: 'us_small_mid', IWM: 'us_small_mid',
  VIOO: 'us_small_mid', IWC: 'us_small_mid', VXF: 'us_small_mid',
  MDY: 'us_small_mid', IJH: 'us_small_mid', SCHA: 'us_small_mid',
  SCHM: 'us_small_mid',

  // International Developed
  VXUS: 'international_dev', EFA: 'international_dev', VEA: 'international_dev',
  SCHF: 'international_dev', IEFA: 'international_dev', EFV: 'international_dev',
  VGK: 'international_dev', EWJ: 'international_dev', ACWX: 'international_dev',

  // Emerging Markets
  VWO: 'emerging_markets', EEM: 'emerging_markets', IEMG: 'emerging_markets',
  SCHE: 'emerging_markets', GMF: 'emerging_markets', EEMV: 'emerging_markets',

  // Dividend / Income
  VYM: 'dividend', SCHD: 'dividend', DVY: 'dividend',
  HDV: 'dividend', DGRO: 'dividend', NOBL: 'dividend',
  JEPI: 'dividend', JEPQ: 'dividend',

  // Sector — Technology
  XLK: 'sector_tech', SOXX: 'sector_tech', SMH: 'sector_tech',
  ARKK: 'sector_tech', IGV: 'sector_tech', HACK: 'sector_tech',

  // Sector — Healthcare
  XLV: 'sector_health', VHT: 'sector_health', XBI: 'sector_health',
  IBB: 'sector_health', ARKG: 'sector_health',

  // Sector — Energy
  XLE: 'sector_energy', VDE: 'sector_energy', AMLP: 'sector_energy',

  // Sector — Other
  XLF: 'sector_other', XLI: 'sector_other', XLY: 'sector_other',
  XLP: 'sector_other', XLU: 'sector_other', XLB: 'sector_other',
  XLC: 'sector_other', XLRE: 'reits', GLD: 'commodities',

  // Government Bonds
  TLT: 'bonds_gov', IEF: 'bonds_gov', SHY: 'bonds_gov',
  VGSH: 'bonds_gov', VGIT: 'bonds_gov', VGLT: 'bonds_gov',
  SGOV: 'cash', SHV: 'cash', BIL: 'cash',

  // Corporate Bonds
  LQD: 'bonds_corp', VCIT: 'bonds_corp', VCSH: 'bonds_corp',
  HYG: 'bonds_corp', JNK: 'bonds_corp', USHY: 'bonds_corp',

  // Total Bond Market
  BND: 'bonds_total', AGG: 'bonds_total', FXNAX: 'bonds_total',
  BNDX: 'bonds_total', SCHZ: 'bonds_total',

  // REITs
  VNQ: 'reits', SCHH: 'reits', IYR: 'reits',
  O: 'reits', AMT: 'reits', EQIX: 'reits',

  // Commodities
  GLD: 'commodities', IAU: 'commodities', SLV: 'commodities',
  GDX: 'commodities', PDBC: 'commodities', DJP: 'commodities',
  DBC: 'commodities', USO: 'commodities',

  // Crypto ETFs
  IBIT: 'crypto', FBTC: 'crypto', GBTC: 'crypto',
  BITB: 'crypto', ARKB: 'crypto',

  // Leveraged ETFs
  TQQQ: 'leveraged', UPRO: 'leveraged', SPXL: 'leveraged',
  SOXL: 'leveraged', TECL: 'leveraged', FAS: 'leveraged',

  // Cash / Money Market
  VMFXX: 'cash', SPAXX: 'cash', FDRXX: 'cash',
  SWVXX: 'cash',
};

// Common individual stock tickers that we know aren't ETFs
const KNOWN_STOCKS = new Set([
  'AAPL','MSFT','GOOGL','GOOG','AMZN','META','NVDA','TSLA','BRK.B','BRK.A',
  'JPM','V','UNH','JNJ','XOM','WMT','MA','PG','HD','CVX','MRK','ABBV',
  'LLY','BAC','AVGO','COST','MCD','ORCL','ACN','TMO','ABT','CRM','NFLX',
  'AMD','INTC','QCOM','TXN','AMAT','INTU','ADBE','NOW','PYPL','UBER',
  'LYFT','SNOW','PLTR','COIN','HOOD','RIVN','LCID','NIO','BABA','TSM',
]);

/**
 * Returns the asset class key for a given ticker symbol.
 * Falls back to 'individual_stock' for known stocks, 'other' for everything else.
 */
export function classifyTicker(ticker) {
  if (!ticker) return 'other';
  const t = ticker.toUpperCase().trim();
  if (TICKER_MAP[t]) return TICKER_MAP[t];
  if (KNOWN_STOCKS.has(t)) return 'individual_stock';
  // Heuristic: ETF tickers are typically 2–5 uppercase letters, no digits
  // Individual stocks often shorter; mutual funds often end in X
  if (/^[A-Z]{2,5}$/.test(t)) return 'other'; // Could be either; default other
  return 'other';
}

export function getAssetClass(key) {
  return ASSET_CLASSES[key] || ASSET_CLASSES.other;
}
