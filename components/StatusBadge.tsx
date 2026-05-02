import type { Status } from '@/lib/types'

const CONFIG: Record<Status, { label: string; className: string }> = {
  retornado: {
    label: 'Retornado ✓',
    className: 'bg-green-50 text-green-700 border border-green-200',
  },
  pendente: {
    label: 'Pendente',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  atrasado: {
    label: 'Atrasado !',
    className: 'bg-red-50 text-red-700 border border-red-200',
  },
}

interface Props {
  status: Status
}

export default function StatusBadge({ status }: Props) {
  const { label, className } = CONFIG[status]
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
