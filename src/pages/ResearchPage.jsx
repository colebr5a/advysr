import { useState, useRef, useEffect } from 'react';
import { monthlySurplus } from '../utils/calculations.js';
import { apiFetch } from '../lib/apiClient.js';
import { AI_QUERIES_PER_MONTH } from '../lib/usage.js';
import { Disclaimer } from '../components/ui/Disclaimer.jsx';

const SUGGESTED = [
  'What are the risks of QQQ vs VOO?',
  'Should I prioritize paying debt or investing?',
  'Explain dollar-cost averaging',
  'What is a good bond allocation for my risk level?',
  'How do I evaluate an ETF?',
  'What is the difference between a Roth IRA and a 401k?',
  'How do I start investing with a small amount?',
  'What are index funds and why are they popular?',
];

export function ResearchPage({ profile, aiQueriesUsed = 0, onAiResponse }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);
  const surplus                 = Math.max(0, monthlySurplus(profile));

  const queriesUsed  = aiQueriesUsed;
  const queriesLeft  = Math.max(0, AI_QUERIES_PER_MONTH - queriesUsed);
  const atLimit      = queriesLeft === 0;
  const showUsage    = queriesLeft <= 10; // only surface the cap when it's close

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function ask(question) {
    if (!question.trim() || loading) return;
    if (atLimit) return;

    setMessages(m => [...m, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    try {
      // Profile context is loaded server-side from the user's saved profile.
      const res = await apiFetch('/api/research', {
        method: 'POST',
        body: { question, history: messages.slice(-6) },
      });
      onAiResponse?.(res);
      const { data } = res;
      setMessages(m => [...m, { role: 'assistant', text: data.answer || data.error || 'No response.' }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Error reaching research assistant. Try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col px-4 pt-2 max-w-2xl mx-auto" style={{ height: 'calc(100dvh - 52px - 64px - env(safe-area-inset-bottom, 0px))' }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#1B4332' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#FFFFFF" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold" style={{ color: '#111827' }}>Investment Research</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Powered by Claude · personalized to you</p>
        </div>
      </div>

      {/* Usage indicator (near the monthly cap) */}
      {showUsage && (
        <div
          className="flex items-center justify-between px-3 py-2 rounded-xl mb-3 flex-shrink-0"
          style={{ background: atLimit ? '#FEF2F2' : '#F9F8F6', border: `1px solid ${atLimit ? '#FECACA' : '#E6E9E6'}` }}
        >
          <p className="text-xs" style={{ color: atLimit ? '#DC2626' : '#6B7280' }}>
            {atLimit
              ? 'Monthly AI limit reached — resets on the 1st'
              : `${queriesLeft} of ${AI_QUERIES_PER_MONTH} AI questions left this month`}
          </p>
        </div>
      )}

      {/* Context pills */}
      <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
        <span
          className="text-xs px-2.5 py-1 rounded-full"
          style={{ background: '#F0FAF4', border: '1px solid #B7E4C7', color: '#2D6A4F' }}
        >
          {profile.riskTolerance ? `${profile.riskTolerance} risk` : 'Risk: not set'}
        </span>
        <span
          className="text-xs px-2.5 py-1 rounded-full"
          style={{ background: '#F0FAF4', border: '1px solid #B7E4C7', color: '#2D6A4F' }}
        >
          ${surplus}/mo surplus
        </span>
        <span
          className="text-xs px-2.5 py-1 rounded-full"
          style={{ background: '#F0FAF4', border: '1px solid #B7E4C7', color: '#2D6A4F' }}
        >
          {(profile.accounts || []).length} accounts
        </span>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ minHeight: 0 }}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-end pb-4">
            <p className="text-xs text-center mb-3" style={{ color: '#9CA3AF' }}>Suggested questions</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED.map(q => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  className="text-xs px-3 py-1.5 rounded-full press-effect text-left"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E6E9E6',
                    color: '#374151',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: '#1B4332' }}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#FFFFFF" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                )}
                <div
                  className="max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={m.role === 'user' ? {
                    background: '#1B4332',
                    color: '#FFFFFF',
                    borderBottomRightRadius: '6px',
                  } : {
                    background: '#FFFFFF',
                    border: '1px solid #E6E9E6',
                    color: '#374151',
                    borderBottomLeftRadius: '6px',
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: '#1B4332' }}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#FFFFFF" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div
                  className="px-3.5 py-3 rounded-2xl flex items-center gap-1"
                  style={{ background: '#FFFFFF', border: '1px solid #E6E9E6', borderBottomLeftRadius: '6px' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full dot-1" style={{ background: '#9CA3AF' }} />
                  <span className="w-1.5 h-1.5 rounded-full dot-2" style={{ background: '#9CA3AF' }} />
                  <span className="w-1.5 h-1.5 rounded-full dot-3" style={{ background: '#9CA3AF' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div
        className="flex-shrink-0 flex gap-2 pt-3 pb-2"
        style={{ borderTop: '1px solid #E6E9E6' }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && ask(input)}
          placeholder="Ask about a stock, ETF, strategy…"
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-2xl text-sm"
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #E6E9E6',
            color: '#111827',
          }}
        />
        <button
          onClick={() => ask(input)}
          disabled={!input.trim() || loading}
          className="px-4 py-3 rounded-2xl font-medium text-sm press-effect disabled:opacity-40"
          style={{ background: '#1B4332', color: '#FFFFFF' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>

      <Disclaimer />
    </main>
  );
}
