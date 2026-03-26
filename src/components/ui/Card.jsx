export function Card({ children, className = '' }) {
  return (
    <div className={`bg-[#242424] rounded-2xl shadow-sm border border-[#333] p-6 ${className}`}>
      {children}
    </div>
  );
}
