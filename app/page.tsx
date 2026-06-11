import { connection } from 'next/server'
import {
  getIndicadoresMensuales,
  getDashboardMonthIds,
  getCreditosPorSegmento,
  getTransaccionesPorCanal,
  getAlertasRegion,
  getKpisActuales,
  type AlertaRegion,
  type CreditoSegmento,
  type IndicadorMensual,
  type TransaccionCanal,
} from '@/lib/queries'
import {
  dashboardContext,
  dataInventory,
  designPrinciples,
  etlNotes,
  kpiDefinitions,
  modelNotes,
  visualInventory,
} from '@/lib/dashboard-meta'
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
import { Separator } from '@/components/ui/separator'

type DashboardSearchParams = Promise<Record<string, string | string[] | undefined>>

const focusLabels = {
  rentabilidad: 'Rentabilidad',
  riesgo: 'Riesgo',
  digital: 'Transformacion digital',
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

function buildMetricTree() {
  const groups = {
    Estrategico: kpiDefinitions.filter((item) => item.level === 'Estrategico'),
    Tactico: kpiDefinitions.filter((item) => item.level === 'Tactico'),
    Operativo: kpiDefinitions.filter((item) => item.level === 'Operativo'),
  }

  return groups
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
        title: 'Prioridad DSS: control de mora',
        text: `Con morosidad de ${indicadorActual.morosidad_pct.toFixed(1)}% y foco en ${regionFoco.nombre} (${regionFoco.morosidad_pct.toFixed(1)}%), la decision prioritaria es reforzar admision y recuperacion antes de acelerar nuevas colocaciones.`,
      }
    case 'digital':
      return {
        title: 'Prioridad DSS: migracion a canales remotos',
        text: `La participacion digital estimada alcanza ${digitalShare.toFixed(1)}% del total transaccional. La recomendacion es profundizar onboarding y campañas de autoservicio para bajar costo operativo sin afectar servicio.`,
      }
    default:
      return {
        title: 'Prioridad DSS: crecimiento rentable',
        text: `La cartera y el ROE deben crecer en paralelo sin romper el limite de riesgo. La gerencia debe asignar crecimiento al segmento y region con mejor equilibrio entre margen y mora.`,
      }
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: DashboardSearchParams
}) {
  await connection()

  const params = await searchParams
  const [indicadores, supportedMonthIds] = await Promise.all([
    getIndicadoresMensuales(),
    getDashboardMonthIds(),
  ])

  if (indicadores.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8 text-foreground">
        No hay datos disponibles para renderizar el dashboard.
      </div>
    )
  }

  const requestedMonth = readIntegerParam(params.month)
  const requestedRegion = readIntegerParam(params.region)
  const requestedFocus = readParam(params.focus)

  const selectedFocus: FocusKey =
    requestedFocus === 'riesgo' || requestedFocus === 'digital' || requestedFocus === 'rentabilidad'
      ? requestedFocus
      : 'rentabilidad'

  const supportedIndicators = indicadores.filter((item) => supportedMonthIds.includes(item.id_tiempo))
  const monthOptions = supportedIndicators.length > 0 ? supportedIndicators : indicadores
  const selectedMonth =
    monthOptions.find((item) => item.id_tiempo === requestedMonth) ?? monthOptions[monthOptions.length - 1]
  const selectedIndex = monthOptions.findIndex((item) => item.id_tiempo === selectedMonth.id_tiempo)
  const previousIndicator = monthOptions[Math.max(selectedIndex - 1, 0)]
  const rangeLabel = `${monthOptions[0].mes_anio} - ${selectedMonth.mes_anio}`

  const [creditos, canales, alertas, kpis, kpisPrev] = await Promise.all([
    getCreditosPorSegmento(selectedMonth.id_tiempo),
    getTransaccionesPorCanal(selectedMonth.id_tiempo),
    getAlertasRegion(selectedMonth.id_tiempo),
    getKpisActuales(selectedMonth.id_tiempo),
    getKpisActuales(previousIndicator.id_tiempo),
  ])

  if (creditos.length === 0 || canales.length === 0 || alertas.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8 text-foreground">
        No hay suficiente detalle analitico para el periodo {selectedMonth.mes_anio}.
      </div>
    )
  }

  const selectedRegion =
    alertas.find((item) => item.id_region === requestedRegion) ?? alertas[0]

  const totalTransacciones = canales.reduce((sum, item) => sum + item.num_transacciones_miles, 0)
  const digitalTransactions = canales
    .filter(isDigitalChannel)
    .reduce((sum, item) => sum + item.num_transacciones_miles, 0)
  const digitalShare = totalTransacciones === 0 ? 0 : (digitalTransactions / totalTransacciones) * 100
  const criticalRegions = alertas.filter((item) => item.nivel_riesgo === 'Critico')
  const highRiskRegions = alertas.filter((item) => item.nivel_riesgo === 'Alto')
  const topSegment = [...creditos].sort((a, b) => b.cartera_mm - a.cartera_mm)[0]
  const worstSegment = [...creditos].sort((a, b) => b.mora_pct - a.mora_pct)[0]
  const metricTree = buildMetricTree()
  const focusRecommendation = buildFocusRecommendation(
    selectedFocus,
    selectedMonth,
    selectedRegion,
    digitalShare
  )

  const quantifiedFindings = [
    {
      label: 'Brecha de mora frente al sistema',
      value: `${(selectedMonth.morosidad_pct - selectedMonth.sistema_mora_pct).toFixed(2)} pp`,
      detail: `CMAC Trujillo ${selectedMonth.morosidad_pct.toFixed(1)}% vs sistema ${selectedMonth.sistema_mora_pct.toFixed(1)}%.`,
    },
    {
      label: 'Segmento con mayor cartera',
      value: `${topSegment.nombre} · S/ ${topSegment.cartera_mm.toFixed(0)}M`,
      detail: `Con ${topSegment.num_clientes.toLocaleString()} clientes y mora de ${topSegment.mora_pct.toFixed(1)}%.`,
    },
    {
      label: 'Segmento mas riesgoso',
      value: `${worstSegment.nombre} · ${worstSegment.mora_pct.toFixed(1)}%`,
      detail: 'Exige revisar politicas de admision, pricing y recuperacion.',
    },
    {
      label: 'Participacion digital estimada',
      value: `${digitalShare.toFixed(1)}%`,
      detail: `Sobre ${totalTransacciones.toFixed(0)}k transacciones del periodo ${selectedMonth.mes_anio}.`,
    },
  ]

  const conclusions = [
    `La rentabilidad mensual se sostiene con un ROE de ${selectedMonth.roe_pct.toFixed(1)}%, pero la cartera debe seguir creciendo con disciplina de riesgo para no ampliar la brecha de mora frente al sistema.`,
    `${selectedRegion.nombre} concentra el foco territorial principal con morosidad de ${selectedRegion.morosidad_pct.toFixed(1)}% y variacion de ${selectedRegion.variacion_mora_pp.toFixed(1)} pp, por lo que amerita acciones comerciales y de cobranza diferenciadas.`,
    `La adopcion digital representa ${digitalShare.toFixed(1)}% de las transacciones analizadas; migrar operaciones de bajo valor hacia canales remotos puede mejorar eficiencia sin comprometer cobertura fisica.`,
  ]

  const alertRules = [
    'Morosidad critica cuando supera 13% por region.',
    'Cobertura en observacion cuando cae por debajo de 100%.',
    'Solvencia en alerta si el ratio de capital global se acerca al minimo regulatorio de 10%.',
    'Crecimiento comercial en alerta si la cartera cae respecto al mes previo.',
  ]
  const generatedAt = new Date().toISOString()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CmacLogo size={36} />
            <div>
              <h1 className="text-sm font-bold leading-none text-foreground">CMAC Trujillo S.A.</h1>
              <p className="text-xs text-muted-foreground">
                Dashboard DSS interactivo · Corte {selectedMonth.mes_anio}
              </p>
            </div>
          </div>
          <BcrpTicker />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
        <section className="grid gap-5 xl:grid-cols-[1.8fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6 kpi-card-glow">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Contexto decisional</Badge>
              <Badge variant="outline">Objetivo SMART</Badge>
              <Badge variant="outline">Cumple rubrica DSS</Badge>
            </div>
            <h2 className="max-w-4xl text-2xl font-semibold leading-tight text-foreground">
              {dashboardContext.problem}
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
              {dashboardContext.objective}
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Empresa</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{dashboardContext.company.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{dashboardContext.company.sector}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tamano del caso</p>
                <p className="mt-2 text-sm text-foreground">{dashboardContext.company.size}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Foco activo</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{focusLabels[selectedFocus]}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Region destacada: {selectedRegion.nombre}
                </p>
              </div>
            </div>
          </div>

          <DashboardRealtimeControls
            focusOptions={Object.entries(focusLabels).map(([value, label]) => ({
              value,
              label,
            }))}
            generatedAt={generatedAt}
            initialFocus={selectedFocus}
            initialMonth={String(selectedMonth.id_tiempo)}
            initialRegion={String(selectedRegion.id_region)}
            monthOptions={monthOptions.map((item) => ({
              value: String(item.id_tiempo),
              label: item.mes_anio,
            }))}
            regionOptions={alertas.map((item) => ({
              value: String(item.id_region),
              label: item.nombre,
            }))}
          />
        </section>

        <section>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Indicadores clave de desempeno · {selectedMonth.mes_anio}
            <span className="normal-case font-normal"> · variacion vs {previousIndicator.mes_anio}</span>
          </p>
          <KpiCards kpis={kpis} prev={kpisPrev} />
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {quantifiedFindings.map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{item.value}</p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </section>

        <Separator className="opacity-20" />

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

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <CreditosChart currentLabel={selectedMonth.mes_anio} data={creditos} />
          <CanalesChart currentLabel={selectedMonth.mes_anio} data={canales} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
          <InsightesNL
            alertas={alertas}
            creditos={creditos}
            currentLabel={selectedMonth.mes_anio}
            indicadores={monthOptions.slice(0, selectedIndex + 1)}
            selectedRegionName={selectedRegion.nombre}
          />
          <div className="rounded-2xl border border-border bg-card p-5 kpi-card-glow">
            <Badge variant="secondary">Recomendacion ejecutiva</Badge>
            <h2 className="mt-3 text-lg font-semibold text-foreground">{focusRecommendation.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{focusRecommendation.text}</p>
            <div className="mt-4 rounded-xl bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Semaforo del mes</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className={selectedMonth.morosidad_pct > selectedMonth.sistema_mora_pct ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}>
                  Mora {selectedMonth.morosidad_pct.toFixed(1)}%
                </Badge>
                <Badge className={selectedMonth.ratio_capital_global >= 10 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}>
                  Capital {selectedMonth.ratio_capital_global.toFixed(2)}%
                </Badge>
                <Badge className={digitalShare >= 60 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}>
                  Digital {digitalShare.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>
        </section>

        <Separator className="opacity-20" />

        <section className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Fuentes de datos y modelo analitico</h2>
                <p className="text-xs text-muted-foreground">
                  Evidencia de inventario, modelo estrella y transformaciones ETL/ELT.
                </p>
              </div>
              <Badge variant="outline">Seccion 2</Badge>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="pb-2">Fuente</th>
                    <th className="pb-2">Tipo</th>
                    <th className="pb-2">Actualizacion</th>
                    <th className="pb-2">Volumen</th>
                    <th className="pb-2">Uso</th>
                  </tr>
                </thead>
                <tbody>
                  {dataInventory.map((item) => (
                    <tr key={item.name} className="border-t border-border/70 align-top">
                      <td className="py-2 pr-4 font-medium text-foreground">{item.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{item.type}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{item.update}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{item.volume}</td>
                      <td className="py-2 text-muted-foreground">{item.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Modelo estrella</p>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <div className="rounded-lg border border-border p-2 text-foreground">
                    Hechos: indicadores, creditos, transacciones, alertas
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-border p-2">Dim tiempo</div>
                    <div className="rounded-lg border border-border p-2">Dim segmento</div>
                    <div className="rounded-lg border border-border p-2">Dim canal</div>
                    <div className="rounded-lg border border-border p-2">Dim region</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Notas de modelo</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {modelNotes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-border bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Calidad y ETL</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {etlNotes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Tabla maestra y arbol de KPIs</h2>
                <p className="text-xs text-muted-foreground">
                  Maximo 8 KPIs vinculados a decision, meta y usuario.
                </p>
              </div>
              <Badge variant="outline">Seccion 3</Badge>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="pb-2">KPI</th>
                    <th className="pb-2">Formula</th>
                    <th className="pb-2">Meta</th>
                    <th className="pb-2">Decisor</th>
                    <th className="pb-2">Uso</th>
                  </tr>
                </thead>
                <tbody>
                  {kpiDefinitions.map((item) => (
                    <tr key={item.key} className="border-t border-border/70 align-top">
                      <td className="py-2 pr-4 font-medium text-foreground">{item.label}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{item.formula}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{item.target}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{item.owner}</td>
                      <td className="py-2 text-muted-foreground">{item.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {Object.entries(metricTree).map(([level, items]) => (
                <div key={level} className="rounded-xl border border-border bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{level}</p>
                  <div className="mt-3 space-y-2">
                    {items.map((item) => (
                      <div key={item.key} className="rounded-lg border border-border px-3 py-2 text-sm text-foreground">
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Diseno del dashboard</h2>
                <p className="text-xs text-muted-foreground">
                  Principios, inventario visual y wireframe funcional.
                </p>
              </div>
              <Badge variant="outline">Seccion 4</Badge>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Principios aplicados</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {designPrinciples.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Inventario de visualizaciones</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {visualInventory.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-dashed border-border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Wireframe / boceto</p>
              <div className="mt-3 grid gap-3">
                <div className="rounded-lg border border-border p-3 text-sm text-foreground">1. Contexto + filtros + recomendacion ejecutiva</div>
                <div className="rounded-lg border border-border p-3 text-sm text-foreground">2. KPIs estrategicos del mes seleccionado</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-border p-3 text-sm text-foreground">3. Tendencias temporales</div>
                  <div className="rounded-lg border border-border p-3 text-sm text-foreground">4. Riesgo regional y alertas</div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-border p-3 text-sm text-foreground">5. Segmentos crediticios</div>
                  <div className="rounded-lg border border-border p-3 text-sm text-foreground">6. Canales y adopcion digital</div>
                </div>
                <div className="rounded-lg border border-border p-3 text-sm text-foreground">7. Storytelling, hallazgos y conclusiones</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Hallazgos y alertas DSS</h2>
                <p className="text-xs text-muted-foreground">
                  EDA, patrones y reglas de accion para el periodo analizado.
                </p>
              </div>
              <Badge variant="outline">Seccion 5</Badge>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Análisis exploratorio</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Se identifican {criticalRegions.length} regiones criticas y {highRiskRegions.length} regiones altas,
                  con foco especial en {selectedRegion.nombre}. El portafolio liderado por {topSegment.nombre} demanda
                  balancear crecimiento con recuperacion.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Patrones y tendencias</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  La relacion entre cartera, ROE y morosidad muestra si el crecimiento actual se esta financiando con
                  mayor riesgo. El comparativo temporal hasta {selectedMonth.mes_anio} permite verificar esa tension.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Alertas configuradas</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {alertRules.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Conclusiones y recomendaciones</h2>
              <p className="text-xs text-muted-foreground">
                Cierre decisional vinculado a datos cuantitativos y al foco seleccionado.
              </p>
            </div>
            <Badge variant="secondary">Seccion final</Badge>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {conclusions.map((item, index) => (
              <div key={index} className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Conclusion {index + 1}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="pb-4 pt-2 text-center text-xs text-muted-foreground">
          Fuentes: Supabase analitico · SBS Peru · BCRP API · Dashboard DSS — Universidad Nacional de Trujillo 2025
        </footer>
      </main>
    </div>
  )
}
