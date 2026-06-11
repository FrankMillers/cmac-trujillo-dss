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
}

const COLORS = {
  roe: '#6b8cff',
  mora: '#ff6b6b',
  sistema: '#ffd166',
  cartera: '#06d6a0',
}

export default function EvolucionChart({ data }: Props) {
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
        <p className="text-xs text-muted-foreground mt-0.5">Abr 2023 – Mar 2025 · ROE, Morosidad vs Sistema</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id="cartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.cartera} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.cartera} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
          <XAxis
            dataKey="mes"
            tick={{ fill: 'oklch(0.60 0.02 240)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={3}
          />
          <YAxis
            yAxisId="pct"
            tick={{ fill: 'oklch(0.60 0.02 240)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            yAxisId="mm"
            orientation="right"
            tick={{ fill: 'oklch(0.60 0.02 240)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}`}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: 'oklch(0.70 0.02 240)' }}
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
              backgroundColor: 'oklch(0.16 0.018 250)',
              border: '1px solid oklch(1 0 0 / 10%)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'oklch(0.96 0.005 240)',
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
