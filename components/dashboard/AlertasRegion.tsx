'use client'

import { AlertaRegion } from '@/lib/queries'
import { Badge } from '@/components/ui/badge'
import { TrendingDown, TrendingUp } from 'lucide-react'

interface Props {
  data: AlertaRegion[]
}

const nivelColor: Record<string, string> = {
  Critico: 'bg-red-500/20 text-red-400 border-red-500/30',
  Alto: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Medio: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Bajo: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
}

const moraBarColor: Record<string, string> = {
  Critico: 'bg-red-500',
  Alto: 'bg-orange-500',
  Medio: 'bg-yellow-500',
  Bajo: 'bg-emerald-500',
}

export default function AlertasRegion({ data }: Props) {
  const maxMora = Math.max(...data.map((d) => d.morosidad_pct))

  return (
    <div className="bg-card rounded-xl p-5 kpi-card-glow-red">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">Mapa de Riesgo Regional</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Morosidad por región · Mar 2025 · Variación vs mes anterior</p>
      </div>
      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {data.map((r) => (
          <div key={r.id_region} className="flex items-center gap-3 group">
            <div className="w-28 shrink-0">
              <span className="text-xs font-medium text-foreground truncate block">{r.nombre}</span>
              <span className="text-xs text-muted-foreground">{r.agencias} agencias</span>
            </div>
            <div className="flex-1 relative h-6 flex items-center">
              <div
                className={`h-4 rounded-sm opacity-80 transition-all duration-500 ${moraBarColor[r.nivel_riesgo]}`}
                style={{ width: `${(r.morosidad_pct / maxMora) * 100}%` }}
              />
              <span className="absolute right-0 text-xs font-bold text-foreground">
                {r.morosidad_pct}%
              </span>
            </div>
            <div className="w-20 shrink-0 flex items-center justify-between gap-1">
              <Badge className={`text-xs px-1.5 py-0 border ${nivelColor[r.nivel_riesgo]}`}>
                {r.nivel_riesgo}
              </Badge>
              <div className={`flex items-center gap-0.5 text-xs ${r.variacion_mora_pp < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {r.variacion_mora_pp < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                {Math.abs(r.variacion_mora_pp).toFixed(1)}pp
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-border flex gap-4 text-xs text-muted-foreground">
        <span>
          <span className="font-semibold text-red-400">{data.filter((d) => d.nivel_riesgo === 'Critico').length}</span> Críticas
        </span>
        <span>
          <span className="font-semibold text-orange-400">{data.filter((d) => d.nivel_riesgo === 'Alto').length}</span> Altas
        </span>
        <span>
          <span className="font-semibold text-yellow-400">{data.filter((d) => d.nivel_riesgo === 'Medio').length}</span> Medias
        </span>
        <span>
          <span className="font-semibold text-emerald-400">{data.filter((d) => d.nivel_riesgo === 'Bajo').length}</span> Bajas
        </span>
      </div>
    </div>
  )
}
