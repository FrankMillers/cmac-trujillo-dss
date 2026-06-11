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

interface Props {
  data: CreditoSegmento[]
}

const PALETTE = ['#6b8cff', '#06d6a0', '#ffd166', '#ff6b6b', '#c77dff']

export default function CreditosChart({ data }: Props) {
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

  const tooltipStyle = {
    backgroundColor: 'oklch(0.16 0.018 250)',
    border: '1px solid oklch(1 0 0 / 10%)',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'oklch(0.96 0.005 240)',
  }

  return (
    <div className="bg-card rounded-xl p-5 kpi-card-glow">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">Cartera por Segmento Crediticio</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Distribución S/ millones · Mora % por segmento</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2">Saldo de Cartera (S/ M)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'oklch(0.60 0.02 240)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'oklch(0.60 0.02 240)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="Cartera (S/M)" radius={[4, 4, 0, 0]}>
                {barData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Perfil de Morosidad</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
              <PolarGrid stroke="oklch(1 0 0 / 10%)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'oklch(0.60 0.02 240)', fontSize: 10 }} />
              <Radar name="Mora %" dataKey="mora" stroke="#ff6b6b" fill="#ff6b6b" fillOpacity={0.25} />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {data.map((d, i) => (
          <div key={d.id_segmento} className="text-center">
            <div className="text-xs font-medium" style={{ color: PALETTE[i] }}>
              {d.nombre.split(' ')[0]}
            </div>
            <div className="text-sm font-bold text-foreground">{d.mora_pct}%</div>
            <div className="text-xs text-muted-foreground">{(d.num_clientes / 1000).toFixed(0)}k clientes</div>
          </div>
        ))}
      </div>
    </div>
  )
}
