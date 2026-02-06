import React, { useState, useEffect, useMemo } from 'react';
import { Save, SlidersHorizontal, Calculator, AlertTriangle, CheckCircle, ShieldCheck, Calendar as CalendarIcon, Clock, Edit3, User, Briefcase } from 'lucide-react';
import { NovedadType, FormData, FieldConfiguration } from '../types';
import { TURNO_OPTIONS, NOVEDAD_OPTIONS } from '../constants';
import { calculatePreciseOvertime } from '../utils/calculation';
import { FieldConfigModal } from './FieldConfigModal';

interface EntryFormProps {
  onAdd: (data: FormData) => void;
}

const initialForm: FormData = {
  cedula: '',
  nombre: '',
  turno: TURNO_OPTIONS[0],
  novedad: NovedadType.HE_DIURNA,
  fecha: new Date().toISOString().split('T')[0],
  horaInicio: '',
  horaFin: '',
  observaciones: ''
};

const DEFAULT_CONFIG: FieldConfiguration[] = [
  { id: 'cedula', label: 'Cédula', type: 'text', required: true, order: 0, fullWidth: false },
  { id: 'nombre', label: 'Colaborador', type: 'text', required: true, order: 1, fullWidth: false },
  { id: 'turno', label: 'Turno', type: 'select', required: true, order: 2, fullWidth: false },
  { id: 'novedad', label: 'Novedad', type: 'select', required: true, order: 3, fullWidth: false },
  { id: 'fecha', label: 'Fecha', type: 'date', required: true, order: 4, fullWidth: true },
  { id: 'horaInicio', label: 'Inicio', type: 'time', required: true, order: 5, fullWidth: false },
  { id: 'horaFin', label: 'Fin', type: 'time', required: true, order: 6, fullWidth: false },
  { id: 'observaciones', label: 'Notas', type: 'textarea', required: false, order: 7, fullWidth: true },
];

