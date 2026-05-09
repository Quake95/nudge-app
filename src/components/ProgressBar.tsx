interface ProgressBarProps {
  progress: number
  color?: string
}

export default function ProgressBar({ progress, color = 'gold' }: ProgressBarProps) {
  const colorMap: Record<string, string> = {
    gold: 'bg-yellow-400',
    green: 'bg-emerald-400',
    rose: 'bg-rose-400',
    blue: 'bg-blue-400',
  }
  const bar = colorMap[color] || 'bg-yellow-400'

  return (
    <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
      <div
        className={`${bar} h-1.5 rounded-full transition-all duration-700`}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
