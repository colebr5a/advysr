// Advysr is free. The AI cap exists to bound Anthropic API cost per user, and is
// enforced server-side in api/research.js (consume_ai_query). This copy is for
// display only — keep it in sync with AI_QUERIES_PER_MONTH there.
export const AI_QUERIES_PER_MONTH = 50;

export function currentUsageMonth() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM, UTC — matches the server
}
