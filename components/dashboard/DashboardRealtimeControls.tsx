'use client'

import { useEffect, useEffectEvent, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { RefreshCw, ChevronDown } from 'lucide-react'
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

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: OptionItem[]
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground tracking-wide">{label}</span>
      <div className="relative">
        <select
          className="select-styled w-full rounded-xl border border-border px-3 py-2.5 text-sm text-foreground"
          onChange={(e) => onChange(e.target.value)}
          value={value}
        >
          {options.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" aria-hidden />
      </div>
    </label>
  )
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
    <div className="rounded-2xl bg-card p-6 floating-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Filtros y tiempo real</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Los cambios se aplican al instante.
          </p>
        </div>
        <a
          className="text-xs font-medium text-primary underline-offset-4 hover:underline transition-opacity hover:opacity-80 shrink-0 mt-0.5"
          href={pathname}
        >
          Reiniciar
        </a>
      </div>

      {/* Status badges */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1.5 pl-2">
          <span className="live-dot" />
          {autoRefresh ? 'En vivo' : 'Pausado'}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {relativeUpdate}
        </Badge>
        {isPending && (
          <Badge variant="outline" className="text-xs text-primary gap-1">
            <RefreshCw className="size-2.5 animate-spin" />
            Cargando
          </Badge>
        )}
      </div>

      {/* Selects estilizados */}
      <div className="mt-4 space-y-3">
        <SelectField
          label="Mes de cierre"
          value={month}
          options={monthOptions}
          onChange={(v) => { setMonth(v); applyUrlChange(v, region, focus) }}
        />
        <SelectField
          label="Región priorizada"
          value={region}
          options={regionOptions}
          onChange={(v) => { setRegion(v); applyUrlChange(month, v, focus) }}
        />
        <SelectField
          label="Enfoque de decisión"
          value={focus}
          options={focusOptions}
          onChange={(v) => { setFocus(v); applyUrlChange(month, region, v) }}
        />
      </div>

      {/* Botones */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button
          onClick={() => refreshData()}
          size="sm"
          type="button"
          variant="outline"
          className="gap-1.5 transition-all hover:border-primary/50 hover:text-primary"
        >
          <RefreshCw className={`size-3.5 ${isPending ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
        <Button
          onClick={() => setAutoRefresh((v) => !v)}
          size="sm"
          type="button"
          variant={autoRefresh ? 'secondary' : 'outline'}
          className="transition-all"
        >
          {autoRefresh ? 'Pausar' : 'Activar'} auto-refresh
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground/60">Frecuencia: 30 s</p>
    </div>
  )
}
