import { classifyTicker } from './tickerClassifier.js';

/** Parse a raw CSV string into an array of string-array rows */
function parseRawCSV(text) {
  const lines = text.split(/\r?\n/);
  return lines.map(line => {
    const cols = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        // Handle escaped double-quote ""
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === ',' && !inQ) {
        cols.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    return cols;
  });
}

/** Strip dollar signs, commas, +/- signs, and percent signs from a value string */
function cleanNumber(val) {
  if (!val) return null;
  const cleaned = String(val).replace(/[$,%+]/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

/** Find the row index that matches a set of expected column names */
function findHeaderRow(rows, candidates) {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const lower = rows[i].map(c => c.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const matched = candidates.filter(c => lower.includes(c.toLowerCase().replace(/[^a-z0-9]/g, '')));
    if (matched.length >= candidates.length * 0.6) return i;
  }
  return -1;
}

/** Build a column-index lookup from a header row */
function buildColMap(headerRow) {
  const map = {};
  headerRow.forEach((h, i) => {
    map[h.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()] = i;
  });
  return map;
}

function getCol(row, colMap, ...names) {
  for (const name of names) {
    const key = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    if (key in colMap && colMap[key] < row.length) {
      const val = row[colMap[key]];
      if (val && val !== '--' && val !== 'n/a' && val !== '') return val;
    }
  }
  return null;
}

// ─── Broker-specific parsers ───────────────────────────────────────────────

function parseFidelity(rows) {
  const headerIdx = findHeaderRow(rows, ['symbol', 'description', 'quantity', 'current value']);
  if (headerIdx === -1) return null;

  const colMap = buildColMap(rows[headerIdx]);
  const holdings = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 3) continue;

    const ticker = getCol(row, colMap, 'symbol');
    if (!ticker || ticker === 'Symbol' || ticker.toLowerCase().includes('pending') || ticker.startsWith('--')) continue;
    // Skip cash rows and totals
    if (['SPAXX**', 'FDRXX**', 'Total'].some(t => ticker.includes(t))) continue;

    const name = getCol(row, colMap, 'description') || '';
    const shares = cleanNumber(getCol(row, colMap, 'quantity'));
    const currentValue = cleanNumber(getCol(row, colMap, 'current value'));
    const costBasis = cleanNumber(getCol(row, colMap, 'cost basis total'));

    if (!ticker || (!currentValue && !shares)) continue;

    holdings.push({
      ticker: ticker.replace('*', '').trim(),
      name,
      shares,
      currentValue,
      costBasis,
      assetClass: classifyTicker(ticker),
    });
  }

  return holdings.length > 0 ? holdings : null;
}

function parseSchwab(rows) {
  const headerIdx = findHeaderRow(rows, ['symbol', 'description', 'quantity', 'market value']);
  if (headerIdx === -1) return null;

  const colMap = buildColMap(rows[headerIdx]);
  const holdings = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 3) continue;

    const ticker = getCol(row, colMap, 'symbol');
    if (!ticker || ticker === 'Symbol' || ticker === 'Account Total') continue;
    if (ticker.startsWith('Cash') || ticker === '--') continue;

    const name = getCol(row, colMap, 'description') || '';
    const shares = cleanNumber(getCol(row, colMap, 'quantity'));
    const currentValue = cleanNumber(getCol(row, colMap, 'market value'));
    const costBasis = cleanNumber(getCol(row, colMap, 'cost basis'));

    if (!ticker || (!currentValue && !shares)) continue;

    holdings.push({
      ticker: ticker.trim(),
      name,
      shares,
      currentValue,
      costBasis,
      assetClass: classifyTicker(ticker),
    });
  }

  return holdings.length > 0 ? holdings : null;
}

function parseVanguard(rows) {
  const headerIdx = findHeaderRow(rows, ['symbol', 'shares', 'total value']);
  if (headerIdx === -1) return null;

  const colMap = buildColMap(rows[headerIdx]);
  const holdings = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 3) continue;

    const ticker = getCol(row, colMap, 'symbol');
    if (!ticker || ticker === 'Symbol') continue;

    const name = getCol(row, colMap, 'investment name', 'fund name') || '';
    const shares = cleanNumber(getCol(row, colMap, 'shares'));
    const sharePrice = cleanNumber(getCol(row, colMap, 'share price'));
    const currentValue = cleanNumber(getCol(row, colMap, 'total value')) ||
      (shares && sharePrice ? shares * sharePrice : null);

    if (!ticker || (!currentValue && !shares)) continue;

    holdings.push({
      ticker: ticker.trim(),
      name,
      shares,
      currentValue,
      costBasis: null,
      assetClass: classifyTicker(ticker),
    });
  }

  return holdings.length > 0 ? holdings : null;
}

