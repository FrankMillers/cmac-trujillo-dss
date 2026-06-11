import 'server-only'

import { supabase } from './supabase'

export interface IndicadorMensual {
  id_tiempo: number
  mes_anio: string
  roe_pct: number
  roa_pct: number
  ratio_capital_global: number
  morosidad_pct: number
  cobertura_provisiones: number
  cartera_bruta_mm: number
  patrimonio_mm: number
  sistema_mora_pct: number
}

export interface CreditoSegmento {
  id_segmento: number
  nombre: string
  cartera_mm: number
  mora_pct: number
  num_clientes: number
  credito_promedio_soles: number
}

export interface CreditosSnapshot {
  id_tiempo: number
  data: CreditoSegmento[]
}

export interface TransaccionCanal {
  id_canal: number
  nombre: string
  tipo: string
  num_transacciones_miles: number
  monto_total_mm: number
  ticket_promedio_soles: number
}

export interface AlertaRegion {
  id_region: number
  nombre: string
  agencias: number
  macrozona: string
  morosidad_pct: number
  cartera_mm: number
  num_clientes: number
  nivel_riesgo: string
  variacion_mora_pp: number
}

export interface KpiActual {
  roe_pct: number
  roa_pct: number
  ratio_capital_global: number
  morosidad_pct: number
  cobertura_provisiones: number
  cartera_bruta_mm: number
  patrimonio_mm: number
}

export async function getDashboardMonthIds(): Promise<number[]> {
  const [indicadoresRes, creditosRes, canalesRes, alertasRes] = await Promise.all([
    supabase.from('fact_indicadores_mensual').select('id_tiempo'),
    supabase.from('fact_creditos_segmento').select('id_tiempo, dim_segmento!inner(nombre)'),
    supabase.from('fact_transacciones_mensual').select('id_tiempo, dim_canal!inner(nombre)'),
    supabase.from('fact_alertas_region').select('id_tiempo, dim_region!inner(nombre)'),
  ])

  for (const result of [indicadoresRes, creditosRes, canalesRes, alertasRes]) {
    if (result.error) throw result.error
  }

  const indicadorIds = (indicadoresRes.data ?? []).map((row) => row.id_tiempo)
  const creditoIds = (creditosRes.data ?? []).map((row) => row.id_tiempo)
  const canalIds = (canalesRes.data ?? []).map((row) => row.id_tiempo)
  const alertaIds = (alertasRes.data ?? []).map((row) => row.id_tiempo)

  const sets = [
    new Set(indicadorIds),
    new Set(creditoIds),
    new Set(canalIds),
    new Set(alertaIds),
  ]

  return [...sets[0]].filter((id) => sets.every((set) => set.has(id))).sort((a, b) => a - b)
}

export async function getIndicadoresMensuales(): Promise<IndicadorMensual[]> {
  const { data, error } = await supabase
    .from('fact_indicadores_mensual')
    .select(`
      id_tiempo,
      roe_pct, roa_pct, ratio_capital_global,
      morosidad_pct, cobertura_provisiones,
      cartera_bruta_mm, patrimonio_mm, sistema_mora_pct,
      dim_tiempo!inner(mes_anio)
    `)
    .order('id_tiempo')

  if (error) throw error
  return data.map((r: Record<string, unknown>) => ({
    ...r,
    mes_anio: (r.dim_tiempo as { mes_anio: string }).mes_anio,
  })) as IndicadorMensual[]
}

export async function getCreditosPorSegmento(idTiempo: number): Promise<CreditoSegmento[]> {
  const { data, error } = await supabase
    .from('fact_creditos_segmento')
    .select(`
      id_segmento, cartera_mm, mora_pct, num_clientes, credito_promedio_soles,
      dim_segmento!inner(nombre)
    `)
    .eq('id_tiempo', idTiempo)

  if (error) throw error
  return data.map((r: Record<string, unknown>) => ({
    ...r,
    nombre: (r.dim_segmento as { nombre: string }).nombre,
  })) as CreditoSegmento[]
}

export async function getCreditosSnapshots(): Promise<CreditosSnapshot[]> {
  const { data, error } = await supabase
    .from('fact_creditos_segmento')
    .select(`
      id_tiempo, id_segmento, cartera_mm, mora_pct, num_clientes, credito_promedio_soles,
      dim_segmento!inner(nombre)
    `)
    .order('id_tiempo')
    .order('id_segmento')

  if (error) throw error

  const grouped = new Map<number, CreditoSegmento[]>()
  for (const row of data as Record<string, unknown>[]) {
    const id_tiempo = row.id_tiempo as number
    const item = {
      id_segmento: row.id_segmento as number,
      nombre: (row.dim_segmento as { nombre: string }).nombre,
      cartera_mm: row.cartera_mm as number,
      mora_pct: row.mora_pct as number,
      num_clientes: row.num_clientes as number,
      credito_promedio_soles: row.credito_promedio_soles as number,
    } satisfies CreditoSegmento

    const current = grouped.get(id_tiempo) ?? []
    current.push(item)
    grouped.set(id_tiempo, current)
  }

  return [...grouped.entries()].map(([id_tiempo, groupedData]) => ({
    id_tiempo,
    data: groupedData,
  }))
}

export async function getTransaccionesPorCanal(idTiempo: number): Promise<TransaccionCanal[]> {
  const { data, error } = await supabase
    .from('fact_transacciones_mensual')
    .select(`
      id_canal, num_transacciones_miles, monto_total_mm, ticket_promedio_soles,
      dim_canal!inner(nombre, tipo)
    `)
    .eq('id_tiempo', idTiempo)

  if (error) throw error
  return data.map((r: Record<string, unknown>) => {
    const canal = r.dim_canal as { nombre: string; tipo: string }
    return { ...r, nombre: canal.nombre, tipo: canal.tipo }
  }) as TransaccionCanal[]
}

export async function getAlertasRegion(idTiempo: number): Promise<AlertaRegion[]> {
  const { data, error } = await supabase
    .from('fact_alertas_region')
    .select(`
      id_region, morosidad_pct, cartera_mm, num_clientes,
      nivel_riesgo, variacion_mora_pp,
      dim_region!inner(nombre, agencias, macrozona)
    `)
    .eq('id_tiempo', idTiempo)
    .order('morosidad_pct', { ascending: false })

  if (error) throw error
  return data.map((r: Record<string, unknown>) => {
    const reg = r.dim_region as { nombre: string; agencias: number; macrozona: string }
    return { ...r, nombre: reg.nombre, agencias: reg.agencias, macrozona: reg.macrozona }
  }) as AlertaRegion[]
}

export async function getAlertasRegionBase(): Promise<AlertaRegion[]> {
  return getAlertasRegion(24)
}

export async function getKpisActuales(idTiempo = 24): Promise<KpiActual> {
  const { data, error } = await supabase
    .from('fact_indicadores_mensual')
    .select('roe_pct, roa_pct, ratio_capital_global, morosidad_pct, cobertura_provisiones, cartera_bruta_mm, patrimonio_mm')
    .eq('id_tiempo', idTiempo)
    .single()

  if (error) throw error
  return data as KpiActual
}
