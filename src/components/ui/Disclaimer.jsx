export function Disclaimer({ full = false, className = '' }) {
  if (!full) {
    return (
      <p className={`text-xs text-center pb-1 flex-shrink-0 ${className}`} style={{ color: '#C4CDC7' }}>
        Educational only · not financial advice
      </p>
    );
  }
  return (
    <p className={`text-xs leading-relaxed text-center px-4 ${className}`} style={{ color: '#9CA3AF' }}>
      Advysr is an educational tool, not a registered investment adviser, broker-dealer, or tax professional.
      Projections and estimates are hypothetical, based on historical averages, and are not a guarantee of future
      results. Nothing in this app is personalized financial, investment, tax, or legal advice — consult a licensed
      professional before making financial decisions.
    </p>
  );
}
