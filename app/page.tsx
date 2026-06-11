import {
  getIndicadoresMensuales,
  getCreditosPorSegmento,
  getTransaccionesPorCanal,
  getAlertasRegion,
  getKpisActuales,
} from '@/lib/queries'
import KpiCards from '@/components/dashboard/KpiCards'
import EvolucionChart from '@/components/dashboard/EvolucionChart'
import CreditosChart from '@/components/dashboard/CreditosChart'
import CanalesChart from '@/components/dashboard/CanalesChart'
import AlertasRegion from '@/components/dashboard/AlertasRegion'
import BcrpTicker from '@/components/dashboard/BcrpTicker'
import InsightesNL from '@/components/dashboard/InsightesNL'
import { Separator } from '@/components/ui/separator'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [indicadores, creditos, canales, alertas, kpis, kpisPrev] = await Promise.all([
    getIndicadoresMensuales(),
    getCreditosPorSegmento(24),
    getTransaccionesPorCanal(),
    getAlertasRegion(),
    getKpisActuales(24),
    getKpisActuales(23),
  ])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-xs">CM</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-none">CMAC Trujillo S.A.</h1>
              <p className="text-xs text-muted-foreground">Dashboard de Decisiones · Cierre Mar 2025</p>
            </div>
          </div>
          <BcrpTicker />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* KPIs */}
        <section>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Indicadores Clave de Desempeño · Mar 2025 <span className="normal-case font-normal">· variación vs Feb 2025</span>
          </p>
          <KpiCards kpis={kpis} prev={kpisPrev} />
        </section>

        <Separator className="opacity-20" />

        {/* Panel Lenguaje Natural */}
        <section>
          <InsightesNL indicadores={indicadores} alertas={alertas} creditos={creditos} />
        </section>

        <Separator className="opacity-20" />

        {/* Charts row 1 */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <EvolucionChart data={indicadores} />
          </div>
          <div>
            <AlertasRegion data={alertas} />
          </div>
        </section>

        {/* Charts row 2 */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <CreditosChart data={creditos} />
          <CanalesChart data={canales} />
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground pb-4">
          Fuentes: SBS Perú (datos financieros) · BCRP API (macroeconómico) · DSS Dashboard — Universidad Nacional de Trujillo 2025
        </footer>
      </main>
    </div>
  )
}
