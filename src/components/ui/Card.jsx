export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl shadow-sm p-6 ${className}`} style={{ background: '#2c2c2c', border: '1px solid #3a3a3a' }}>
      {children}
    </div>
  );
}
