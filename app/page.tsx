import { connection } from 'next/server'
import {
  getIndicadoresMensuales,
  getCreditosSnapshots,
  getCreditosPorSegmento,
  getTransaccionesPorCanal,
  getAlertasRegion,
  getAlertasRegionBase,
  getKpisActuales,
  type AlertaRegion,
  type CreditoSegmento,
  type IndicadorMensual,
  type TransaccionCanal,
} from '@/lib/queries'
import { simulateAlertasRegion, simulateCreditosPorSegmento } from '@/lib/simulation'
import KpiCards from '@/components/dashboard/KpiCards'
import EvolucionChart from '@/components/dashboard/EvolucionChart'
import CreditosChart from '@/components/dashboard/CreditosChart'
import CanalesChart from '@/components/dashboard/CanalesChart'
import AlertasRegion from '@/components/dashboard/AlertasRegion'
import BcrpTicker from '@/components/dashboard/BcrpTicker'
import InsightesNL from '@/components/dashboard/InsightesNL'
import DashboardRealtimeControls from '@/components/dashboard/DashboardRealtimeControls'
import ThemeToggle from '@/components/ThemeToggle'
import CmacLogo from '@/components/CmacLogo'
import { Badge } from '@/components/ui/badge'

type DashboardSearchParams = Promise<Record<string, string | string[] | undefined>>

const focusLabels = {
  rentabilidad: 'Rentabilidad',
  riesgo: 'Riesgo',
  digital: 'Transformación digital',
} as const

type FocusKey = keyof typeof focusLabels

function readParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function readIntegerParam(value: string | string[] | undefined): number | undefined {
  const raw = readParam(value)
  if (!raw) return undefined
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

function isDigitalChannel(canal: TransaccionCanal): boolean {
  const tipo = canal.tipo.toLowerCase()
  const nombre = canal.nombre.toLowerCase()
  if (tipo.includes('presencial')) return false
  return (
    tipo.includes('digital') ||
    tipo.includes('virtual') ||
    nombre.includes('app') ||
    nombre.includes('web') ||
    nombre.includes('banca')
  )
}

function buildFocusRecommendation(
  focus: FocusKey,
  indicadorActual: IndicadorMensual,
  regionFoco: AlertaRegion,
  digitalShare: number
) {
  switch (focus) {
    case 'riesgo':
      return {
        title: 'Control de mora',
        text: `Con morosidad de ${indicadorActual.morosidad_pct.toFixed(1)}% y foco en ${regionFoco.nombre} (${regionFoco.morosidad_pct.toFixed(1)}%), reforzar admisión y recuperación antes de acelerar nuevas colocaciones.`,
      }
    case 'digital':
      return {
        title: 'Migración a canales remotos',
        text: `Participación digital estimada en ${digitalShare.toFixed(1)}% del total transaccional. Profundizar onboarding y campañas de autoservicio para reducir costo operativo.`,
      }
    default:
      return {
        title: 'Crecimiento rentable',
        text: `La cartera y el ROE deben crecer en paralelo sin romper el límite de riesgo. Asignar crecimiento al segmento y región con mejor equilibrio entre margen y mora.`,
      }
  }
}

const focusIcon: Record<FocusKey, string> = {
  rentabilidad: '📈',
  riesgo: '🛡️',
  digital: '📱',
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: DashboardSearchParams
}) {
  await connection()

  const params = await searchParams
  const [indicadores, creditosSnapshots, alertasBase] = await Promise.all([
    getIndicadoresMensuales(),
    getCreditosSnapshots(),
    getAlertasRegionBase(),
  ])

  if (indicadores.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8 text-foreground flex items-center justify-center">
        <p className="text-muted-foreground">Sin datos disponibles.</p>
      </div>
    )
  }

  const requestedMonth  = readIntegerParam(params.month)
  const requestedRegion = readIntegerParam(params.region)
  const requestedFocus  = readParam(params.focus)

  const selectedFocus: FocusKey =
    requestedFocus === 'riesgo' || requestedFocus === 'digital' || requestedFocus === 'rentabilidad'
      ? requestedFocus
      : 'rentabilidad'

  const monthOptions    = indicadores
  const selectedMonth   = monthOptions.find((i) => i.id_tiempo === requestedMonth) ?? monthOptions[monthOptions.length - 1]
  const selectedIndex   = monthOptions.findIndex((i) => i.id_tiempo === selectedMonth.id_tiempo)
  const previousIndicator = monthOptions[Math.max(selectedIndex - 1, 0)]
  const rangeLabel      = `${monthOptions[0].mes_anio} – ${selectedMonth.mes_anio}`

  const [creditosRaw, canales, alertasRaw, kpis, kpisPrev] = await Promise.all([
    getCreditosPorSegmento(selectedMonth.id_tiempo),
    getTransaccionesPorCanal(selectedMonth.id_tiempo),
    getAlertasRegion(selectedMonth.id_tiempo),
    getKpisActuales(selectedMonth.id_tiempo),
    getKpisActuales(previousIndicator.id_tiempo),
  ])

  const creditos = simulateCreditosPorSegmento(creditosRaw, creditosSnapshots, selectedMonth.id_tiempo)
  const alertas  = simulateAlertasRegion(alertasRaw, alertasBase, indicadores, selectedMonth.id_tiempo)

  const usesSimulatedCreditos = creditosRaw.length === 0
  const usesSimulatedAlertas  = alertasRaw.length === 0

  if (creditos.length === 0 || canales.length === 0 || alertas.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8 text-foreground flex items-center justify-center">
        <p className="text-muted-foreground">Sin detalle analítico para {selectedMonth.mes_anio}.</p>
      </div>
    )
  }

  const selectedRegion = alertas.find((i) => i.id_region === requestedRegion) ?? alertas[0]

  const totalTransacciones   = canales.reduce((s, c) => s + c.num_transacciones_miles, 0)
  const digitalTransactions  = canales.filter(isDigitalChannel).reduce((s, c) => s + c.num_transacciones_miles, 0)
  const digitalShare         = totalTransacciones === 0 ? 0 : (digitalTransactions / totalTransacciones) * 100
  const topSegment           = [...creditos].sort((a, b) => b.cartera_mm - a.cartera_mm)[0]
  const worstSegment         = [...creditos].sort((a, b) => b.mora_pct - a.mora_pct)[0]
  const brechaMora           = selectedMonth.morosidad_pct - selectedMonth.sistema_mora_pct

  const focusRecommendation = buildFocusRecommendation(selectedFocus, selectedMonth, selectedRegion, digitalShare)

  const simulationNote = usesSimulatedCreditos || usesSimulatedAlertas
    ? [
        usesSimulatedCreditos ? 'créditos simulados' : null,
        usesSimulatedAlertas  ? 'alertas simuladas'  : null,
      ].filter(Boolean).join(' · ')
    : null

  const generatedAt = new Date().toISOString()

  return (
    <div className="min-h-screen bg-background">

      {/* ══════ HEADER ══════ */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-3">

          <div className="flex items-center gap-3 shrink-0">
            <CmacLogo size={36} />
            <div>
              <h1 className="text-sm font-bold leading-none text-foreground tracking-tight">CMAC Trujillo S.A.</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tablero ejecutivo · Corte <span className="font-semibold text-primary">{selectedMonth.mes_anio}</span>
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 flex-1 justify-center">
            <div className="h-4 w-px bg-border" />
            <BcrpTicker />
            <div className="h-4 w-px bg-border" />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {simulationNote && (
              <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30 hidden sm:flex">
                ⚠ {simulationNote}
              </Badge>
            )}
            <Badge variant="secondary" className="hidden sm:flex gap-1.5 pl-2 text-xs">
              <span className="live-dot" />
              En vivo
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-5 px-6 py-5">

        {/* ══════ FILA 1+2: KPIs + MINI-KPIS (izq) y CONTROLES (der) ══════ */}
        <section className="grid gap-5 xl:grid-cols-[1fr_300px] items-start">
          {/* Columna izquierda: KPIs + contexto */}
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Indicadores clave · {selectedMonth.mes_anio}
                <span className="normal-case font-normal ml-1 opacity-60">vs {previousIndicator.mes_anio}</span>
              </p>
              <KpiCards kpis={kpis} prev={kpisPrev} />
            </div>

            {/* Mini KPIs de contexto */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              {[
                {
                  icon: '⚡',
                  label: 'Brecha de mora vs sistema',
                  value: `${brechaMora > 0 ? '+' : ''}${brechaMora.toFixed(2)} pp`,
                  sub: `CMAC ${selectedMonth.morosidad_pct.toFixed(1)}% · Sistema ${selectedMonth.sistema_mora_pct.toFixed(1)}%`,
                  valueColor: brechaMora > 0 ? 'text-red-400' : 'text-emerald-400',
                },
                {
                  icon: '🏆',
                  label: 'Segmento líder en cartera',
                  value: `${topSegment.nombre.split(' ')[0]} · S/ ${topSegment.cartera_mm.toFixed(0)}M`,
                  sub: `${topSegment.num_clientes.toLocaleString()} clientes · mora ${topSegment.mora_pct.toFixed(1)}%`,
                  valueColor: 'text-orange-400',
                },
                {
                  icon: '⚠️',
                  label: 'Segmento más riesgoso',
                  value: `${worstSegment.nombre.split(' ')[0]} · ${worstSegment.mora_pct.toFixed(1)}%`,
                  sub: 'Mora más alta del portafolio',
                  valueColor: 'text-rose-400',
                },
                {
                  icon: '📲',
                  label: 'Adopción digital estimada',
                  value: `${digitalShare.toFixed(1)}%`,
                  sub: `Sobre ${totalTransacciones.toFixed(0)}k transacciones`,
                  valueColor: digitalShare >= 60 ? 'text-emerald-400' : 'text-amber-400',
                },
              ].map((item, idx) => (
                <div
                  key={item.label}
                  className="rounded-xl bg-card p-4 floating-card animate-fade-in-up cursor-default"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{item.icon}</span>
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground font-medium leading-tight">{item.label}</p>
                  </div>
                  <p className={`text-lg font-bold leading-tight ${item.valueColor}`}>{item.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-snug">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Columna derecha: controles */}
          <DashboardRealtimeControls
            focusOptions={Object.entries(focusLabels).map(([value, label]) => ({ value, label }))}
            generatedAt={generatedAt}
            initialFocus={selectedFocus}
            initialMonth={String(selectedMonth.id_tiempo)}
            initialRegion={String(selectedRegion.id_region)}
            monthOptions={monthOptions.map((i) => ({ value: String(i.id_tiempo), label: i.mes_anio }))}
            regionOptions={alertas.map((i) => ({ value: String(i.id_region), label: i.nombre }))}
          />
        </section>

        {/* ══════ FILA 3: EVOLUCIÓN + ALERTAS REGIONALES ══════ */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <EvolucionChart data={monthOptions.slice(0, selectedIndex + 1)} rangeLabel={rangeLabel} />
          </div>
          <div>
            <AlertasRegion
              currentLabel={selectedMonth.mes_anio}
              data={alertas}
              selectedRegionId={selectedRegion.id_region}
            />
          </div>
        </section>

        {/* ══════ FILA 4: CRÉDITOS + CANALES ══════ */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <CreditosChart currentLabel={selectedMonth.mes_anio} data={creditos} />
          <CanalesChart  currentLabel={selectedMonth.mes_anio} data={canales} />
        </section>

        {/* ══════ FILA 5: INSIGHTS NL + RECOMENDACIÓN EJECUTIVA ══════ */}
        <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
          <InsightesNL
            alertas={alertas}
            creditos={creditos}
            currentLabel={selectedMonth.mes_anio}
            indicadores={monthOptions.slice(0, selectedIndex + 1)}
            selectedRegionName={selectedRegion.nombre}
          />

          {/* Panel recomendación */}
          <div className="rounded-2xl bg-card p-5 floating-card flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>

            {/* Foco activo */}
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium mb-1">Enfoque activo</p>
              <div className="flex items-center gap-2">
                <span className="text-xl">{focusIcon[selectedFocus]}</span>
                <span className="text-base font-bold text-foreground">{focusLabels[selectedFocus]}</span>
              </div>
            </div>

            {/* Recomendación */}
            <div className="rounded-xl bg-background/60 border border-border/60 p-4 flex-1">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium mb-2">Recomendación</p>
              <p className="text-sm font-semibold text-foreground mb-1">{focusRecommendation.title}</p>
              <p className="text-sm leading-6 text-muted-foreground">{focusRecommendation.text}</p>
            </div>

            {/* Semáforo */}
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium mb-2">Semáforo del mes</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: 'Mora',
                    value: `${selectedMonth.morosidad_pct.toFixed(1)}%`,
                    ok: selectedMonth.morosidad_pct <= selectedMonth.sistema_mora_pct,
                  },
                  {
                    label: 'Capital',
                    value: `${selectedMonth.ratio_capital_global.toFixed(1)}%`,
                    ok: selectedMonth.ratio_capital_global >= 10,
                  },
                  {
                    label: 'Digital',
                    value: `${digitalShare.toFixed(1)}%`,
                    ok: digitalShare >= 60,
                    warn: digitalShare >= 40,
                  },
                ].map(({ label, value, ok, warn }) => (
                  <div
                    key={label}
                    className={`rounded-xl border p-3 text-center transition-all ${
                      ok
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                        : warn
                        ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                        : 'bg-red-500/10 border-red-500/25 text-red-400'
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-wider opacity-75 mb-1">{label}</p>
                    <p className="text-base font-bold leading-none">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Región foco */}
            <div className="rounded-xl bg-background/60 border border-border/60 p-3 flex items-center gap-3">
              <span className="text-xl">📍</span>
              <div>
                <p className="text-xs text-muted-foreground">Región en foco</p>
                <p className="text-sm font-semibold text-foreground">{selectedRegion.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  Mora {selectedRegion.morosidad_pct.toFixed(1)}% · {selectedRegion.agencias} agencias
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════ FOOTER ══════ */}
        <footer className="border-t border-border/40 pb-4 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CmacLogo size={18} />
              <span className="text-xs text-muted-foreground font-medium">CMAC Trujillo · Tablero DSS</span>
            </div>
            <p className="text-xs text-muted-foreground/50">
              Fuentes: Supabase analítico · SBS Perú · BCRP API · {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}
