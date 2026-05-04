export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=ytd';
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!response.ok) throw new Error(`Yahoo Finance responded ${response.status}`);

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('Unexpected Yahoo Finance response shape');

    const closes = result.indicators?.quote?.[0]?.close;
    if (!closes || closes.length < 2) throw new Error('Insufficient price data');

    // First valid close of the year and most recent close
    const first = closes.find(c => c != null);
    const last = [...closes].reverse().find(c => c != null);

    const ytdReturn = (last - first) / first;

    res.status(200).json({
      ytdReturn,
      firstClose: first,
      lastClose: last,
      asOf: new Date().toISOString().split('T')[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