function parseRobinhood(rows) {
  const headerIdx = findHeaderRow(rows, ['symbol', 'quantity', 'equity']);
  if (headerIdx === -1) return null;

  const colMap = buildColMap(rows[headerIdx]);
  const holdings = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 3) continue;

    const ticker = getCol(row, colMap, 'symbol');
    if (!ticker || ticker === 'symbol') continue;

    const name = getCol(row, colMap, 'name') || '';
    const shares = cleanNumber(getCol(row, colMap, 'quantity'));
    const avgBuyPrice = cleanNumber(getCol(row, colMap, 'average buy price'));
    const currentValue = cleanNumber(getCol(row, colMap, 'equity'));
    const costBasis = (shares && avgBuyPrice) ? shares * avgBuyPrice : null;

    if (!ticker || (!currentValue && !shares)) continue;

    holdings.push({
      ticker: ticker.trim().toUpperCase(),
      name,
      shares,
      currentValue,
      costBasis,
      assetClass: classifyTicker(ticker),
    });
  }

  return holdings.length > 0 ? holdings : null;
}

// Generic fallback: try to find symbol/value columns by common names
function parseGeneric(rows) {
  const headerIdx = findHeaderRow(rows, ['symbol', 'value']);
  if (headerIdx === -1) return null;

  const colMap = buildColMap(rows[headerIdx]);
  const holdings = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2) continue;

    const ticker = getCol(row, colMap, 'symbol', 'ticker');
    if (!ticker) continue;

    const name = getCol(row, colMap, 'name', 'description', 'security') || '';
    const shares = cleanNumber(getCol(row, colMap, 'shares', 'quantity', 'units'));
    const currentValue = cleanNumber(getCol(row, colMap, 'value', 'market value', 'current value', 'total value'));
    const costBasis = cleanNumber(getCol(row, colMap, 'cost basis', 'cost basis total'));

    if (!ticker || (!currentValue && !shares)) continue;

    holdings.push({
      ticker: ticker.trim().toUpperCase(),
      name,
      shares,
      currentValue,
      costBasis,
      assetClass: classifyTicker(ticker),
    });
  }

  return holdings.length > 0 ? holdings : null;
}

// ─── Broker detection ─────────────────────────────────────────────────────

function detectBroker(text, rows) {
  const sample = text.slice(0, 2000).toLowerCase();
  if (sample.includes('fidelity')) return 'Fidelity';
  if (sample.includes('schwab')) return 'Schwab';
  if (sample.includes('vanguard')) return 'Vanguard';
  if (sample.includes('robinhood')) return 'Robinhood';

  // Check header columns
  const allText = rows.slice(0, 8).flat().map(c => c.toLowerCase()).join(' ');
  if (allText.includes('average buy price') && allText.includes('equity')) return 'Robinhood';
  if (allText.includes('market value') && allText.includes('security type')) return 'Schwab';
  if (allText.includes('investment name') && allText.includes('share price')) return 'Vanguard';
  if (allText.includes('cost basis total') || allText.includes('account name/number')) return 'Fidelity';

  return 'Unknown Broker';
}

// ─── Main export ──────────────────────────────────────────────────────────

/**
 * Parse a CSV file and return holdings + metadata.
 * Returns { broker, holdings, error } where holdings is an array of:
 *   { ticker, name, shares, currentValue, costBasis, assetClass }
 */
export function parseHoldingsCSV(text) {
  try {
    const rows = parseRawCSV(text);
    if (rows.length < 2) return { error: 'File appears to be empty or invalid.' };

    const broker = detectBroker(text, rows);

    // Try each parser in order of specificity
    let holdings =
      parseFidelity(rows) ||
      parseSchwab(rows) ||
      parseVanguard(rows) ||
      parseRobinhood(rows) ||
      parseGeneric(rows);

    if (!holdings || holdings.length === 0) {
      return { error: 'Could not parse positions from this file. Make sure it\'s a positions/holdings export (not a transaction history).' };
    }

    // Assign stable IDs
    holdings = holdings.map((h, i) => ({
      id: `h_${Date.now()}_${i}`,
      ...h,
      importedAt: new Date().toISOString().split('T')[0],
    }));

    return { broker, holdings };
  } catch (err) {
    return { error: `Parse error: ${err.message}` };
  }
}
