
export enum NovedadType {
  HE_DIURNA = 'HE Diurna',
  HE_NOCTURNA = 'HE Nocturna',
  RECARGO_NOCTURNO = 'Recargo Nocturno',
  RECARGO_DOMINICAL_FESTIVO = 'Recargo Dom/Fest',
  HE_DOMINICAL_FESTIVO_DIURNA = 'HE Dom/Fest Diurna',
  HE_DOMINICAL_FESTIVO_NOCTURNA = 'HE Dom/Fest Nocturna'
}

export interface User {
  username: string;
  nombre: string;
  rol: 'admin' | 'user' | string;
}

export interface OvertimeRecord {
  id: string;
  cedula: string;
  nombre: string;
  username?: string; // Owner of the record for security filtering
  turno: string;
  novedad: NovedadType;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  observaciones: string;
  cantidadHE: number;
  cantidadHR: number;
  timestamp: number;
}

export type FormData = Omit<OvertimeRecord, 'id' | 'cantidadHE' | 'cantidadHR' | 'timestamp' | 'username'>;

export interface FieldConfiguration {
  id: keyof FormData;
  label: string;
  type: 'text' | 'date' | 'time' | 'select' | 'textarea';
  required: boolean;
  order: number;
  fullWidth: boolean;
}
