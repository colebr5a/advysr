export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { question, context, history = [] } = req.body;
  if (!question) return res.status(400).json({ error: 'No question provided' });

  const system = `You are a friendly financial assistant inside Advysr — like a knowledgeable friend who happens to know a lot about money and investing. You know the user's profile:
- Risk tolerance: ${context?.riskTolerance || 'not specified'}
- Monthly surplus: $${context?.surplus || 0}
- Accounts: ${(context?.accounts || []).map(a => `${a.label} ($${a.balance})`).join(', ') || 'none listed'}
- Goals: ${(context?.goals || []).map(g => g.label).join(', ') || 'none listed'}

Reply in 2–4 short sentences of plain conversational prose. No bullet points, no headers, no bold text, no markdown. Be direct and warm. Lead with the most useful thing to know. If there's more to say, end with a short follow-up question or invite them to dig deeper. Only add a brief disclaimer when recommending a specific investment action.`;

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
        system,
        messages: [
          ...history.map(m => ({ role: m.role, content: m.text })),
          { role: 'user', content: question },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'API error' });
    res.status(200).json({ answer: data.content[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
