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

    const items = results.map((r, i) => {
      const periods = r?.periods
      const val = periods?.[periods.length - 1]?.values?.[0]
      return {
        label: labels[i],
        value: val != null && val !== 'n.d.' ? String(Number(val).toFixed(2)) : null,
        unit: units[i],
        trend: 'flat' as const,
      }
    })

    return NextResponse.json(items)
  } catch {
    return NextResponse.json([])
  }
}
