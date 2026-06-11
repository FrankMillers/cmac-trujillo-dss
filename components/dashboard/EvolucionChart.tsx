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

export default function EvolucionChart({ data, rangeLabel }: Props) {
  const chartData = data.map((d) => ({
    mes: d.mes_anio,
    ROE: d.roe_pct,
    Morosidad: d.morosidad_pct,
    'Sistema mora': d.sistema_mora_pct,
    'Cartera (S/M)': d.cartera_bruta_mm,
  }))

  return (
    <div className="bg-card rounded-xl p-5 kpi-card-glow">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">Evolución de Indicadores Clave</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{rangeLabel} · ROE, Morosidad vs Sistema</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id="cartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.cartera} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.cartera} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="mes"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={3}
          />
          <YAxis
            yAxisId="pct"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            yAxisId="mm"
            orientation="right"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}`}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: 'var(--muted-foreground)' }}
          />
          <Area
            yAxisId="mm"
            type="monotone"
            dataKey="Cartera (S/M)"
            stroke={COLORS.cartera}
            fill="url(#cartGrad)"
            strokeWidth={2}
          />
          <Line yAxisId="pct" type="monotone" dataKey="ROE" stroke={COLORS.roe} strokeWidth={2} dot={false} />
          <Line yAxisId="pct" type="monotone" dataKey="Morosidad" stroke={COLORS.mora} strokeWidth={2} dot={false} />
          <Line yAxisId="pct" type="monotone" dataKey="Sistema mora" stroke={COLORS.sistema} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--foreground)',
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
