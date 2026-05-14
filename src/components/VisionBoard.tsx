import { VisionItem } from './types'

interface VisionBoardProps {
  items: VisionItem[]
}

const colorMap: Record<string, string> = {
  gold: 'bg-amber-50 border-amber-200',
  green: 'bg-emerald-50 border-emerald-200',
  sage: 'bg-lime-50 border-lime-200',
  blue: 'bg-sky-50 border-sky-200',
  rose: 'bg-rose-50 border-rose-200',
  purple: 'bg-violet-50 border-violet-200',
}

export default function VisionBoard({ items }: VisionBoardProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className={`rounded-2xl border p-5 flex flex-col gap-2 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-default ${colorMap[item.color] || 'bg-stone-50 border-stone-200'}`}
        >
          <span className="text-3xl">{item.emoji}</span>
          <h4 className="font-serif text-sm font-medium text-stone-800">{item.title}</h4>
          <p className="text-xs text-stone-500 leading-relaxed">{item.description}</p>
        </div>
      ))}
    </div>
  )
}
