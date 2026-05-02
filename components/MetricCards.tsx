import type { Metrics } from '@/lib/types'
import { brl } from '@/lib/utils'

interface Props {
  metrics: Metrics
}

interface CardProps {
  label: string
  value: string | number
  colorClass?: string
}

function Card({ label, value, colorClass = 'text-gray-900' }: CardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </p>
      <p className={`text-2xl font-semibold ${colorClass}`}>{value}</p>
    </div>
  )
}

export default function MetricCards({ metrics }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card
        label="Investido pendente"
        value={brl(metrics.total_investido_pendente)}
        colorClass="text-amber-700"
      />
      <Card
        label="A receber (com lucro)"
        value={brl(metrics.total_a_receber)}
        colorClass="text-blue-700"
      />
      <Card
        label="Lucro recebido"
        value={brl(metrics.lucro_recebido)}
        colorClass="text-green-700"
      />
      <Card
        label="Cobranças atrasadas"
        value={metrics.qtd_atrasadas}
        colorClass={metrics.qtd_atrasadas > 0 ? 'text-red-600' : 'text-gray-900'}
      />
    </div>
  )
}
