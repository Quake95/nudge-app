interface SectionHeaderProps {
  title: string
  subtitle?: string
  accent?: string
}

export default function SectionHeader({ title, subtitle, accent = 'gold' }: SectionHeaderProps) {
  const accentMap: Record<string, string> = {
    gold: 'text-yellow-500',
    green: 'text-emerald-500',
    rose: 'text-rose-400',
    blue: 'text-blue-500',
  }
  const dividerMap: Record<string, string> = {
    gold: 'bg-yellow-300',
    green: 'bg-emerald-300',
    rose: 'bg-rose-300',
    blue: 'bg-blue-300',
  }
  const accentColor = accentMap[accent] || 'text-yellow-500'
  const dividerColor = dividerMap[accent] || 'bg-yellow-300'

  return (
    <div className="mb-10">
      {subtitle && (
        <div className={`text-xs font-semibold tracking-widest uppercase ${accentColor} mb-2`}>
          {subtitle}
        </div>
      )}
      <h2 className="font-serif text-3xl md:text-4xl font-medium text-stone-800">
        {title}
      </h2>
      <div className={`mt-3 h-px w-16 ${dividerColor}`} />
    </div>
  )
}
