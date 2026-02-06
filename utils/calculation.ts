import { NovedadType } from '../types';
import { SHIFT_HOURS } from '../constants';

// 1. DEFINICIÓN DE LÍMITES (UMBRALES)
const DAY_START_MIN = 6 * 60;    // 06:00 -> 360 minutos
const NIGHT_START_MIN = 19 * 60; // 19:00 -> 1140 minutos
const MIN_IN_DAY = 24 * 60;      // 1440 minutos

/**
 * Convierte HH:mm a minutos desde las 00:00
 */
const toMinutes = (time: string): number => {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Verifica si un minuto específico (0-1439) es NOCTURNO.
 * Regla: Es nocturno si es < 06:00 O >= 19:00
 */
const isNightMinute = (minute: number): boolean => {
  const m = minute % MIN_IN_DAY;
  return m < DAY_START_MIN || m >= NIGHT_START_MIN;
};

interface CalculationResult {
  heDiurna: number;
  heNocturna: number;
  recargoNocturno: number;
  recargoFestivo: number;
  totalDuration: number;
  ordinaryHours: number;
  // Desglose real del tiempo trabajado (independiente de la novedad seleccionada)
  realDayHours: number;
  realNightHours: number;
  warnings: string[]; // Lista de errores de validación/auditoría
}

/**
 * CÁLCULO CORE: AUDITORÍA DE NÓMINA
 */
export const calculatePreciseOvertime = (
  start: string, 
  end: string, 
  turnoName: string, 
  novedad: NovedadType,
  fecha: string
): CalculationResult => {
  
  const result: CalculationResult = {
    heDiurna: 0,
    heNocturna: 0,
    recargoNocturno: 0,
    recargoFestivo: 0,
    totalDuration: 0,
    ordinaryHours: 0,
    realDayHours: 0,
    realNightHours: 0,
    warnings: []
  };

  if (!start || !end) return result;

  // 1. Configuración de tiempos brutos (Aritmética Horaria)
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  
  // Regla Matemática: Manejo de Medianoche
  // Si Fin < Inicio, D = (24 - Inicio) + Fin
  let durationMinutes = 0;

  if (endMin < startMin) {
    durationMinutes = (MIN_IN_DAY - startMin) + endMin;
  } else {
    durationMinutes = endMin - startMin;
  }

  result.totalDuration = Number((durationMinutes / 60).toFixed(2));

  if (result.totalDuration <= 0) return result;

  // 2. Definir Turno Ordinario (Minutos que NO son extras)
  const shiftConfig = SHIFT_HOURS[turnoName];
  const ordinaryMinutesSet = new Set<number>();

  if (shiftConfig && turnoName !== 'Rotativo') {
    let sStart = shiftConfig.start * 60;
    let sEnd = shiftConfig.end * 60;
    
    // Si el turno cruza medianoche
    if (sEnd < sStart) {
       for (let i = sStart; i < MIN_IN_DAY; i++) ordinaryMinutesSet.add(i);
       for (let i = 0; i < sEnd; i++) ordinaryMinutesSet.add(i);
    } else {
       for (let i = sStart; i < sEnd; i++) ordinaryMinutesSet.add(i);
    }
  }

  // 3. Segmentación y Clasificación (Minuto a Minuto)
  let countOrdinary = 0;
  let countExtraDay = 0;
  let countExtraNight = 0;
  let countTotalDay = 0;   // Para auditoría y recargos
  let countTotalNight = 0; // Para auditoría y recargos

  for (let i = 0; i < durationMinutes; i++) {
    // Minuto actual del día (0-1439)
    const currentMinuteOfDay = (startMin + i) % MIN_IN_DAY;
    const isNight = isNightMinute(currentMinuteOfDay);

    // Contadores Totales (Auditoría)
    if (isNight) countTotalNight++;
    else countTotalDay++;

    // Lógica de Descuento de Turno
    const isOrdinaryTime = turnoName !== 'Rotativo' && ordinaryMinutesSet.has(currentMinuteOfDay);

    if (isOrdinaryTime) {
      countOrdinary++;
    } else {
      // Es tiempo Extra
      if (isNight) countExtraNight++;
      else countExtraDay++;
    }
  }

  // Asignar valores calculados base
  result.ordinaryHours = Number((countOrdinary / 60).toFixed(2));
  result.realDayHours = Number((countTotalDay / 60).toFixed(2));
  result.realNightHours = Number((countTotalNight / 60).toFixed(2));

  // 4. Asignación según Tipo de Novedad Seleccionada
  const isRecargo = [NovedadType.RECARGO_NOCTURNO, NovedadType.RECARGO_DOMINICAL_FESTIVO].includes(novedad);
  
  if (isRecargo) {
    // Lógica Recargos: Usan el tiempo total en la franja (incluyendo ordinario)
    if (novedad === NovedadType.RECARGO_NOCTURNO) {
       result.recargoNocturno = Number((countTotalNight / 60).toFixed(2));
    } else if (novedad === NovedadType.RECARGO_DOMINICAL_FESTIVO) {
       result.recargoFestivo = Number((durationMinutes / 60).toFixed(2));
    }
  } else {
    // Lógica Extras: Usan solo el excedente del turno
    result.heDiurna = Number((countExtraDay / 60).toFixed(2));
    result.heNocturna = Number((countExtraNight / 60).toFixed(2));
  }

  // 5. REGLAS DE CONSISTENCIA (CHECKLIST DE ERRORES)

  // A. Traslape de Turno (Todo es ordinario)
  const totalCalculated = result.heDiurna + result.heNocturna + result.recargoNocturno + result.recargoFestivo;
  if (totalCalculated === 0 && result.totalDuration > 0 && result.ordinaryHours > 0) {
      result.warnings.push("ERROR: Las horas ingresadas corresponden al horario laboral normal y no se considerarán horas extra.");
  }

  // B. Contradicción de Tipo: Selecciona NOCTURNA pero es 100% DIURNA
  const targetedNocturna = [
    NovedadType.HE_NOCTURNA, 
    NovedadType.HE_DOMINICAL_FESTIVO_NOCTURNA,
    NovedadType.RECARGO_NOCTURNO
  ].includes(novedad);

  if (targetedNocturna && result.realNightHours === 0 && result.realDayHours > 0) {
     result.warnings.push(`ERROR DE CONTRADICCIÓN: Seleccionaste "${novedad}" pero el rango calculado es 100% DIURNO (06:00 - 19:00).`);
  }

  // C. Contradicción de Tipo: Selecciona DIURNA pero hay componente NOCTURNO significativo
  const targetedDiurna = [
    NovedadType.HE_DIURNA, 
    NovedadType.HE_DOMINICAL_FESTIVO_DIURNA
  ].includes(novedad);

  // Si seleccionó diurna, pero calculamos horas nocturnas reales
  if (targetedDiurna && result.realNightHours > 0) {
      result.warnings.push(`INCONSISTENCIA: Seleccionaste "${novedad}" pero el rango incluye ${result.realNightHours}h NOCTURNAS (19:00 - 06:00) que no se están cobrando.`);
  }

  // D. Error de Recargos: Seleccionó Recargo pero dio 0
  if (isRecargo && totalCalculated === 0 && result.totalDuration > 0) {
      if (novedad === NovedadType.RECARGO_NOCTURNO) {
          result.warnings.push("ERROR DE RECARGOS: Seleccionaste Recargo Nocturno pero el horario es totalmente Diurno.");
      }
  }

  return result;
};

// Funciones legacy
export const calculateEffectiveHours = (start: string, end: string, novedad: NovedadType): number => 0;
export const calculateTotalDuration = (start: string, end: string): number => {
    const s = toMinutes(start);
    const e = toMinutes(end);
    let d = e - s;
    if (e < s) d = (MIN_IN_DAY - s) + e;
    return Number((d / 60).toFixed(2));
};
export const getHoursBreakdown = (novedad: NovedadType, effectiveHours: number) => ({ he: 0, hr: 0 });