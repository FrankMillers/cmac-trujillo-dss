'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MacroItem {
  label: string
  value: string | null
  unit: string
  trend?: 'up' | 'down' | 'flat'
}

export default function BcrpTicker() {
  const [items, setItems] = useState<MacroItem[]>([
    { label: 'Tasa Referencia BCRP', value: null, unit: '%' },
    { label: 'Inflación Acumulada', value: null, unit: '%' },
    { label: 'Tipo de Cambio S/', value: null, unit: 'USD' },
  ])

  useEffect(() => {
    async function fetchBcrp() {
      try {
        const res = await fetch('/api/bcrp')
        if (!res.ok) return
        const json = await res.json()
        setItems(json)
      } catch {
        // BCRP no disponible — muestra guiones
      }
    }
    fetchBcrp()
  }, [])

  const trendIcon = {
    up: <TrendingUp className="w-3 h-3" />,
    down: <TrendingDown className="w-3 h-3" />,
    flat: <Minus className="w-3 h-3" />,
  }
  const trendColor = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    flat: 'text-blue-400',
  }

  return (
    <div className="flex items-center gap-6 overflow-x-auto pb-0.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{item.label}</span>
          <span className="text-sm font-bold text-foreground">
            {item.value ?? '—'}{item.value ? ` ${item.unit}` : ''}
          </span>
          {item.trend && item.value && (
            <span className={`flex items-center ${trendColor[item.trend]}`}>
              {trendIcon[item.trend]}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
