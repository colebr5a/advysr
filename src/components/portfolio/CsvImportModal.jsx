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

// Step 1: Drop zone
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
      if (result.error) {
        setError(result.error);
      } else {
        onFileParsed(result);
      }
    };
    reader.readAsText(file);
  }

  const onDrop = useCallback(e => {
    e.preventDefault();
    setDragging(false);
    setError(null);
    processFile(e.dataTransfer.files[0]);
  }, []);

  const onDragOver = e => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  return (
    <div>
      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all py-12 px-6 ${
          dragging
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-[#3a3a3a] hover:border-primary-600/60 hover:bg-primary-500/5'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#383838' }}>
          <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-semibold text-white">Drop your positions CSV here</p>
          <p className="text-sm text-gray-500 mt-1">or click to browse files</p>
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
        <div className="mt-3 flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Broker support hints */}
      <div className="mt-5">
        <p className="text-xs text-gray-500 mb-2.5 font-medium uppercase tracking-wide">How to export from your broker</p>
        <div className="grid grid-cols-2 gap-2">
          {BROKER_HINTS.map(b => (
            <div key={b.name} className="rounded-xl px-3 py-2.5" style={{ background: '#383838' }}>
              <p className="text-xs font-semibold text-gray-300">{b.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{b.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 2: Preview & confirm
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
      {/* Detection summary */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-300">
            Detected <span className="text-white font-semibold">{broker}</span> · {holdings.length} positions · {fmt(totalValue)} total
          </span>
        </div>
      </div>

      {/* Preview table */}
      <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid #3a3a3a' }}>
        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#383838' }}>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Ticker</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Name</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Value</th>
                {hasCostBasis && <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Cost Basis</th>}
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Asset Class</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h, i) => (
                <tr
                  key={h.id}
                  style={{ background: i % 2 === 0 ? '#2c2c2c' : '#313131', borderTop: '1px solid #3a3a3a' }}
                >
                  <td className="px-3 py-2 font-mono font-bold text-white text-sm">{h.ticker}</td>
                  <td className="px-3 py-2 text-gray-400 max-w-[140px] truncate hidden sm:table-cell">{h.name || '—'}</td>
                  <td className="px-3 py-2 text-right font-semibold text-white">
                    {h.currentValue != null ? fmt(h.currentValue) : '—'}
                  </td>
                  {hasCostBasis && (
                    <td className="px-3 py-2 text-right text-gray-400 hidden sm:table-cell">
                      {h.costBasis != null ? fmt(h.costBasis) : '—'}
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <select
                      value={h.assetClass}
                      onChange={e => updateClass(h.id, e.target.value)}
                      className="text-xs rounded-lg px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                      style={{ background: '#383838', border: '1px solid #4a4a4a', color: getAssetClass(h.assetClass).color }}
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

      <p className="text-xs text-gray-500 mb-4">
        Asset classes are auto-detected. Adjust any that look wrong before importing.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
          style={{ border: '1px solid #3a3a3a' }}
        >
          ← Back
        </button>
        <button
          onClick={() => onConfirm(holdings)}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
        >
          Import {holdings.length} Positions
        </button>
      </div>
    </div>
  );
}

// Main modal
export function CsvImportModal({ onImport, onClose, existingCount }) {
  const [step, setStep] = useState('drop'); // 'drop' | 'preview'
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: '#2c2c2c', border: '1px solid #3a3a3a' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid #3a3a3a' }}>
          <div>
            <h2 className="text-lg font-bold text-white">Import Holdings</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {step === 'drop'
                ? 'Upload a positions CSV from your brokerage'
                : 'Review and confirm your positions'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex px-6 pt-3 pb-0 gap-2">
          {['Upload', 'Review'].map((label, i) => {
            const active = (i === 0 && step === 'drop') || (i === 1 && step === 'preview');
            const done = i === 0 && step === 'preview';
            return (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done ? 'bg-green-500 text-white' : active ? 'bg-primary-600 text-white' : 'text-gray-500'
                }`} style={!done && !active ? { background: '#383838' } : {}}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium ${active ? 'text-white' : 'text-gray-500'}`}>{label}</span>
                {i < 1 && <div className="w-6 h-px mx-1" style={{ background: '#3a3a3a' }} />}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-4">
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
          <div className="px-6 pb-5 -mt-2">
            <p className="text-xs text-amber-400/80 flex items-center gap-1.5">
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
