import { NovedadType } from './types';

export const TURNO_OPTIONS = [
  'Mañana (6am - 2pm)',
  'Tarde (2pm - 10pm)',
  'Noche (10pm - 6am)',
  'Administrativo (8am - 5pm)',
  'Rotativo'
];

// Definición estricta de horarios de turno para cálculos
// Formato 24h. Si end < start, asume que cruza medianoche.
export const SHIFT_HOURS: Record<string, { start: number; end: number }> = {
  'Mañana (6am - 2pm)': { start: 6, end: 14 },
  'Tarde (2pm - 10pm)': { start: 14, end: 22 },
  'Noche (10pm - 6am)': { start: 22, end: 6 },
  'Administrativo (8am - 5pm)': { start: 8, end: 17 },
  // 'Rotativo' no tiene horario fijo, se asume cálculo total sin resta de ordinaria
};

export const NOVEDAD_OPTIONS = [
  { value: NovedadType.HE_DIURNA, label: 'Hora Extra Diurna' },
  { value: NovedadType.HE_NOCTURNA, label: 'Hora Extra Nocturna' },
  { value: NovedadType.RECARGO_NOCTURNO, label: 'Recargo Nocturno' },
  { value: NovedadType.RECARGO_DOMINICAL_FESTIVO, label: 'Recargo Dominical/Festivo' },
  { value: NovedadType.HE_DOMINICAL_FESTIVO_DIURNA, label: 'HE Dom/Fest Diurna' },
  { value: NovedadType.HE_DOMINICAL_FESTIVO_NOCTURNA, label: 'HE Dom/Fest Nocturna' },
];

// Helper to determine if a type falls under "HE" or "HR" bucket for this specific requirement
export const isOvertime = (type: NovedadType): boolean => {
  return [
    NovedadType.HE_DIURNA,
    NovedadType.HE_NOCTURNA,
    NovedadType.HE_DOMINICAL_FESTIVO_DIURNA,
    NovedadType.HE_DOMINICAL_FESTIVO_NOCTURNA
  ].includes(type);
};

export const isSurcharge = (type: NovedadType): boolean => {
  return [
    NovedadType.RECARGO_NOCTURNO,
    NovedadType.RECARGO_DOMINICAL_FESTIVO
  ].includes(type);
};