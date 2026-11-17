// Regenerates src/data/marketHistory.json — monthly total returns (dividends
// reinvested, via adjusted close) for:
//   stocks: VFINX  (Vanguard 500 Index — S&P 500)
//   bonds:  VBMFX  (Vanguard Total Bond Market Index)
// Only months where both funds have data are kept, so stock/bond returns stay
// paired — the bootstrap samples them together and preserves their correlation.
//
//   node scripts/fetch-market-history.mjs

import { writeFile } from 'node:fs/promises';

const OUT = new URL('../src/data/marketHistory.json', import.meta.url);

async function monthlyAdjClose(symbol) {
  // An explicit period keeps monthly granularity (range=max silently downgrades to quarterly).
  const now = Math.floor(Date.now() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1mo&period1=0&period2=${now}&events=div,split`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`${symbol}: HTTP ${res.status}`);
  const r = (await res.json()).chart.result[0];
  if (r.meta.dataGranularity !== '1mo') throw new Error(`${symbol}: got ${r.meta.dataGranularity} data, expected 1mo`);
  const adj = r.indicators.adjclose[0].adjclose;
  const out = new Map();
  r.timestamp.forEach((t, i) => {
    if (adj[i] == null) return;
    const d = new Date(t * 1000);
    out.set(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`, adj[i]);
  });
  return out;
}

function toReturns(prices) {
  const keys = [...prices.keys()].sort();
  const out = new Map();
  for (let i = 1; i < keys.length; i++) {
    out.set(keys[i], prices.get(keys[i]) / prices.get(keys[i - 1]) - 1);
  }
  return out;
}

const [s, b] = await Promise.all([monthlyAdjClose('VFINX'), monthlyAdjClose('VBMFX')]);
const sr = toReturns(s), br = toReturns(b);

// Drop the current (incomplete) month.
const thisMonth = new Date().toISOString().slice(0, 7);
const months = [...sr.keys()].filter(m => br.has(m) && m < thisMonth).sort();

const round = x => Math.round(x * 1e6) / 1e6;
const data = {
  source: 'Yahoo Finance monthly adjusted close: VFINX (stocks), VBMFX (bonds)',
  generated: new Date().toISOString().slice(0, 10),
  start: months[0],
  end: months.at(-1),
  months,
  stocks: months.map(m => round(sr.get(m))),
  bonds: months.map(m => round(br.get(m))),
};
await writeFile(OUT, JSON.stringify(data));
console.log(`Wrote ${months.length} months (${data.start} → ${data.end}) to ${OUT.pathname}`);
