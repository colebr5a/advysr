import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Market Heatmap ───────────────────────────────────────────────────────────

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
      exchanges: [],
      dataSource: 'SPX500',
      grouping: 'sector',
      blockSize: 'market_cap_basic',
      blockColor: 'change',
      locale: 'en',
      colorTheme: 'dark',
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: '100%',
      height: 325,
    });
    container.appendChild(script);

    return () => { container.innerHTML = ''; };
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #3a3a3a' }}>
      <div className="px-4 pt-4 pb-3 flex items-center justify-between" style={{ background: '#2c2c2c', borderBottom: '1px solid #3a3a3a' }}>
        <div>
          <h2 className="text-base font-bold text-white">Market Heatmap</h2>
          <p className="text-xs text-gray-500 mt-0.5">S&P 500 · Sized by market cap · Colored by daily change</p>
        </div>
        <span className="text-xs text-gray-600">Powered by TradingView</span>
      </div>
      <div
        ref={containerRef}
        className="tradingview-widget-container w-full"
        style={{ height: '325px', background: '#1a1a1a' }}
      />
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
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: '#2c2c2c', border: '1px solid #3a3a3a' }}>
      <div className="h-44 w-full" style={{ background: '#383838' }} />
      <div className="p-4 space-y-2.5">
        <div className="h-3 rounded w-1/3" style={{ background: '#383838' }} />
        <div className="h-4 rounded w-full" style={{ background: '#3a3a3a' }} />
        <div className="h-4 rounded w-5/6" style={{ background: '#3a3a3a' }} />
        <div className="h-3 rounded w-2/3" style={{ background: '#383838' }} />
      </div>
    </div>
  );
}

// ─── News card ────────────────────────────────────────────────────────────────

function NewsCard({ article }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = article.urlToImage && !imgError;

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.015] hover:shadow-xl group"
      style={{ background: '#2c2c2c', border: '1px solid #3a3a3a' }}
    >
      {/* Image */}
      <div className="h-44 w-full flex-shrink-0 overflow-hidden" style={{ background: '#383838' }}>
        {hasImage ? (
          <img
            src={article.urlToImage}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-primary-400 truncate">{article.source?.name || 'Unknown'}</span>
          {article.publishedAt && (
            <span className="text-xs text-gray-600 flex-shrink-0">{timeAgo(article.publishedAt)}</span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-white leading-snug line-clamp-3 group-hover:text-primary-200 transition-colors">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mt-auto pt-1">
            {article.description}
          </p>
        )}
      </div>
    </a>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function NewsPage() {
  const [category, setCategory] = useState('markets');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(id);
  }, [query]);

  const fetchNews = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ category });
    if (debouncedQuery.trim()) params.set('q', debouncedQuery.trim());

    fetch(`/api/news?${params}`)
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
    <div className="py-8 space-y-6">
    <main className="max-w-5xl mx-auto px-4 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Financial News</h1>
          <p className="text-gray-500 text-sm mt-1">Live headlines from markets, investing, and beyond</p>
        </div>
        <button
          onClick={fetchNews}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors flex-shrink-0 disabled:opacity-40"
          style={{ border: '1px solid #3a3a3a', background: '#2c2c2c' }}
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

    </main>

      {/* Heatmap — full width */}
      <div className="px-4">
        <MarketHeatmap />
      </div>

    <main className="max-w-5xl mx-auto px-4 space-y-6">

      {/* Search + category filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search any topic…"
            className="w-full pl-9 pr-4 py-2 text-sm text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            style={{ background: '#2c2c2c', border: '1px solid #3a3a3a' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 flex-shrink-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setCategory(cat.id); setQuery(''); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
                category === cat.id && !debouncedQuery
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={category === cat.id && !debouncedQuery ? {} : { background: '#2c2c2c', border: '1px solid #3a3a3a' }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: '#3a1a1a', border: '1px solid #7f1d1d40' }}>
          <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Articles grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
          : articles.map((a, i) => <NewsCard key={i} article={a} />)
        }
      </div>

      {!loading && !error && articles.length === 0 && (
        <div className="py-20 text-center text-gray-500">
          <p className="text-sm">No articles found. Try a different search or category.</p>
        </div>
      )}

      {!loading && articles.length > 0 && (
        <p className="text-xs text-gray-600 text-center pb-4">
          Powered by NewsAPI · {articles.length} articles · Data refreshes on each visit
        </p>
      )}
    </main>
    </div>
  );
}
