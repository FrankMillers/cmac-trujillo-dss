'use client'

import { TrendingUp, TrendingDown, Shield, AlertTriangle, DollarSign, Landmark, Minus } from 'lucide-react'
import { KpiActual } from '@/lib/queries'

interface Props {
  kpis: KpiActual
  prev?: KpiActual
}

interface KpiItem {
  label: string
  value: string
  sub: string
  delta?: string
  deltaPos?: boolean
  icon: React.ReactNode
  glow: string
  trend: 'up' | 'down' | 'neutral'
}

const wholeNumber = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

function fmt(n: number, prev: number | undefined, suffix: string, higherIsBad = false): string | undefined {
  if (prev === undefined) return undefined
  const d = n - prev
  if (Math.abs(d) < 0.001) return undefined
  const sign = d > 0 ? '+' : ''
  return `${sign}${d.toFixed(2)}${suffix}`
}

export default function KpiCards({ kpis, prev }: Props) {
  const items: KpiItem[] = [
    {
      label: 'ROE',
      value: `${kpis.roe_pct.toFixed(1)}%`,
      sub: 'Retorno sobre patrimonio',
      delta: fmt(kpis.roe_pct, prev?.roe_pct, 'pp'),
      deltaPos: prev ? kpis.roe_pct >= prev.roe_pct : undefined,
      icon: <TrendingUp className="w-5 h-5" />,
      glow: 'kpi-card-glow-green',
      trend: 'up',
    },
    {
      label: 'ROA',
      value: `${kpis.roa_pct.toFixed(1)}%`,
      sub: 'Retorno sobre activos',
      delta: fmt(kpis.roa_pct, prev?.roa_pct, 'pp'),
      deltaPos: prev ? kpis.roa_pct >= prev.roa_pct : undefined,
      icon: <DollarSign className="w-5 h-5" />,
      glow: 'kpi-card-glow-green',
      trend: 'up',
    },
    {
      label: 'Ratio Capital Global',
      value: `${kpis.ratio_capital_global.toFixed(2)}%`,
      sub: 'Requerimiento mín. 10%',
      delta: fmt(kpis.ratio_capital_global, prev?.ratio_capital_global, 'pp'),
      deltaPos: prev ? kpis.ratio_capital_global >= prev.ratio_capital_global : undefined,
      icon: <Shield className="w-5 h-5" />,
      glow: 'kpi-card-glow',
      trend: 'neutral',
    },
    {
      label: 'Morosidad',
      value: `${kpis.morosidad_pct.toFixed(1)}%`,
      sub: 'Cartera en riesgo',
      delta: fmt(kpis.morosidad_pct, prev?.morosidad_pct, 'pp', true),
      deltaPos: prev ? kpis.morosidad_pct <= prev.morosidad_pct : undefined,
      icon: <AlertTriangle className="w-5 h-5" />,
      glow: 'kpi-card-glow-red',
      trend: 'down',
    },
    {
      label: 'Cobertura Provisiones',
      value: `${kpis.cobertura_provisiones.toFixed(1)}%`,
      sub: 'Provisiones / Cartera mora',
      delta: fmt(kpis.cobertura_provisiones, prev?.cobertura_provisiones, 'pp'),
      deltaPos: prev ? kpis.cobertura_provisiones >= prev.cobertura_provisiones : undefined,
      icon: <Shield className="w-5 h-5" />,
      glow: 'kpi-card-glow-amber',
      trend: 'neutral',
    },
    {
      label: 'Cartera Bruta',
      value: `S/ ${wholeNumber.format(kpis.cartera_bruta_mm)}M`,
      sub: 'Saldo total créditos',
      delta: prev ? `${kpis.cartera_bruta_mm >= prev.cartera_bruta_mm ? '+' : ''}${(kpis.cartera_bruta_mm - prev.cartera_bruta_mm).toFixed(0)}M` : undefined,
      deltaPos: prev ? kpis.cartera_bruta_mm >= prev.cartera_bruta_mm : undefined,
      icon: <Landmark className="w-5 h-5" />,
      glow: 'kpi-card-glow',
      trend: 'up',
    },
    {
      label: 'Patrimonio',
      value: `S/ ${kpis.patrimonio_mm.toFixed(1)}M`,
      sub: 'Capital regulatorio',
      delta: prev ? `${kpis.patrimonio_mm >= prev.patrimonio_mm ? '+' : ''}${(kpis.patrimonio_mm - prev.patrimonio_mm).toFixed(1)}M` : undefined,
      deltaPos: prev ? kpis.patrimonio_mm >= prev.patrimonio_mm : undefined,
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
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs text-muted-foreground truncate">{item.sub}</span>
            {item.delta && (
              <span className={`text-xs font-semibold shrink-0 flex items-center gap-0.5 ${item.deltaPos ? 'text-emerald-400' : 'text-red-400'}`}>
                {item.deltaPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {item.delta}
              </span>
            )}
            {!item.delta && (
              <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-0.5">
                <Minus className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
