import type {
  AlertaRegion,
  CreditoSegmento,
  IndicadorMensual,
} from './queries'

function lerp(start: number, end: number, ratio: number) {
  return start + (end - start) * ratio
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function findBoundingIndices<T extends { id_tiempo: number }>(items: T[], idTiempo: number) {
  const sorted = [...items].sort((a, b) => a.id_tiempo - b.id_tiempo)
  const exact = sorted.find((item) => item.id_tiempo === idTiempo)
  if (exact) return { previous: exact, next: exact, ratio: 0 }

  let previous = sorted[0]
  let next = sorted[sorted.length - 1]

  for (const item of sorted) {
    if (item.id_tiempo < idTiempo) previous = item
    if (item.id_tiempo > idTiempo) {
      next = item
      break
    }
  }

  if (previous.id_tiempo === next.id_tiempo) {
    return { previous, next, ratio: 0 }
  }

  const ratio = (idTiempo - previous.id_tiempo) / (next.id_tiempo - previous.id_tiempo)
  return { previous, next, ratio }
}

export function simulateCreditosPorSegmento(
  existing: CreditoSegmento[],
  allSnapshots: Array<{ id_tiempo: number; data: CreditoSegmento[] }>,
  idTiempo: number
): CreditoSegmento[] {
  if (existing.length > 0) return existing

  const segmentIds = [...new Set(allSnapshots.flatMap((snapshot) => snapshot.data.map((item) => item.id_segmento)))]
  const bySegment = new Map<number, Array<CreditoSegmento & { id_tiempo: number }>>()

  for (const segmentId of segmentIds) {
    const entries = allSnapshots
      .map((snapshot) => {
        const found = snapshot.data.find((item) => item.id_segmento === segmentId)
        return found ? { ...found, id_tiempo: snapshot.id_tiempo } : null
      })
      .filter(Boolean) as Array<CreditoSegmento & { id_tiempo: number }>

    bySegment.set(segmentId, entries)
  }

  return segmentIds
    .map((segmentId) => {
      const entries = bySegment.get(segmentId) ?? []
      if (entries.length === 0) return null

      const { previous, next, ratio } = findBoundingIndices(entries, idTiempo)
      return {
        id_segmento: segmentId,
        nombre: previous.nombre,
        cartera_mm: round(lerp(previous.cartera_mm, next.cartera_mm, ratio), 1),
        mora_pct: round(lerp(previous.mora_pct, next.mora_pct, ratio), 1),
        num_clientes: Math.round(lerp(previous.num_clientes, next.num_clientes, ratio)),
        credito_promedio_soles: Math.round(
          lerp(previous.credito_promedio_soles, next.credito_promedio_soles, ratio)
        ),
      } satisfies CreditoSegmento
    })
    .filter(Boolean) as CreditoSegmento[]
}

export function simulateAlertasRegion(
  existing: AlertaRegion[],
  baseRegions: AlertaRegion[],
  indicadores: IndicadorMensual[],
  idTiempo: number
): AlertaRegion[] {
  if (existing.length > 0) return existing
  if (baseRegions.length === 0) return []

  const currentIndicator = indicadores.find((item) => item.id_tiempo === idTiempo)
  const previousIndicator =
    [...indicadores]
      .filter((item) => item.id_tiempo < idTiempo)
      .sort((a, b) => b.id_tiempo - a.id_tiempo)[0] ?? currentIndicator

  if (!currentIndicator || !previousIndicator) return []

  const baseTotalCartera = baseRegions.reduce((sum, item) => sum + item.cartera_mm, 0)
  const moraDelta = currentIndicator.morosidad_pct - previousIndicator.morosidad_pct
  const stressFactor = clamp(currentIndicator.morosidad_pct / 10.4, 0.88, 1.18)

  return baseRegions.map((region) => {
    const share = region.cartera_mm / baseTotalCartera
    const riskWeight =
      region.nivel_riesgo === 'Critico' ? 1.4 :
      region.nivel_riesgo === 'Alto' ? 1.15 :
      region.nivel_riesgo === 'Medio' ? 0.95 : 0.8
    const regionalOffset = (region.morosidad_pct - 10.4) * stressFactor
    const morosidad = clamp(currentIndicator.morosidad_pct + regionalOffset, 6.2, 16.8)
    const cartera = round(currentIndicator.cartera_bruta_mm * share, 1)
    const numClientShare = baseRegions.reduce((sum, item) => sum + item.num_clientes, 0)
    const clients = Math.round((region.num_clientes / numClientShare) * 149800)
    const variacion = round(moraDelta * riskWeight, 1)

    const nivel_riesgo =
      morosidad > 13 ? 'Critico' :
      morosidad > 11 ? 'Alto' :
      morosidad > 9 ? 'Medio' : 'Bajo'

    return {
      ...region,
      morosidad_pct: round(morosidad, 1),
      cartera_mm: cartera,
      num_clientes: clients,
      nivel_riesgo,
      variacion_mora_pp: variacion,
    }
  })
}
