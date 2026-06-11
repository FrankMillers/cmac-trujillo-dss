import { IndicadorMensual, AlertaRegion, CreditoSegmento } from '@/lib/queries'
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle, Zap } from 'lucide-react'

interface Props {
  indicadores: IndicadorMensual[]
  alertas: AlertaRegion[]
  creditos: CreditoSegmento[]
  currentLabel: string
  selectedRegionName?: string
}

interface Insight {
  tipo: 'critico' | 'alerta' | 'positivo' | 'info'
  titulo: string
  texto: string
}

const wholeNumber = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

function generarInsights(
  indicadores: IndicadorMensual[],
  alertas: AlertaRegion[],
  creditos: CreditoSegmento[]
): Insight[] {
  const actual = indicadores[indicadores.length - 1]
  const anterior = indicadores[indicadores.length - 2] ?? actual
  const insights: Insight[] = []

  // 1. Morosidad vs sistema
  const difMora = actual.morosidad_pct - actual.sistema_mora_pct
  if (difMora > 1) {
    insights.push({
      tipo: 'critico',
      titulo: 'Morosidad sobre el sistema',
      texto: `La tasa de morosidad de CMAC Trujillo (${actual.morosidad_pct.toFixed(1)}%) supera en ${difMora.toFixed(2)} pp al promedio del sistema financiero (${actual.sistema_mora_pct.toFixed(1)}%). Se recomienda revisar políticas de cobranza y admisión crediticia.`,
    })
  } else {
    insights.push({
      tipo: 'positivo',
      titulo: 'Morosidad controlada',
      texto: `La tasa de morosidad (${actual.morosidad_pct.toFixed(1)}%) se mantiene alineada al sistema financiero (${actual.sistema_mora_pct.toFixed(1)}%). La cartera muestra estabilidad crediticia.`,
    })
  }

  // 2. Regiones críticas
  const criticas = alertas.filter((a) => a.nivel_riesgo === 'Critico')
  if (criticas.length > 0) {
    const nombres = criticas.map((c) => `${c.nombre} (${c.morosidad_pct}%)`).join(' y ')
    insights.push({
      tipo: 'critico',
      titulo: `${criticas.length} región${criticas.length > 1 ? 'es' : ''} en nivel crítico`,
      texto: `${nombres} registran morosidad crítica superior al 13%. Se requiere intervención inmediata: auditoría de cartera, reestructuración preventiva y refuerzo del equipo de recuperaciones.`,
    })
  }

  // 3. Evolución de cartera
  const deltaCartera = actual.cartera_bruta_mm - anterior.cartera_bruta_mm
  const pctCartera = ((deltaCartera / anterior.cartera_bruta_mm) * 100).toFixed(1)
  const topSeg = [...creditos].sort((a, b) => b.cartera_mm - a.cartera_mm)[0]
  if (deltaCartera > 0) {
    insights.push({
      tipo: 'positivo',
      titulo: 'Expansión de cartera',
      texto: `La cartera bruta creció S/ ${deltaCartera.toFixed(0)}M (+${pctCartera}%) respecto al mes anterior, alcanzando S/ ${wholeNumber.format(actual.cartera_bruta_mm)}M. El segmento ${topSeg?.nombre ?? 'microempresa'} lidera con S/ ${wholeNumber.format(topSeg?.cartera_mm ?? 0)}M y ${wholeNumber.format(topSeg?.num_clientes ?? 0)} clientes.`,
    })
  } else {
    insights.push({
      tipo: 'alerta',
      titulo: 'Contracción de cartera',
      texto: `La cartera bruta disminuyó S/ ${Math.abs(deltaCartera).toFixed(0)}M (${pctCartera}%) respecto al mes anterior. Evaluar estrategias de colocación en segmentos de menor riesgo.`,
    })
  }

  // 4. Solvencia
  const exceso = actual.ratio_capital_global - 10
  if (exceso >= 5) {
    insights.push({
      tipo: 'positivo',
      titulo: 'Solvencia sólida',
      texto: `El Ratio de Capital Global de ${actual.ratio_capital_global.toFixed(2)}% supera en ${exceso.toFixed(2)} pp el mínimo regulatorio (10% SBS). La institución cuenta con holgura patrimonial para absorber pérdidas y expandir operaciones.`,
    })
  }

  // 5. ROE tendencia
  const deltaRoe = actual.roe_pct - anterior.roe_pct
  if (Math.abs(deltaRoe) > 0.1) {
    insights.push({
      tipo: deltaRoe > 0 ? 'positivo' : 'alerta',
      titulo: deltaRoe > 0 ? 'Rentabilidad en alza' : 'Presión sobre rentabilidad',
      texto: `El ROE ${deltaRoe > 0 ? 'mejoró' : 'cayó'} ${Math.abs(deltaRoe).toFixed(1)} pp respecto al mes anterior, situándose en ${actual.roe_pct.toFixed(1)}%. ${deltaRoe < 0 ? 'El incremento en provisiones por morosidad impacta el resultado neto.' : 'La mejora refleja mayor eficiencia operativa y crecimiento de cartera.'}`,
    })
  }

  return insights.slice(0, 4)
}

const tipoStyle = {
  critico: {
    border: 'border-red-500/40',
    bg: 'bg-red-500/10',
    icon: <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />,
    tag: 'text-red-400',
  },
  alerta: {
    border: 'border-orange-500/40',
    bg: 'bg-orange-500/10',
    icon: <TrendingDown className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />,
    tag: 'text-orange-400',
  },
  positivo: {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    icon: <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />,
    tag: 'text-emerald-400',
  },
  info: {
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/10',
    icon: <TrendingUp className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />,
    tag: 'text-blue-400',
  },
}

export default function InsightesNL({ indicadores, alertas, creditos, currentLabel, selectedRegionName }: Props) {
  const insights = generarInsights(indicadores, alertas, creditos)

  return (
    <div className="bg-card rounded-xl p-5 kpi-card-glow">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-primary" />
        <div>
          <h2 className="text-sm font-semibold text-foreground">Análisis en Lenguaje Natural</h2>
          <p className="text-xs text-muted-foreground">Generado automáticamente · Datos {currentLabel} · DSS CMAC Trujillo</p>
          {selectedRegionName ? (
            <p className="text-xs text-primary mt-0.5">Foco territorial activo: {selectedRegionName}</p>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {insights.map((ins, i) => {
          const s = tipoStyle[ins.tipo]
          return (
            <div key={i} className={`rounded-lg border ${s.border} ${s.bg} p-3 flex gap-2`}>
              {s.icon}
              <div className="min-w-0">
                <p className={`text-xs font-semibold mb-1 ${s.tag}`}>{ins.titulo}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{ins.texto}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
