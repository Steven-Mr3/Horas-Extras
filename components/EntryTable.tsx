import React from 'react';
import { Trash2, FileSpreadsheet, Check, CloudOff, Calendar, Clock, Bolt, User, Moon } from 'lucide-react';
import { OvertimeRecord } from '../types';

interface EntryTableProps {
  records: OvertimeRecord[];
  onDelete: (id: string) => void;
  onExport: () => void;
}

export const EntryTable: React.FC<EntryTableProps> = ({ records, onDelete, onExport }) => {
  // Helper to mask sensitive ID data
  const maskCedula = (cedula: string | number) => {
    const str = String(cedula || '');
    if (!str) return '';
    if (str.length <= 4) return '****';
    return `******${str.slice(-4)}`;
  };

  if (records.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400">
        <Calendar className="w-12 h-12 mb-2 opacity-20" />
        <p>No hay registros disponibles</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      <div className="flex justify-between items-center mb-4 px-2">
         <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Registros Recientes</h3>
         <button onClick={onExport} className="text-xs text-primary font-medium hover:text-cyan-300 transition-colors flex items-center gap-1">
            <FileSpreadsheet className="w-3 h-3" /> Exportar CSV
         </button>
      </div>

      <div className="flex flex-col gap-3 pb-24 overflow-y-auto">
        {records.map((record) => {
            const isExtra = record.novedad.toLowerCase().includes('he');
            const isRecargo = record.novedad.toLowerCase().includes('recargo');

            return (
            <div key={record.id} className="group flex items-center gap-4 bg-white dark:bg-surface-dark hover:bg-slate-50 dark:hover:bg-slate-800/80 p-4 rounded-xl border border-transparent dark:border-border-metallic/30 transition-all shadow-sm relative overflow-hidden">
                {/* Delete Action (Hidden by default, visible on hover/focus) */}
                <button 
                    onClick={() => onDelete(record.id)}
                    className="absolute right-2 top-2 p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                    <Trash2 className="w-4 h-4" />
                </button>

                {/* Icon Indicator with Tailwind Colors */}
                <div className={`flex items-center justify-center rounded-xl shrink-0 size-12 transition-all duration-300 ${
                    isExtra ? 'bg-primary-dim text-primary border border-primary/20 shadow-[0_0_12px_rgba(0,224,255,0.2)]' : 
                    isRecargo ? 'bg-cobalt-500/10 text-cobalt-400 border border-cobalt-500/20 shadow-[0_0_12px_rgba(59,130,246,0.2)]' :
                    'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                }`}>
                    {isExtra ? <Bolt className="w-6 h-6 drop-shadow-[0_0_5px_rgba(0,224,255,0.5)]" /> : 
                     isRecargo ? <Moon className="w-5 h-5 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" /> : 
                     <Clock className="w-5 h-5" />}
                </div>

                <div className="flex flex-col justify-center flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-slate-900 dark:text-slate-100 text-sm font-bold leading-snug truncate">
                            {record.nombre}
                            <span className="text-slate-500 font-normal text-xs ml-1 opacity-70">({maskCedula(record.cedula)})</span>
                        </p>
                        
                        {/* Status Badges */}
                        {isExtra && (
                            <span className="bg-primary-dim text-primary border border-primary/30 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0 shadow-[0_0_8px_rgba(0,224,255,0.15)] backdrop-blur-sm">
                                Horas Extra
                            </span>
                        )}
                        {isRecargo && (
                            <span className="bg-cobalt-500/10 text-cobalt-400 border border-cobalt-500/30 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.15)] backdrop-blur-sm">
                                Recargo
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-normal leading-normal flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {record.fecha} <span className="text-slate-300 dark:text-slate-600">|</span> {record.horaInicio} - {record.horaFin}
                    </p>
                    <p className="text-slate-400 text-[10px] mt-1 truncate font-medium">{record.novedad}</p>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className={`font-bold text-sm ${
                        isExtra ? 'text-primary' : 
                        isRecargo ? 'text-cobalt-400' : 
                        'text-slate-900 dark:text-white'
                    }`}>
                        {(record.cantidadHE + record.cantidadHR).toFixed(1)}h
                    </span>
                    <div className="text-primary flex items-center justify-center rounded-full bg-primary/10 p-1" title="Sincronizado">
                        <Check className="w-3 h-3" />
                    </div>
                </div>
            </div>
            );
        })}
      </div>
    </div>
  );
};