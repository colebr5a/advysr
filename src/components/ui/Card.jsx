export function Card({ children, className = '', style = {} }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E6E9E6',
        padding: '20px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
