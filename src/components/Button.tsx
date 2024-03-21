export default function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`inline-flex justify-center items-center gap-1 rounded-md border px-4 py-2 font-bold ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