export const EntryForm: React.FC<EntryFormProps> = ({ onAdd }) => {
  const [form, setForm] = useState<FormData>(initialForm);
  
  const [calcResult, setCalcResult] = useState({
    heDiurna: 0,
    heNocturna: 0,
    recargoNocturno: 0,
    recargoFestivo: 0,
    totalDuration: 0,
    ordinaryHours: 0,
    realDayHours: 0,
    realNightHours: 0,
    warnings: [] as string[]
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [fieldConfig, setFieldConfig] = useState<FieldConfiguration[]>(() => {
    const saved = localStorage.getItem('form_field_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  useEffect(() => {
    const result = calculatePreciseOvertime(
        form.horaInicio, 
        form.horaFin, 
        form.turno, 
        form.novedad, 
        form.fecha
    );
    setCalcResult(result);
  }, [form.horaInicio, form.horaFin, form.turno, form.novedad, form.fecha]);

  const sortedFields = useMemo(() => {
    return [...fieldConfig].sort((a, b) => a.order - b.order);
  }, [fieldConfig]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleConfigSave = (newConfig: FieldConfiguration[]) => {
    setFieldConfig(newConfig);
    localStorage.setItem('form_field_config', JSON.stringify(newConfig));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const field of fieldConfig) {
      if (field.required && !form[field.id]) {
        alert(`El campo ${field.label} es obligatorio.`);
        return;
      }
    }
    if (form.horaInicio && form.horaFin && calcResult.totalDuration <= 0) {
      alert("La duración del trabajo debe ser mayor a 0.");
      return;
    }
    if (calcResult.warnings.length > 0) {
        if (!confirm("ADVERTENCIA DE AUDITORÍA: Existen errores de validación. ¿Deseas guardar?")) {
            return;
        }
    }
    onAdd({ ...form });
    setForm(prev => ({ ...initialForm, cedula: prev.cedula, nombre: prev.nombre, turno: prev.turno, fecha: prev.fecha }));
  };

  const renderField = (field: FieldConfiguration) => {
    const inputClass = "w-full h-14 px-4 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-metallic/50 text-slate-900 dark:text-slate-100 text-base focus:ring-2 focus:ring-cobalt-500 focus:border-cobalt-400 outline-none transition-all appearance-none shadow-sm dark:shadow-metallic input-metallic placeholder:text-gray-400 dark:placeholder:text-slate-500";
    
    // Icon mapping
    let Icon = Edit3;
    if (field.type === 'date') Icon = CalendarIcon;
    if (field.type === 'time') Icon = Clock;
    if (field.id === 'cedula' || field.id === 'nombre') Icon = User;
    if (field.id === 'turno' || field.id === 'novedad') Icon = Briefcase;

    const showIcon = field.type !== 'textarea' && field.type !== 'select';

    const wrapWithIcon = (element: React.ReactNode) => (
        <div className="relative group">
            {element}
            {showIcon && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-slate-500 group-focus-within:text-cobalt-400 transition-colors">
                    <Icon className="w-5 h-5" />
                </div>
            )}
        </div>
    );

    switch (field.type) {
      case 'select':
        return wrapWithIcon(
             <select name={field.id} value={form[field.id]} onChange={handleChange} className={inputClass} required={field.required}>
                {field.id === 'turno' && TURNO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                {field.id === 'novedad' && NOVEDAD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
             </select>
        );
      case 'textarea':
        return (
          <textarea
            name={field.id}
            value={form[field.id]}
            onChange={handleChange}
            className={`${inputClass} min-h-[120px] py-4 resize-none leading-relaxed`}
            placeholder="Detalles..."
            required={field.required}
          />
        );
      default:
        return wrapWithIcon(
            <input
                type={field.type}
                name={field.id}
                value={form[field.id]}
                onChange={handleChange}
                className={inputClass}
                required={field.required}
                placeholder={field.id === 'cedula' ? 'Ej. 12345678' : ''}
            />
        );
    }
  };

  const totalHE = calcResult.heDiurna + calcResult.heNocturna;
  const totalHR = calcResult.recargoNocturno + calcResult.recargoFestivo;
  const hasResult = totalHE > 0 || totalHR > 0;

  return (
    <div className="pb-40">
      <div className="flex justify-end mb-4">
        <button onClick={() => setIsConfigOpen(true)} className="flex items-center gap-2 text-xs text-slate-400 hover:text-primary transition-colors">
            <SlidersHorizontal className="w-4 h-4" /> Personalizar Campos
        </button>
      </div>

      <FieldConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} currentConfig={fieldConfig} onSave={handleConfigSave} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedFields.map((field) => (
            <div key={field.id} className={field.fullWidth || field.type === 'textarea' ? "col-span-1 md:col-span-2" : "col-span-1"}>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-400 ml-1 uppercase tracking-wider text-xs mb-2 block">
                {field.label} {field.required && <span className="text-red-400">*</span>}
              </label>
              {renderField(field)}
            </div>
          ))}
        </div>

        {/* Live Calculation Card */}
        {(form.horaInicio || form.horaFin) && (
            <div className="mt-2 rounded-2xl p-5 bg-white dark:bg-[#162032] border border-blue-500/10 dark:border-slate-700 shadow-lg shadow-blue-500/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-60 dark:opacity-40"></div>
                <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between">
                         <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Estimado</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                                {(totalHE + totalHR).toFixed(2)} <span className="text-sm text-slate-500">hrs</span>
                            </p>
                         </div>
                         <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 shadow-inner">
                             <Clock className="w-5 h-5" />
                         </div>
                    </div>
                    
                    {/* Validation Warnings */}
                    {calcResult.warnings.length > 0 ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            {calcResult.warnings.map((warn, i) => (
                                <div key={i} className="flex gap-2 text-xs text-red-400 items-start">
                                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {warn}
                                </div>
                            ))}
                        </div>
                    ) : hasResult && (
                         <div className="flex items-center gap-2 text-xs text-emerald-400">
                             <ShieldCheck className="w-4 h-4" /> Validación correcta
                         </div>
                    )}
                </div>
            </div>
        )}

        <div className="fixed bottom-14 left-0 w-full p-4 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-30 md:static md:bg-transparent md:border-none md:p-0 md:mt-6">
            <div className="max-w-md mx-auto">
                <button type="submit" className="w-full h-14 bg-btn-cobalt text-white font-bold rounded-xl shadow-glow-blue flex items-center justify-center gap-2.5 active:scale-[0.98] active:shadow-none transition-all duration-200 group relative overflow-hidden border-t border-white/20">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Save className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                    <span className="drop-shadow-md tracking-wide">Guardar y Sincronizar</span>
                </button>
            </div>
        </div>
      </form>
    </div>
  );
};