'use client'

import { useEffect, useEffectEvent, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { RefreshCw, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface OptionItem {
  value: string
  label: string
}

interface Props {
  focusOptions: OptionItem[]
  generatedAt: string
  initialFocus: string
  initialMonth: string
  initialRegion: string
  monthOptions: OptionItem[]
  regionOptions: OptionItem[]
}

function formatElapsed(generatedAt: string): string {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(generatedAt).getTime()) / 1000))
  if (diffSeconds < 5) return 'justo ahora'
  if (diffSeconds < 60) return `hace ${diffSeconds}s`
  const minutes = Math.floor(diffSeconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `hace ${hours} h`
}

export default function DashboardRealtimeControls({
  focusOptions,
  generatedAt,
  initialFocus,
  initialMonth,
  initialRegion,
  monthOptions,
  regionOptions,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [month, setMonth] = useState(initialMonth)
  const [region, setRegion] = useState(initialRegion)
  const [focus, setFocus] = useState(initialFocus)
  const [relativeUpdate, setRelativeUpdate] = useState(() => formatElapsed(generatedAt))

  useEffect(() => {
    setMonth(initialMonth)
    setRegion(initialRegion)
    setFocus(initialFocus)
    setRelativeUpdate(formatElapsed(generatedAt))
  }, [generatedAt, initialFocus, initialMonth, initialRegion])

  const applyUrlChange = useEffectEvent((nextMonth: string, nextRegion: string, nextFocus: string) => {
    const params = new URLSearchParams()
    params.set('month', nextMonth)
    params.set('region', nextRegion)
    params.set('focus', nextFocus)

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  })

  const refreshData = useEffectEvent(() => {
    startTransition(() => {
      router.refresh()
    })
  })

  useEffect(() => {
    const clock = window.setInterval(() => {
      setRelativeUpdate(formatElapsed(generatedAt))
    }, 1000)

    return () => window.clearInterval(clock)
  }, [generatedAt])

  useEffect(() => {
    if (!autoRefresh) return

    const timer = window.setInterval(() => {
      refreshData()
    }, 30000)

    return () => window.clearInterval(timer)
  }, [autoRefresh, refreshData])

  return (
    <div className="rounded-2xl border border-border bg-card p-6 kpi-card-glow">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Filtros y cambio en tiempo real</h2>
          <p className="text-xs text-muted-foreground">
            Los cambios se aplican al instante y el tablero se refresca automaticamente.
          </p>
        </div>
        <a
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
          href={pathname}
        >
          Reiniciar
        </a>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <Radio className="size-3" />
          {autoRefresh ? 'Tiempo real activo' : 'Tiempo real pausado'}
        </Badge>
        <Badge variant="outline">Actualizado {relativeUpdate}</Badge>
      </div>

      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Mes de cierre</span>
          <select
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0"
            onChange={(event) => {
              const value = event.target.value
              setMonth(value)
              applyUrlChange(value, region, focus)
            }}
            value={month}
          >
            {monthOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Region priorizada</span>
          <select
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0"
            onChange={(event) => {
              const value = event.target.value
              setRegion(value)
              applyUrlChange(month, value, focus)
            }}
            value={region}
          >
            {regionOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Enfoque de decision</span>
          <select
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0"
            onChange={(event) => {
              const value = event.target.value
              setFocus(value)
              applyUrlChange(month, region, value)
            }}
            value={focus}
          >
            {focusOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button
          onClick={() => refreshData()}
          size="sm"
          type="button"
          variant="outline"
        >
          <RefreshCw className={`size-3.5 ${isPending ? 'animate-spin' : ''}`} />
          Actualizar ahora
        </Button>
        <Button
          onClick={() => setAutoRefresh((value) => !value)}
          size="sm"
          type="button"
          variant={autoRefresh ? 'secondary' : 'outline'}
        >
          {autoRefresh ? 'Pausar auto-refresh' : 'Activar auto-refresh'}
        </Button>
        <span className="text-xs text-muted-foreground">
          Frecuencia automatica: 30 segundos.
        </span>
      </div>
    </div>
  )
}
