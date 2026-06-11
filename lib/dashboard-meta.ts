export interface KpiDefinition {
  key: string
  label: string
  formula: string
  target: string
  owner: string
  purpose: string
  level: 'Estrategico' | 'Tactico' | 'Operativo'
}

export const dashboardContext = {
  company: {
    name: 'CMAC Trujillo S.A.',
    sector: 'Microfinanzas y banca minorista',
    size: 'Entidad regional con red de agencias, cartera multisegmento y canales digitales',
  },
  problem:
    'La gerencia necesita decidir en qué frentes priorizar acciones de crecimiento y control para sostener la rentabilidad sin deteriorar la morosidad ni la solvencia regulatoria.',
  objective:
    'Monitorear mensualmente la rentabilidad, riesgo crediticio y adopcion digital de CMAC Trujillo para identificar desviaciones frente a meta y activar decisiones correctivas en el cierre del mes analizado.',
}

export const dataInventory = [
  {
    name: 'fact_indicadores_mensual',
    type: 'Tabla transaccional consolidada',
    update: 'Mensual',
    volume: '24 meses historicos / 24 registros agregados',
    role: 'Hechos financieros y prudenciales',
  },
  {
    name: 'fact_creditos_segmento',
    type: 'Tabla analitica por segmento',
    update: 'Mensual',
    volume: '5 segmentos x 24 meses',
    role: 'Composicion de cartera y mora por segmento',
  },
  {
    name: 'fact_transacciones_mensual',
    type: 'Tabla analitica por canal',
    update: 'Mensual',
    volume: '5 canales x 24 meses',
    role: 'Uso de canales y adopcion digital',
  },
  {
    name: 'fact_alertas_region',
    type: 'Tabla analitica por region',
    update: 'Mensual',
    volume: 'Regiones x 24 meses',
    role: 'Alertas de riesgo territorial',
  },
  {
    name: 'BCRP API',
    type: 'API REST externa',
    update: 'Diaria',
    volume: '3 indicadores macro',
    role: 'Contexto macroeconomico para la decision',
  },
]

export const modelNotes = [
  'Modelo en estrella con una tabla de hechos central por dominio y dimensiones compartidas de tiempo, canal, segmento y region.',
  'Las claves de tiempo permiten comparar cierre actual vs cierre previo y sostener analisis de tendencia.',
  'Las dimensiones descriptivas separan atributos de negocio para facilitar slicing por segmento, territorio y canal.',
]

export const etlNotes = [
  'Homologacion de nombres de canales, segmentos y regiones para evitar duplicidad semantica.',
  'Conversión de montos a millones de soles y porcentajes a escala homogenea para comparabilidad visual.',
  'Ordenamiento por id_tiempo y derivacion de variaciones mensuales para alertas y storytelling.',
]

export const kpiDefinitions: KpiDefinition[] = [
  {
    key: 'roe',
    label: 'ROE',
    formula: 'Utilidad neta / Patrimonio promedio',
    target: '>= 12%',
    owner: 'Gerencia general',
    purpose: 'Determinar si la rentabilidad para accionistas sostiene la estrategia de crecimiento.',
    level: 'Estrategico',
  },
  {
    key: 'roa',
    label: 'ROA',
    formula: 'Utilidad neta / Activos promedio',
    target: '>= 1.5%',
    owner: 'Gerencia financiera',
    purpose: 'Medir eficiencia global de los activos de la entidad.',
    level: 'Tactico',
  },
  {
    key: 'capital',
    label: 'Ratio Capital Global',
    formula: 'Patrimonio efectivo / Activos y contingentes ponderados por riesgo',
    target: '>= 10%',
    owner: 'Riesgos y regulacion',
    purpose: 'Asegurar solvencia y capacidad de absorcion de perdidas.',
    level: 'Estrategico',
  },
  {
    key: 'mora',
    label: 'Morosidad',
    formula: 'Cartera vencida / Cartera bruta',
    target: '<= 8%',
    owner: 'Riesgos y cobranzas',
    purpose: 'Controlar deterioro del portafolio y activar recuperacion.',
    level: 'Estrategico',
  },
  {
    key: 'coverage',
    label: 'Cobertura de Provisiones',
    formula: 'Provisiones / Cartera morosa',
    target: '>= 100%',
    owner: 'Riesgos',
    purpose: 'Validar capacidad de cobertura frente al riesgo de credito.',
    level: 'Tactico',
  },
  {
    key: 'portfolio',
    label: 'Cartera Bruta',
    formula: 'Saldo total vigente + vencido',
    target: 'Crecimiento mensual positivo con mora controlada',
    owner: 'Negocios',
    purpose: 'Monitorear crecimiento del negocio crediticio.',
    level: 'Tactico',
  },
  {
    key: 'digital',
    label: 'Participacion Digital',
    formula: 'Transacciones digitales / Transacciones totales',
    target: '>= 60%',
    owner: 'Canales y transformacion digital',
    purpose: 'Acelerar migracion hacia canales de menor costo.',
    level: 'Operativo',
  },
]

export const designPrinciples = [
  'Jerarquia visual de arriba hacia abajo: KPIs, tendencias, focos de riesgo y recomendacion.',
  'Colores semanticos consistentes para rentabilidad, riesgo, solvencia y actividad digital.',
  'Comparacion contra referencia: mes anterior, promedio del sistema o meta regulatoria.',
  'Densidad controlada: cada visual responde a una pregunta decisional concreta.',
]

export const visualInventory = [
  'Tarjetas KPI para resumen ejecutivo y semaforizacion mensual.',
  'Composed chart para relacionar crecimiento de cartera, ROE y morosidad en el tiempo.',
  'Barras y radar por segmento para balancear tamano de cartera vs riesgo.',
  'Pie y barras por canal para medir adopcion digital y monto movilizado.',
  'Barras horizontales por region para alertas territoriales y variacion mensual.',
  'Panel narrativo para traducir hallazgos en decisiones accionables.',
]
