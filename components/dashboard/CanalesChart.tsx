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

interface Props {
  data: TransaccionCanal[]
}

// Paleta CMAC Trujillo
const PALETTE = ['#f47920', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']

export default function CanalesChart({ data }: Props) {
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

  const tooltipStyle = {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'var(--foreground)',
  }

  return (
    <div className="bg-card rounded-xl p-5 kpi-card-glow">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">Adopción Digital por Canal</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Transacciones (miles) y montos · Mar 2025 · Total: {total.toFixed(0)}k transacciones
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2">Participación en Transacciones</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Monto Movilizado (S/ M)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} tickLine={false} axisLine={false} width={56} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="monto" radius={[0, 4, 4, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
                <LabelList dataKey="monto" position="right" style={{ fill: 'var(--muted-foreground)', fontSize: 10 }} formatter={(v: unknown) => `${Number(v).toFixed(0)}`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {data.map((d, i) => (
          <div key={d.id_canal} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PALETTE[i] }} />
            <span className="text-xs text-muted-foreground">{d.nombre}</span>
            <span className="text-xs font-medium text-foreground">{((d.num_transacciones_miles / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
