'use client'

import { useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { TrendingUp, TrendingDown, Shield, AlertTriangle, DollarSign, Landmark, Minus } from 'lucide-react'
import { KpiActual } from '@/lib/queries'

interface Props {
  kpis: KpiActual
  prev?: KpiActual
  onSelectFocus?: (focus: string) => void
}

interface KpiItem {
  label: string
  value: string
  sub: string
  delta?: string
  deltaPos?: boolean
  icon: React.ReactNode
  surface: string
  iconWrap: string
  deltaWrap: string
  progress?: number   // 0-100 para barra inferior
  critical?: boolean  // pulso en delta negativo
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

const kpiFocusMap: Record<string, string> = {
  'ROE': 'rentabilidad',
  'ROA': 'rentabilidad',
  'Patrimonio': 'rentabilidad',
  'Cartera Bruta': 'rentabilidad',
  'Morosidad': 'riesgo',
  'Ratio Capital Global': 'riesgo',
  'Cobertura Provisiones': 'riesgo',
}

export default function KpiCards({ kpis, prev, onSelectFocus }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleSelectFocus = (newFocus: string) => {
    if (onSelectFocus) {
      onSelectFocus(newFocus)
      return
    }
    const params = new URLSearchParams(searchParams.toString())
    params.set('focus', newFocus)
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const items: KpiItem[] = [
    {
      label: 'ROE',
      value: `${kpis.roe_pct.toFixed(1)}%`,
      sub: 'Retorno sobre patrimonio',
      delta: fmt(kpis.roe_pct, prev?.roe_pct, 'pp'),
      deltaPos: prev ? kpis.roe_pct >= prev.roe_pct : undefined,
      icon: <TrendingUp className="w-5 h-5" />,
      surface: 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-950/40',
      iconWrap: 'bg-white/18 text-white',
      deltaWrap: 'bg-white/14 text-emerald-50',
      progress: Math.min(100, (kpis.roe_pct / 20) * 100),
    },
    {
      label: 'ROA',
      value: `${kpis.roa_pct.toFixed(1)}%`,
      sub: 'Retorno sobre activos',
      delta: fmt(kpis.roa_pct, prev?.roa_pct, 'pp'),
      deltaPos: prev ? kpis.roa_pct >= prev.roa_pct : undefined,
      icon: <DollarSign className="w-5 h-5" />,
      surface: 'bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg shadow-teal-950/40',
      iconWrap: 'bg-white/18 text-white',
      deltaWrap: 'bg-white/14 text-teal-50',
      progress: Math.min(100, (kpis.roa_pct / 3) * 100),
    },
    {
      label: 'Ratio Capital Global',
      value: `${kpis.ratio_capital_global.toFixed(2)}%`,
      sub: 'Requerimiento mín. 10%',
      delta: fmt(kpis.ratio_capital_global, prev?.ratio_capital_global, 'pp'),
      deltaPos: prev ? kpis.ratio_capital_global >= prev.ratio_capital_global : undefined,
      icon: <Shield className="w-5 h-5" />,
      surface: 'bg-gradient-to-br from-sky-600 to-sky-800 text-white shadow-lg shadow-sky-950/40',
      iconWrap: 'bg-white/18 text-white',
      deltaWrap: 'bg-white/14 text-sky-50',
      progress: Math.min(100, ((kpis.ratio_capital_global - 10) / 10) * 100),
    },
    {
      label: 'Morosidad',
      value: `${kpis.morosidad_pct.toFixed(1)}%`,
      sub: 'Cartera en riesgo',
      delta: fmt(kpis.morosidad_pct, prev?.morosidad_pct, 'pp', true),
      deltaPos: prev ? kpis.morosidad_pct <= prev.morosidad_pct : undefined,
      icon: <AlertTriangle className="w-5 h-5" />,
      surface: 'bg-gradient-to-br from-rose-600 to-rose-800 text-white shadow-lg shadow-rose-950/40',
      iconWrap: 'bg-white/18 text-white',
      deltaWrap: 'bg-white/14 text-rose-50',
      progress: Math.min(100, (kpis.morosidad_pct / 20) * 100),
      critical: prev ? kpis.morosidad_pct > prev.morosidad_pct : false,
    },
    {
      label: 'Cobertura Provisiones',
      value: `${kpis.cobertura_provisiones.toFixed(1)}%`,
      sub: 'Provisiones / Cartera mora',
      delta: fmt(kpis.cobertura_provisiones, prev?.cobertura_provisiones, 'pp'),
      deltaPos: prev ? kpis.cobertura_provisiones >= prev.cobertura_provisiones : undefined,
      icon: <Shield className="w-5 h-5" />,
      surface: 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-950/30',
      iconWrap: 'bg-slate-950/14 text-slate-950',
      deltaWrap: 'bg-slate-950/10 text-slate-900',
      progress: Math.min(100, (kpis.cobertura_provisiones / 200) * 100),
    },
    {
      label: 'Cartera Bruta',
      value: `S/ ${wholeNumber.format(kpis.cartera_bruta_mm)}M`,
      sub: 'Saldo total créditos',
      delta: prev ? `${kpis.cartera_bruta_mm >= prev.cartera_bruta_mm ? '+' : ''}${(kpis.cartera_bruta_mm - prev.cartera_bruta_mm).toFixed(0)}M` : undefined,
      deltaPos: prev ? kpis.cartera_bruta_mm >= prev.cartera_bruta_mm : undefined,
      icon: <Landmark className="w-5 h-5" />,
      surface: 'bg-gradient-to-br from-orange-400 to-orange-600 text-slate-950 shadow-lg shadow-orange-950/30',
      iconWrap: 'bg-slate-950/14 text-slate-950',
      deltaWrap: 'bg-slate-950/10 text-slate-900',
    },
    {
      label: 'Patrimonio',
      value: `S/ ${kpis.patrimonio_mm.toFixed(1)}M`,
      sub: 'Capital regulatorio',
      delta: prev ? `${kpis.patrimonio_mm >= prev.patrimonio_mm ? '+' : ''}${(kpis.patrimonio_mm - prev.patrimonio_mm).toFixed(1)}M` : undefined,
      deltaPos: prev ? kpis.patrimonio_mm >= prev.patrimonio_mm : undefined,
      icon: <Landmark className="w-5 h-5" />,
      surface: 'bg-gradient-to-br from-violet-600 to-violet-800 text-white shadow-lg shadow-violet-950/40',
      iconWrap: 'bg-white/18 text-white',
      deltaWrap: 'bg-white/14 text-violet-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {items.map((item, idx) => (
        <div
          key={item.label}
          className={`${item.surface} rounded-2xl p-4 flex flex-col gap-3 min-w-0 border border-white/10 kpi-card-interactive cursor-pointer animate-fade-in-up`}
          style={{ animationDelay: `${idx * 0.05}s` }}
          onClick={() => handleSelectFocus(kpiFocusMap[item.label] ?? 'rentabilidad')}
        >
          <div className="flex items-start justify-between gap-2">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconWrap} shrink-0`}>
              {item.icon}
            </div>
            {item.delta ? (
              <span
                className={`text-xs font-semibold shrink-0 flex items-center gap-1 rounded-full px-2 py-1 ${item.deltaWrap} ${
                  item.critical ? 'animate-pulse' : ''
                }`}
              >
                {item.deltaPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {item.delta}
              </span>
            ) : (
              <span className={`text-xs shrink-0 flex items-center gap-1 rounded-full px-2 py-1 ${item.deltaWrap}`}>
                <Minus className="w-3 h-3" />
              </span>
            )}
          </div>

          <div>
            <div className="text-3xl font-bold leading-none tracking-tight">{item.value}</div>
            <div className="text-xs mt-1.5 uppercase tracking-[0.14em] opacity-75 font-medium">{item.label}</div>
          </div>

          <div className="text-xs leading-relaxed opacity-80">{item.sub}</div>

          {/* Barra de progreso inferior */}
          {item.progress !== undefined && (
            <div className="mt-auto h-1 w-full rounded-full bg-black/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/50 transition-all duration-700"
                style={{ width: `${Math.max(4, item.progress)}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
