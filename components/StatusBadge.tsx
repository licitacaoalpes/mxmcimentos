import type { Status } from '@/lib/types'

const CONFIG: Record<Status, { label: string; bgColor: string; borderColor: string; dotColor: string; textVar: string }> = {
  retornado: {
    label: 'Retornado',
    bgColor: 'rgba(16,185,129,0.1)',
    borderColor: 'rgba(16,185,129,0.2)',
    dotColor: '#10B981',
    textVar: 'var(--c-green-text)',
  },
  pendente: {
    label: 'Pendente',
    bgColor: 'rgba(245,158,11,0.1)',
    borderColor: 'rgba(245,158,11,0.2)',
    dotColor: '#F59E0B',
    textVar: 'var(--c-amber-text)',
  },
  atrasado: {
    label: 'Atrasado',
    bgColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.2)',
    dotColor: '#EF4444',
    textVar: 'var(--c-red-text)',
  },
}

interface Props {
  status: Status
}

export default function StatusBadge({ status }: Props) {
  const { label, bgColor, borderColor, dotColor, textVar } = CONFIG[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: bgColor, border: `1px solid ${borderColor}`, color: textVar }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}80` }}
      />
      {label}
    </span>
  )
}
