export function Card({ children, className = '', style = {} }) {
  return (
    <div className={`rounded-2xl shadow-sm p-6 ${className}`} style={{ background: '#ffffff', border: '1px solid #e2e8f0', ...style }}>
      {children}
    </div>
  );
}
