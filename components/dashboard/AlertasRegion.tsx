'use client'

import { useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { AlertaRegion } from '@/lib/queries'
import { Badge } from '@/components/ui/badge'
import { TrendingDown, TrendingUp, MapPin } from 'lucide-react'

interface Props {
  data: AlertaRegion[]
  currentLabel: string
  selectedRegionId?: number
  onSelectRegion?: (regionId: number) => void
}

const nivelColor: Record<string, string> = {
  Critico: 'bg-red-500/20 text-red-400 border-red-500/30',
  Alto: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Medio: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Bajo: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
}

const moraBarColor: Record<string, string> = {
  Critico: 'bg-gradient-to-r from-red-600 to-red-400',
  Alto: 'bg-gradient-to-r from-orange-600 to-orange-400',
  Medio: 'bg-gradient-to-r from-yellow-600 to-yellow-400',
  Bajo: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
}

const summaryCount = (data: AlertaRegion[], nivel: string) =>
  data.filter((d) => d.nivel_riesgo === nivel).length

export default function AlertasRegion({ data, currentLabel, selectedRegionId, onSelectRegion }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleSelectRegion = (regionId: number) => {
    if (onSelectRegion) {
      onSelectRegion(regionId)
      return
    }
    const params = new URLSearchParams(searchParams.toString())
    params.set('region', String(regionId))
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const maxMora = Math.max(...data.map((d) => d.morosidad_pct))

  return (
    <div className="bg-card rounded-2xl p-5 floating-card h-full flex flex-col animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
      {/* Header */}
      <div className="mb-4 flex items-start gap-2">
        <MapPin className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
        <div>
          <h2 className="text-sm font-semibold text-foreground">Mapa de Riesgo Regional</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Morosidad por región · {currentLabel} · Variación vs mes anterior
          </p>
        </div>
      </div>

      {/* Lista de regiones */}
      <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[340px]">
        {data.map((r, idx) => (
          <div
            key={r.id_region}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-150 cursor-pointer animate-slide-in ${
              r.id_region === selectedRegionId
                ? 'bg-primary/10 ring-1 ring-primary/25 border-l-2 border-primary'
                : 'hover:bg-muted/40 border-l-2 border-transparent'
            }`}
            style={{ animationDelay: `${idx * 0.04}s` }}
            onClick={() => handleSelectRegion(r.id_region)}
          >
            {/* Nombre */}
            <div className="w-28 shrink-0">
              <span className="text-xs font-semibold text-foreground truncate block">{r.nombre}</span>
              <span className="text-xs text-muted-foreground">{r.agencias} ag.</span>
            </div>

            {/* Barra */}
            <div className="flex-1 relative h-5 flex items-center gap-2">
              <div className="flex-1 h-2.5 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${moraBarColor[r.nivel_riesgo]}`}
                  style={{ width: `${(r.morosidad_pct / maxMora) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-foreground shrink-0 w-8 text-right">
                {r.morosidad_pct}%
              </span>
            </div>

            {/* Badge + variación */}
            <div className="w-[5.5rem] shrink-0 flex items-center gap-1.5 justify-end">
              <Badge className={`text-[10px] px-1.5 py-0 border font-medium ${nivelColor[r.nivel_riesgo]}`}>
                {r.nivel_riesgo}
              </Badge>
              <div className={`flex items-center gap-0.5 text-xs font-medium ${r.variacion_mora_pp < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {r.variacion_mora_pp < 0
                  ? <TrendingDown className="w-3 h-3" />
                  : <TrendingUp className="w-3 h-3" />}
                <span>{Math.abs(r.variacion_mora_pp).toFixed(1)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Leyenda de resumen */}
      <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-4 gap-1 text-center">
        {[
          { nivel: 'Critico', color: 'text-red-400', label: 'Crít.' },
          { nivel: 'Alto', color: 'text-orange-400', label: 'Alto' },
          { nivel: 'Medio', color: 'text-yellow-400', label: 'Med.' },
          { nivel: 'Bajo', color: 'text-emerald-400', label: 'Bajo' },
        ].map(({ nivel, color, label }) => (
          <div key={nivel} className="flex flex-col items-center">
            <span className={`text-lg font-bold leading-none ${color}`}>{summaryCount(data, nivel)}</span>
            <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
