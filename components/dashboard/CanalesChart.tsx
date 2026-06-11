'use client'

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  LabelList,
} from 'recharts'
import { TransaccionCanal } from '@/lib/queries'
import { Wifi } from 'lucide-react'

interface Props {
  data: TransaccionCanal[]
  currentLabel: string
}

// Paleta CMAC Trujillo
const PALETTE = ['#f47920', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm shadow-xl p-3 text-xs min-w-[150px]">
      <p className="font-semibold text-foreground mb-1">{d.name}</p>
      <p className="text-muted-foreground">
        {d.dataKey === 'value'
          ? `${d.value.toFixed(1)}k transacciones`
          : `S/ ${Number(d.value).toFixed(0)}M`}
      </p>
    </div>
  )
}

export default function CanalesChart({ data, currentLabel }: Props) {
  const pieData = data.map((d, i) => ({
    name: d.nombre,
    value: d.num_transacciones_miles,
    color: PALETTE[i],
  }))

  const barData = data.map((d, i) => ({
    name: d.nombre.split(' ')[0],
    monto: d.monto_total_mm,
    color: PALETTE[i],
  }))

  const total = data.reduce((s, d) => s + d.num_transacciones_miles, 0)

  return (
    <div className="bg-card rounded-2xl p-5 floating-card animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
      <div className="mb-5 flex items-start gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 shrink-0">
          <Wifi className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Adopción Digital por Canal</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Transacciones (miles) y montos · {currentLabel} · Total: {total.toFixed(0)}k transacciones
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">Participación en Transacciones</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">Monto Movilizado (S/ M)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} strokeOpacity={0.5} />
              <XAxis
                type="number"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'Inter' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'Inter' }}
                tickLine={false}
                axisLine={false}
                width={56}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="monto" radius={[0, 6, 6, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="monto"
                  position="right"
                  style={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'Inter' }}
                  formatter={(v: unknown) => `${Number(v).toFixed(0)}`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leyenda mejorada */}
      <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap gap-3">
        {data.map((d, i) => (
          <div key={d.id_canal} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PALETTE[i] }} />
            <span className="text-xs text-muted-foreground">{d.nombre}</span>
            <span className="text-xs font-semibold text-foreground">
              {((d.num_transacciones_miles / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
