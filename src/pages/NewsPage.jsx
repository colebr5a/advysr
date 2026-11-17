import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE } from '../utils/api.js';

function MarketHeatmap() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
    script.async = true;
    script.textContent = JSON.stringify({
      exchanges: [], dataSource: 'SPX500', grouping: 'sector',
      blockSize: 'market_cap_basic', blockColor: 'change',
      locale: 'en', colorTheme: 'dark', hasTopBar: false,
      isDataSetEnabled: false, isZoomEnabled: true,
      hasSymbolTooltip: true, isMonoSize: false,
      width: '100%', height: 300,
    });
    container.appendChild(script);
    return () => { container.innerHTML = ''; };
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E6E9E6' }}>
      <div className="px-4 py-3" style={{ background: '#FFFFFF', borderBottom: '1px solid #E6E9E6' }}>
        <p className="font-semibold text-sm" style={{ color: '#111827' }}>Market Heatmap</p>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>S&P 500 · Market cap size · Daily change color</p>
      </div>
      <div ref={containerRef} className="tradingview-widget-container w-full" style={{ height: '300px', background: '#111827' }} />
    </div>
  );
}

const CATEGORIES = [
  { id: 'markets',   label: 'Markets' },
  { id: 'investing', label: 'Investing' },
  { id: 'economy',   label: 'Economy' },
  { id: 'personal',  label: 'Personal Finance' },
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function matchTickers(article, tickers) {
  if (!tickers.length) return [];
  const haystack = `${article.title || ''} ${article.description || ''}`;
  return tickers.filter(t => new RegExp(`\\b${t}\\b`, 'i').test(haystack));
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: '#FFFFFF', border: '1px solid #E6E9E6' }}>
      <div className="h-40 w-full" style={{ background: '#F3F4F3' }} />
      <div className="p-4 space-y-2">
        <div className="h-2.5 rounded-full w-1/3" style={{ background: '#F3F4F3' }} />
        <div className="h-3.5 rounded-full w-full" style={{ background: '#E6E9E6' }} />
        <div className="h-3.5 rounded-full w-5/6" style={{ background: '#E6E9E6' }} />
        <div className="h-2.5 rounded-full w-2/3" style={{ background: '#F3F4F3' }} />
      </div>
    </div>
  );
}

function NewsCard({ article, heldTickers = [] }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = article.urlToImage && !imgError;
  const matched  = matchTickers(article, heldTickers);

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col rounded-2xl overflow-hidden press-effect"
      style={{
        background: '#FFFFFF',
        border: matched.length ? '1.5px solid #52B788' : '1px solid #E6E9E6',
      }}
    >
      <div className="h-40 w-full flex-shrink-0 overflow-hidden" style={{ background: '#F9F8F6' }}>
        {hasImage ? (
          <img src={article.urlToImage} alt="" className="w-full h-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#C4CDC7">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" />
            </svg>
          </div>
        )}
        {matched.length > 0 && (
          <div className="relative" style={{ marginTop: '-32px', padding: '0 8px 8px' }}>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
              style={{ background: '#1B4332', color: '#FFFFFF' }}>
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22" />
              </svg>
              {matched.slice(0, 2).join(', ')}
            </span>
          </div>
        )}
      </div>
      <div className="p-3.5 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium truncate" style={{ color: '#2D6A4F' }}>{article.source?.name || '—'}</span>
          {article.publishedAt && (
            <span className="text-xs flex-shrink-0" style={{ color: '#9CA3AF' }}>{timeAgo(article.publishedAt)}</span>
          )}
        </div>
        <p className="text-sm font-semibold leading-snug line-clamp-3" style={{ color: '#111827' }}>
          {article.title}
        </p>
        {article.description && (
          <p className="text-xs leading-relaxed line-clamp-2 mt-auto pt-2" style={{ color: '#9CA3AF' }}>
            {article.description}
          </p>
        )}
      </div>
    </a>
  );
}

export function NewsPage({ profile }) {
  const heldTickers = (profile?.holdings || [])
    .map(h => h.ticker?.toUpperCase()).filter(Boolean);

  const [category, setCategory]           = useState('markets');
  const [query, setQuery]                 = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [articles, setArticles]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(id);
  }, [query]);

  const fetchNews = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ category });
    if (debouncedQuery.trim()) params.set('q', debouncedQuery.trim());
    fetch(`${API_BASE}/api/news?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setArticles(data.articles || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [category, debouncedQuery]);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  return (
    <main className="px-4 pt-3 space-y-4 max-w-2xl mx-auto">

      <MarketHeatmap />

      {/* Search + Refresh */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search any topic…"
            className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl"
            style={{ background: '#FFFFFF', border: '1.5px solid #E6E9E6', color: '#111827' }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 press-effect" style={{ color: '#9CA3AF' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={fetchNews}
          disabled={loading}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 press-effect disabled:opacity-40"
          style={{ background: '#FFFFFF', border: '1.5px solid #E6E9E6' }}
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="#6B7280" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setCategory(cat.id); setQuery(''); }}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium press-effect"
            style={{
              background: category === cat.id && !debouncedQuery ? '#1B4332' : '#FFFFFF',
              border: `1px solid ${category === cat.id && !debouncedQuery ? '#1B4332' : '#E6E9E6'}`,
              color: category === cat.id && !debouncedQuery ? '#FFFFFF' : '#6B7280',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : articles.map((a, i) => <NewsCard key={i} article={a} heldTickers={heldTickers} />)
        }
      </div>

      {!loading && !error && articles.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm" style={{ color: '#9CA3AF' }}>No articles found. Try a different search or category.</p>
        </div>
      )}

      {!loading && articles.length > 0 && (
        <p className="text-xs text-center pb-2" style={{ color: '#C4CDC7' }}>
          Powered by NewsAPI · {articles.length} articles
        </p>
      )}
    </main>
  );
}
