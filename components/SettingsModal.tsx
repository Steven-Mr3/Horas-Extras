import React, { useState } from 'react';
import { Settings, Save, X, Link, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onSave: (url: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentUrl, onSave }) => {
  const [url, setUrl] = useState(currentUrl);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    
    // Basic validation for common mistakes
    if (cleanUrl.includes('/edit')) {
      if (!window.confirm("La URL contiene '/edit', lo cual suele ser incorrecto. Las Web Apps de Google suelen terminar en '/exec'. ¿Deseas guardar de todos modos?")) {
        return;
      }
    }

    onSave(cleanUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            Configuración de Conexión
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              URL del Script de Google Sheets
            </label>
            <div className="relative">
                <Link className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                required
                />
            </div>
            
            <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-2">
              <p className="font-medium flex items-center gap-1.5 text-indigo-700">
                <AlertTriangle className="w-3.5 h-3.5" /> Requisitos obligatorios:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>La URL debe terminar en <code>/exec</code></li>
                <li>Al implementar (Deploy), en "Who has access" selecciona <strong>"Anyone" (Cualquier usuario)</strong>.</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              Guardar Conexión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};