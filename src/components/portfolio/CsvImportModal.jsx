import { useState, useRef, useCallback } from 'react';
import { parseHoldingsCSV } from '../../utils/csvParser.js';
import { ASSET_CLASSES, getAssetClass } from '../../utils/tickerClassifier.js';
import { fmt } from '../../utils/formatters.js';

const BROKER_HINTS = [
  { name: 'Fidelity',   hint: 'Accounts → Positions → Download (CSV)' },
  { name: 'Schwab',     hint: 'Accounts → Positions → Export' },
  { name: 'Vanguard',   hint: 'My Accounts → Holdings → Download' },
  { name: 'Robinhood',  hint: 'Account → Statements → Export' },
];

const ASSET_CLASS_OPTIONS = Object.entries(ASSET_CLASSES).map(([key, val]) => ({
  value: key,
  label: val.label,
}));

function AssetClassBadge({ assetClass }) {
  const ac = getAssetClass(assetClass);
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: ac.color + '22', color: ac.color, border: `1px solid ${ac.color}44` }}
    >
      {ac.label}
    </span>
  );
}

function DropZone({ onFileParsed }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  function processFile(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file. Most brokers export positions as .csv.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const result = parseHoldingsCSV(e.target.result);
      if (result.error) setError(result.error);
      else onFileParsed(result);
    };
    reader.readAsText(file);
  }

  const onDrop = useCallback(e => {
    e.preventDefault();
    setDragging(false);
    setError(null);
    processFile(e.dataTransfer.files[0]);
  }, []);

  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all py-10 px-6"
        style={{
          borderColor: dragging ? '#1B4332' : '#C4CDC7',
          background: dragging ? '#F0FAF4' : '#F9F8F6',
        }}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#FFFFFF', border: '1px solid #E6E9E6' }}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-semibold text-sm" style={{ color: '#111827' }}>Drop your positions CSV here</p>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>or click to browse files</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={e => { setError(null); processFile(e.target.files[0]); }}
        />
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 px-4 py-3 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="#DC2626">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
        </div>
      )}

      <div className="mt-5">
        <p className="text-xs font-medium mb-2.5 uppercase tracking-wide" style={{ color: '#9CA3AF' }}>How to export from your broker</p>
        <div className="grid grid-cols-2 gap-2">
          {BROKER_HINTS.map(b => (
            <div key={b.name} className="rounded-xl px-3 py-2.5" style={{ background: '#F9F8F6', border: '1px solid #E6E9E6' }}>
              <p className="text-xs font-semibold" style={{ color: '#374151' }}>{b.name}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{b.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewStep({ parseResult, onConfirm, onBack }) {
  const { broker, holdings: initial } = parseResult;
  const [holdings, setHoldings] = useState(initial);

  const totalValue = holdings.reduce((s, h) => s + (h.currentValue || 0), 0);
  const hasCostBasis = holdings.some(h => h.costBasis != null);

  function updateClass(id, assetClass) {
    setHoldings(h => h.map(item => item.id === id ? { ...item, assetClass } : item));
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#F0FAF4' }}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#1B4332" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-sm" style={{ color: '#6B7280' }}>
          Detected <span className="font-semibold" style={{ color: '#111827' }}>{broker}</span> · {holdings.length} positions · {fmt(totalValue)} total
        </span>
      </div>

      <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid #E6E9E6' }}>
        <div className="overflow-x-auto max-h-64 overflow-y-auto no-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#F9F8F6', borderBottom: '1px solid #E6E9E6' }}>
                <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Ticker</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wide hidden sm:table-cell" style={{ color: '#9CA3AF' }}>Name</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Value</th>
                {hasCostBasis && <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase tracking-wide hidden sm:table-cell" style={{ color: '#9CA3AF' }}>Cost</th>}
                <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Class</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h, i) => (
                <tr key={h.id} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F9F8F6', borderTop: '1px solid #E6E9E6' }}>
                  <td className="px-3 py-2 font-bold text-sm" style={{ color: '#1B4332' }}>{h.ticker}</td>
                  <td className="px-3 py-2 max-w-[140px] truncate hidden sm:table-cell" style={{ color: '#9CA3AF' }}>{h.name || '—'}</td>
                  <td className="px-3 py-2 text-right font-semibold" style={{ color: '#111827' }}>
                    {h.currentValue != null ? fmt(h.currentValue) : '—'}
                  </td>
                  {hasCostBasis && (
                    <td className="px-3 py-2 text-right hidden sm:table-cell" style={{ color: '#9CA3AF' }}>
                      {h.costBasis != null ? fmt(h.costBasis) : '—'}
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <select
                      value={h.assetClass}
                      onChange={e => updateClass(h.id, e.target.value)}
                      className="text-xs rounded-lg px-1.5 py-1"
                      style={{
                        background: '#F9F8F6',
                        border: '1px solid #E6E9E6',
                        color: getAssetClass(h.assetClass).color,
                        outline: 'none',
                      }}
                    >
                      {ASSET_CLASS_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
        Asset classes are auto-detected. Adjust any that look wrong before importing.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium press-effect"
          style={{ border: '1.5px solid #E6E9E6', background: 'transparent', color: '#374151' }}
        >
          Back
        </button>
        <button
          onClick={() => onConfirm(holdings)}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold press-effect"
          style={{ background: '#1B4332', color: '#FFFFFF' }}
        >
          Import {holdings.length} Positions
        </button>
      </div>
    </div>
  );
}

export function CsvImportModal({ onImport, onClose, existingCount }) {
  const [step, setStep] = useState('drop');
  const [parseResult, setParseResult] = useState(null);

  function handleFileParsed(result) {
    setParseResult(result);
    setStep('preview');
  }

  function handleConfirm(holdings) {
    onImport(holdings);
    onClose();
  }

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ background: '#FFFFFF', border: '1px solid #E6E9E6' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #E6E9E6' }}>
          <div>
            <p className="text-base font-bold" style={{ color: '#111827' }}>Import Holdings</p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              {step === 'drop' ? 'Upload a positions CSV from your brokerage' : 'Review and confirm your positions'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center press-effect"
            style={{ background: '#F9F8F6', border: '1px solid #E6E9E6' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#6B7280" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center px-5 pt-3 pb-0 gap-2">
          {['Upload', 'Review'].map((label, i) => {
            const active = (i === 0 && step === 'drop') || (i === 1 && step === 'preview');
            const done = i === 0 && step === 'preview';
            return (
              <div key={label} className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: done ? '#1B4332' : active ? '#1B4332' : '#F9F8F6',
                    color: done || active ? '#FFFFFF' : '#9CA3AF',
                    border: done || active ? 'none' : '1px solid #E6E9E6',
                  }}
                >
                  {done ? '✓' : i + 1}
                </div>
                <span className="text-xs font-medium" style={{ color: active ? '#111827' : '#9CA3AF' }}>{label}</span>
                {i < 1 && <div className="w-5 h-px mx-1" style={{ background: '#E6E9E6' }} />}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="px-5 pb-6 pt-4">
          {step === 'drop' && <DropZone onFileParsed={handleFileParsed} />}
          {step === 'preview' && parseResult && (
            <PreviewStep
              parseResult={parseResult}
              onConfirm={handleConfirm}
              onBack={() => setStep('drop')}
            />
          )}
        </div>

        {existingCount > 0 && step === 'drop' && (
          <div className="px-5 pb-5 -mt-2">
            <p className="text-xs flex items-center gap-1.5" style={{ color: '#D97706' }}>
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Importing will replace your current {existingCount} positions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
