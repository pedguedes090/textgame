interface StatBarProps {
  label: string
  value: number
  maxValue: number
  color?: 'cyan' | 'green' | 'yellow' | 'red'
  showPercentage?: boolean
}

export default function StatBar({
  label,
  value,
  maxValue,
  color = 'cyan',
  showPercentage = true,
}: StatBarProps) {
  const percentage = Math.min((value / maxValue) * 100, 100)

  const colorClasses = {
    cyan: 'bg-cyan-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="font-bold">
          {value}
          {showPercentage && ` / ${maxValue}`}
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`${colorClasses[color]} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
