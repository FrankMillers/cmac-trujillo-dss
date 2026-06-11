'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts'
import { CreditoSegmento } from '@/lib/queries'
import { PieChart } from 'lucide-react'

interface Props {
  data: CreditoSegmento[]
  currentLabel: string
}

// Paleta CMAC Trujillo
const PALETTE = ['#f47920', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltipBar({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm shadow-xl p-3 text-xs min-w-[150px]">
      <p className="font-semibold text-foreground mb-1.5 border-b border-border pb-1">{label}</p>
      {payload.map((entry: { name: string; color: string; value: number }) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-semibold text-foreground">S/ {entry.value.toFixed(0)}M</span>
        </div>
      ))}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltipRadar({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm shadow-xl p-3 text-xs">
      <p className="font-semibold text-foreground mb-1">{d.payload?.subject}</p>
      <p className="text-muted-foreground">Mora: <span className="font-bold text-red-400">{d.value?.toFixed(1)}%</span></p>
    </div>
  )
}

export default function CreditosChart({ data, currentLabel }: Props) {
  const barData = data.map((d, i) => ({
    name: d.nombre.split(' ')[0],
    'Cartera (S/M)': d.cartera_mm,
    'Mora %': d.mora_pct,
    color: PALETTE[i],
  }))

  const radarData = data.map((d) => ({
    subject: d.nombre.split(' ')[0],
    mora: d.mora_pct,
    fullMark: 20,
  }))

  return (
    <div className="bg-card rounded-2xl p-5 floating-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <div className="mb-5 flex items-start gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 shrink-0">
          <PieChart className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Cartera por Segmento Crediticio</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Distribución S/ millones · Mora % por segmento · {currentLabel}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">Saldo de Cartera (S/ M)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} strokeOpacity={0.5} />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'Inter' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'Inter' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltipBar />} />
              <Bar dataKey="Cartera (S/M)" radius={[5, 5, 0, 0]}>
                {barData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">Perfil de Morosidad</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
              <PolarGrid stroke="var(--border)" strokeOpacity={0.6} />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'Inter' }}
              />
              <Radar name="Mora %" dataKey="mora" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip content={<CustomTooltipRadar />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resumen por segmento */}
      <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-5 gap-2">
        {data.map((d, i) => (
          <div key={d.id_segmento} className="text-center">
            <div className="text-xs font-semibold mb-1" style={{ color: PALETTE[i] }}>
              {d.nombre.split(' ')[0]}
            </div>
            <div className="text-sm font-bold text-foreground">{d.mora_pct}%</div>
            <div className="text-[10px] text-muted-foreground">{(d.num_clientes / 1000).toFixed(0)}k</div>
          </div>
        ))}
      </div>
    </div>
  )
}
