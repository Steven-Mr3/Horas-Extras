import React, { useState, useEffect } from 'react';
import { X, ArrowUp, ArrowDown, Save, CheckSquare, Square } from 'lucide-react';
import { FieldConfiguration } from '../types';

interface FieldConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: FieldConfiguration[];
  onSave: (config: FieldConfiguration[]) => void;
}

export const FieldConfigModal: React.FC<FieldConfigModalProps> = ({ isOpen, onClose, currentConfig, onSave }) => {
  const [fields, setFields] = useState<FieldConfiguration[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Create a copy and sort by order
      setFields([...currentConfig].sort((a, b) => a.order - b.order));
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    if (direction === 'up' && index > 0) {
      [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
    } else if (direction === 'down' && index < newFields.length - 1) {
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    }
    // Re-assign order numbers
    const reordered = newFields.map((f, i) => ({ ...f, order: i }));
    setFields(reordered);
  };

  const toggleRequired = (index: number) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], required: !newFields[index].required };
    setFields(newFields);
  };

  const handleSave = () => {
    onSave(fields);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800">Personalizar Formulario</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <p className="text-xs text-slate-500 mb-4 bg-blue-50 p-2 rounded border border-blue-100">
            Ordena los campos usando las flechas y marca cuáles son obligatorios.
          </p>
          
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === fields.length - 1}
                      className="text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm font-medium text-slate-700">{field.label}</span>
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleRequired(index)}
                    className="flex items-center gap-2 text-xs font-medium px-2 py-1 rounded hover:bg-slate-50"
                  >
                    {field.required ? (
                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300" />
                    )}
                    <span className={field.required ? "text-emerald-700" : "text-slate-500"}>
                      Obligatorio
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};