import { NextResponse } from 'next/server'

export const revalidate = 3600

export async function GET() {
  try {
    const series = ['PN01288PM', 'PN01270PM', 'PD04637PD']
    const labels = ['Tasa Referencia BCRP', 'Inflación Acumulada', 'Tipo de Cambio S/']
    const units = ['%', '%', 'USD']

    const results = await Promise.all(
      series.map((s) =>
        fetch(
          `https://estadisticas.bcrp.gob.pe/estadisticas/series/api/${s}/json/1`,
          { next: { revalidate: 3600 } }
        ).then((r) => r.json()).catch(() => null)
      )
    )

    // Fallback con datos reales BCRP (Jun 2025) cuando la API no responde
    const fallback = ['4.75', '2.07', '3.72']

    const items = results.map((r, i) => {
      const periods = r?.periods
      const raw = periods?.[periods.length - 1]?.values?.[0]
      const val = raw != null && raw !== 'n.d.' ? String(Number(raw).toFixed(2)) : fallback[i]
      return {
        label: labels[i],
        value: val,
        unit: units[i],
        trend: 'flat' as const,
      }
    })

    return NextResponse.json(items)
  } catch {
    // Fallback estático cuando BCRP no responde desde el servidor
    return NextResponse.json([
      { label: 'Tasa Referencia BCRP', value: '4.75', unit: '%', trend: 'flat' },
      { label: 'Inflación Acumulada',  value: '2.07', unit: '%', trend: 'flat' },
      { label: 'Tipo de Cambio S/',    value: '3.72', unit: 'USD', trend: 'flat' },
    ])
  }
}
