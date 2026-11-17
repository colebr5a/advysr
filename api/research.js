import { applyCors } from './_lib/cors.js';
import { requireUser } from './_lib/auth.js';
import { supabaseAdmin } from './_lib/supabaseAdmin.js';
import { monthlySurplus } from '../src/utils/calculations.js';

// Advysr is free; this cap bounds Anthropic API cost per user.
// Keep in sync with src/lib/usage.js (display only).
const AI_QUERIES_PER_MONTH = 50;
const MAX_QUESTION_CHARS = 1000;
const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_CHARS = 2000;

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  const msgs = history
    .slice(-MAX_HISTORY_MESSAGES)
    .map(m => ({
      role: m?.role === 'assistant' ? 'assistant' : 'user',
      // Clients have sent both {text} and {content}; accept either.
      content: String(m?.text ?? m?.content ?? '').slice(0, MAX_HISTORY_CHARS),
    }))
    .filter(m => m.content.trim());
  // The Messages API requires the conversation to start with a user turn.
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  return msgs;
}

function buildSystemPrompt(profile) {
  const p = profile || {};
  const surplus = Math.max(0, Math.round(monthlySurplus(p)));
  return `You are a friendly financial assistant inside Advysr — like a knowledgeable friend who happens to know a lot about money and investing. You know the user's profile:
- Risk tolerance: ${p.riskTolerance || 'not specified'}
- Monthly surplus: $${surplus}
- Accounts: ${(p.accounts || []).map(a => `${a.label} ($${a.balance})`).join(', ') || 'none listed'}
- Goals: ${(p.goals || []).map(g => g.label).join(', ') || 'none listed'}

Reply in 2–4 short sentences of plain conversational prose. No bullet points, no headers, no bold text, no markdown. Be direct and warm. Lead with the most useful thing to know. If there's more to say, end with a short follow-up question or invite them to dig deeper. You are not a registered investment adviser — speak in educational terms (e.g. "one approach is..." rather than "you should buy..."), and never state or imply a guaranteed return. The app already shows a persistent "not financial advice" disclaimer, so don't repeat it in your reply unless the user is about to make a specific, consequential decision (e.g. liquidating a retirement account) and genuinely needs the reminder.`;
}

export default async function handler(req, res) {
  if (applyCors(req, res, { methods: ['POST'] })) return;

  const user = await requireUser(req, res);
  if (!user) return;

  const { question, history = [] } = req.body || {};
  if (typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'No question provided' });
  }
  if (question.length > MAX_QUESTION_CHARS) {
    return res.status(400).json({ error: `Question must be under ${MAX_QUESTION_CHARS} characters` });
  }

  const db = supabaseAdmin();

  // Profile context comes from the database, not the client.
  const { data: row, error: rowErr } = await db
    .from('profiles')
    .select('profile_data')
    .eq('id', user.id)
    .maybeSingle();
  if (rowErr) return res.status(500).json({ error: 'Could not load profile' });

  const limit = AI_QUERIES_PER_MONTH;

  // Atomically reserve one query (row-locked increment in Postgres).
  const { data: quota, error: quotaErr } = await db.rpc('consume_ai_query', {
    p_user_id: user.id,
    p_limit: limit,
  });
  if (quotaErr) return res.status(500).json({ error: 'Could not check usage' });
  if (!quota.allowed) {
    return res.status(429).json({
      error: "You've reached this month's AI question limit. It resets on the 1st.",
      code: 'quota_exceeded',
      usage: { used: quota.used, limit },
    });
  }

  const refund = () => db.rpc('refund_ai_query', { p_user_id: user.id });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: buildSystemPrompt(row?.profile_data),
        messages: [...sanitizeHistory(history), { role: 'user', content: question.trim() }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      await refund();
      console.error('Anthropic error:', data.error?.message);
      return res.status(502).json({ error: 'The research assistant is unavailable. Try again.' });
    }
    res.status(200).json({
      answer: data.content?.[0]?.text ?? '',
      usage: { used: quota.used, limit },
    });
  } catch (err) {
    await refund();
    console.error('research handler error:', err);
    res.status(500).json({ error: 'The research assistant is unavailable. Try again.' });
  }
}
