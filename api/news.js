const CATEGORY_QUERIES = {
  markets:  { endpoint: 'top-headlines', params: { category: 'business', language: 'en' } },
  investing: { endpoint: 'everything',   params: { q: 'investing stocks ETF bonds', sortBy: 'publishedAt', language: 'en' } },
  economy:   { endpoint: 'everything',   params: { q: 'economy inflation federal reserve GDP', sortBy: 'publishedAt', language: 'en' } },
  personal:  { endpoint: 'everything',   params: { q: 'personal finance budgeting savings retirement', sortBy: 'publishedAt', language: 'en' } },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  const { category = 'markets', q } = req.query;
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'NEWS_API_KEY not configured' });

  let endpoint, params;

  if (q && q.trim()) {
    endpoint = 'everything';
    params = { q: q.trim(), sortBy: 'relevancy', language: 'en' };
  } else {
    const cfg = CATEGORY_QUERIES[category] || CATEGORY_QUERIES.markets;
    endpoint = cfg.endpoint;
    params = { ...cfg.params };
  }

  params.apiKey = apiKey;
  params.pageSize = 30;

  const qs = new URLSearchParams(params).toString();
  const url = `https://newsapi.org/v2/${endpoint}?${qs}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'ok') {
      return res.status(502).json({ error: data.message || 'NewsAPI error' });
    }

    // Strip articles with no content or removed sources
    const articles = (data.articles || []).filter(
      a => a.title && a.title !== '[Removed]' && a.url
    );

    res.status(200).json({ articles, totalResults: data.totalResults });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
