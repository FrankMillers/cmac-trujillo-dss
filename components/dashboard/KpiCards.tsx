'use client'

import { TrendingUp, TrendingDown, Shield, AlertTriangle, DollarSign, Landmark } from 'lucide-react'
import { KpiActual } from '@/lib/queries'

interface Props {
  kpis: KpiActual
}

interface KpiItem {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  glow: string
  trend: 'up' | 'down' | 'neutral'
}

export default function KpiCards({ kpis }: Props) {
  const items: KpiItem[] = [
    {
      label: 'ROE',
      value: `${kpis.roe_pct.toFixed(1)}%`,
      sub: 'Retorno sobre patrimonio',
      icon: <TrendingUp className="w-5 h-5" />,
      glow: 'kpi-card-glow-green',
      trend: 'up',
    },
    {
      label: 'ROA',
      value: `${kpis.roa_pct.toFixed(1)}%`,
      sub: 'Retorno sobre activos',
      icon: <DollarSign className="w-5 h-5" />,
      glow: 'kpi-card-glow-green',
      trend: 'up',
    },
    {
      label: 'Ratio Capital Global',
      value: `${kpis.ratio_capital_global.toFixed(2)}%`,
      sub: 'Requerimiento mín. 10%',
      icon: <Shield className="w-5 h-5" />,
      glow: 'kpi-card-glow',
      trend: 'neutral',
    },
    {
      label: 'Morosidad',
      value: `${kpis.morosidad_pct.toFixed(1)}%`,
      sub: 'Cartera en riesgo',
      icon: <AlertTriangle className="w-5 h-5" />,
      glow: 'kpi-card-glow-red',
      trend: 'down',
    },
    {
      label: 'Cobertura Provisiones',
      value: `${kpis.cobertura_provisiones.toFixed(1)}%`,
      sub: 'Provisiones / Cartera mora',
      icon: <Shield className="w-5 h-5" />,
      glow: 'kpi-card-glow-amber',
      trend: 'neutral',
    },
    {
      label: 'Cartera Bruta',
      value: `S/ ${kpis.cartera_bruta_mm.toLocaleString()}M`,
      sub: 'Saldo total créditos',
      icon: <Landmark className="w-5 h-5" />,
      glow: 'kpi-card-glow',
      trend: 'up',
    },
    {
      label: 'Patrimonio',
      value: `S/ ${kpis.patrimonio_mm.toFixed(1)}M`,
      sub: 'Capital regulatorio',
      icon: <Landmark className="w-5 h-5" />,
      glow: 'kpi-card-glow',
      trend: 'up',
    },
  ]

  const trendColor = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-blue-400',
  }

  const trendIcon = {
    up: <TrendingUp className="w-3 h-3" />,
    down: <TrendingDown className="w-3 h-3" />,
    neutral: null,
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`bg-card rounded-xl p-4 ${item.glow} flex flex-col gap-2 min-w-0`}
        >
          <div className={`${trendColor[item.trend]} flex items-center gap-1`}>
            {item.icon}
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground leading-none">{item.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
          </div>
          <div className={`flex items-center gap-1 text-xs ${trendColor[item.trend]}`}>
            {trendIcon[item.trend]}
            <span className="truncate">{item.sub}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
