import { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { monthlySurplus } from '../utils/calculations.js';

const SUGGESTED_QUESTIONS = [
  'What are the risks of QQQ vs VOO?',
  'Should I prioritize paying debt or investing?',
  'Explain dollar-cost averaging',
  'What is a good bond allocation for my risk level?',
  'How do I evaluate an ETF?',
  'What is the difference between a Roth IRA and a 401k?',
  'How do I start investing with a small amount?',
  'What are index funds and why are they popular?',
];

export function ResearchPage({ profile }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const surplus = Math.max(0, monthlySurplus(profile));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function ask(question) {
    if (!question.trim() || loading) return;
    setMessages(m => [...m, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: {
            riskTolerance: profile.riskTolerance,
            monthlyIncome: profile.monthlyIncome,
            surplus,
            accounts: profile.accounts || [],
            goals: profile.goals || [],
          },
        }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: 'assistant', text: data.answer || data.error || 'No response.' }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Error reaching research assistant. Try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-bold text-lg">A</div>
        <div>
          <h1 className="text-2xl font-bold text-white">Investment Research</h1>
          <p className="text-gray-500 text-sm">Powered by Claude — personalized to your profile</p>
        </div>
      </div>

      {/* Profile context pill */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs px-3 py-1 rounded-full border border-[#3a3a3a] text-gray-400">
          Risk: <span className="text-white capitalize">{profile.riskTolerance || 'not set'}</span>
        </span>
        <span className="text-xs px-3 py-1 rounded-full border border-[#3a3a3a] text-gray-400">
          Surplus: <span className="text-white">${surplus}/mo</span>
        </span>
        <span className="text-xs px-3 py-1 rounded-full border border-[#3a3a3a] text-gray-400">
          Accounts: <span className="text-white">{(profile.accounts || []).length}</span>
        </span>
      </div>

      {/* Chat area */}
      <Card className="flex flex-col" style={{ minHeight: '480px' }}>
        {/* Messages */}
        <div className="flex-1 space-y-4 mb-4 overflow-y-auto pr-1" style={{ maxHeight: '400px' }}>
          {messages.length === 0 && (
            <div className="py-6">
              <p className="text-gray-500 text-sm mb-4 text-center">Suggested questions</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => ask(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-[#3a3a3a] text-gray-400 hover:border-primary-600 hover:text-primary-400 transition-colors text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">A</div>
              )}
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-primary-600 text-white rounded-tr-sm'
                    : 'text-gray-200 rounded-tl-sm'
                }`}
                style={m.role === 'assistant' ? { background: '#383838' } : {}}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">A</div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-gray-400 flex items-center gap-1" style={{ background: '#383838' }}>
                <span className="animate-pulse">●</span>
                <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</span>
                <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 border-t border-[#3a3a3a] pt-4">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && ask(input)}
            placeholder="Ask about a stock, ETF, strategy, or concept..."
            className="flex-1 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            style={{ background: '#2c2c2c', border: '1px solid #3a3a3a' }}
            disabled={loading}
            autoFocus
          />
          <button
            onClick={() => ask(input)}
            disabled={!input.trim() || loading}
            className="px-5 py-3 bg-primary-600 text-white rounded-xl font-medium text-sm hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Ask
          </button>
        </div>
      </Card>

      <p className="text-xs text-gray-500 text-center pb-4">
        Educational guidance only — not financial advice. Consult a licensed financial advisor before investing.
      </p>
    </main>
  );
}
