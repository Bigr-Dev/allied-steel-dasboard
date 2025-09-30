export function ProgressBar({ value, className = 'bg-primary', ...props }) {
  const clampedValue = Math.min(Math.max(value, 0), 100)

  return (
    <div
      className="w-full bg-muted rounded-full h-2 overflow-hidden"
      {...props}
    >
      <div
        className={`h-2 rounded-full transition-all duration-500 ease-out ${className}`}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  )
}
