'use client'

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { IndicadorMensual } from '@/lib/queries'
import { TrendingUp } from 'lucide-react'

interface Props {
  data: IndicadorMensual[]
  rangeLabel: string
}

// Paleta CMAC Trujillo
const COLORS = {
  cartera: '#f47920',  // naranja corporativo CMAC
  roe:     '#3b82f6',  // azul
  mora:    '#ef4444',  // rojo (indicador negativo)
  sistema: '#f59e0b',  // ámbar (referencia sistema)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm shadow-xl p-3 text-xs min-w-[160px]">
      <p className="font-semibold text-foreground mb-2 border-b border-border pb-1.5">{label}</p>
      {payload.map((entry: { name: string; color: string; value: number; unit?: string }) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-semibold text-foreground">
            {entry.name === 'Cartera (S/M)'
              ? `S/ ${entry.value.toFixed(0)}M`
              : `${entry.value.toFixed(1)}%`}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function EvolucionChart({ data, rangeLabel }: Props) {
  const chartData = data.map((d) => ({
    mes: d.mes_anio,
    ROE: d.roe_pct,
    Morosidad: d.morosidad_pct,
    'Sistema mora': d.sistema_mora_pct,
    'Cartera (S/M)': d.cartera_bruta_mm,
  }))

  return (
    <div className="bg-card rounded-2xl p-5 floating-card h-full animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <div className="mb-5 flex items-start gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 shrink-0">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Evolución de Indicadores Clave</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{rangeLabel} · ROE, Morosidad vs Sistema, Cartera</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id="cartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLORS.cartera} stopOpacity={0.25} />
              <stop offset="95%" stopColor={COLORS.cartera} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
          <XAxis
            dataKey="mes"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'Inter' }}
            tickLine={false}
            axisLine={false}
            interval={3}
          />
          <YAxis
            yAxisId="pct"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'Inter' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            yAxisId="mm"
            orientation="right"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'Inter' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}`}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'Inter' }}
          />
          <Area
            yAxisId="mm"
            type="monotone"
            dataKey="Cartera (S/M)"
            stroke={COLORS.cartera}
            fill="url(#cartGrad)"
            strokeWidth={2.5}
          />
          <Line yAxisId="pct" type="monotone" dataKey="ROE" stroke={COLORS.roe} strokeWidth={2} dot={false} />
          <Line yAxisId="pct" type="monotone" dataKey="Morosidad" stroke={COLORS.mora} strokeWidth={2} dot={false} />
          <Line yAxisId="pct" type="monotone" dataKey="Sistema mora" stroke={COLORS.sistema} strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
          <Tooltip content={<CustomTooltip />} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
