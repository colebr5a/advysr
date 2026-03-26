export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { question, context } = req.body;
  if (!question) return res.status(400).json({ error: 'No question provided' });

  const system = `You are an investment research assistant inside Advysr, a personal finance app.
The user has the following financial profile:
- Risk tolerance: ${context?.riskTolerance || 'not specified'}
- Monthly income: $${context?.monthlyIncome || 0}
- Monthly surplus available to invest: $${context?.surplus || 0}
- Accounts: ${(context?.accounts || []).map(a => `${a.label} ($${a.balance})`).join(', ') || 'none listed'}
- Goals: ${(context?.goals || []).map(g => g.label).join(', ') || 'none listed'}

Answer investment research questions in a clear, concise way. Tailor advice to the user's risk tolerance and financial situation above. Keep responses focused and under 300 words. Always end with a one-line reminder that this is educational only, not financial advice.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: question }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'API error' });
    res.status(200).json({ answer: data.content[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
