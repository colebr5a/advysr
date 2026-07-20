export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl shadow-sm p-6 ${className}`} style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
      {children}
    </div>
  );
}
