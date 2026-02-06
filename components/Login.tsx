import React, { useState } from 'react';
import { LogIn, UserPlus, Loader2, ShieldCheck } from 'lucide-react';
import { User } from '../types';
import { SheetsAPI } from '../services/api';

interface LoginProps {
  onLogin: (user: User) => void;
  sheetUrl: string;
}

export const Login: React.FC<LoginProps> = ({ onLogin, sheetUrl }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({ username: '', password: '', nombre: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validar sheetUrl antes de intentar conectar
    if (!sheetUrl || !sheetUrl.trim()) { 
        setError("Error de configuración: No se ha definido la URL de la base de datos (Google Sheet)."); 
        return; 
    }

    setIsLoading(true);
    try {
      if (isRegistering) {
        await SheetsAPI.registerUser(sheetUrl, { ...formData });
        alert("Usuario registrado. Inicia sesión.");
        setIsRegistering(false);
      } else {
        const response = await SheetsAPI.login(sheetUrl, formData.username, formData.password);
        if (response.success && response.user) onLogin(response.user);
        else setError(response.message || "Credenciales incorrectas");
      }
    } catch (err) { 
        setError("Error de conexión. Verifica tu internet o la URL del script."); 
    } finally { 
        setIsLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-6 font-display">
      <div className="w-full max-w-sm relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="glass-card rounded-3xl p-8 border border-white/10 shadow-glow">
            
            <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30">
                    <ShieldCheck className="w-8 h-8 text-white" />
                </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-white mb-1">Bienvenido</h2>
            <p className="text-slate-400 text-center text-sm mb-8">Control de Horas Extras</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                    <input name="username" type="text" placeholder="Usuario" required value={formData.username} onChange={handleChange} className="w-full h-12 px-4 rounded-xl bg-surface-dark border border-white/10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                    {isRegistering && (
                        <input name="nombre" type="text" placeholder="Nombre Completo" required value={formData.nombre} onChange={handleChange} className="w-full h-12 px-4 rounded-xl bg-surface-dark border border-white/10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                    )}
                    <input name="password" type="password" placeholder="Contraseña" required value={formData.password} onChange={handleChange} className="w-full h-12 px-4 rounded-xl bg-surface-dark border border-white/10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                </div>

                {error && <div className="text-red-400 text-xs text-center bg-red-500/10 p-2 rounded border border-red-500/20">{error}</div>}

                <button type="submit" disabled={isLoading} className="w-full h-12 bg-btn-cobalt text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegistering ? "Registrarse" : "Entrar")}
                </button>
            </form>

            <div className="mt-6 flex items-center justify-center text-xs">
                <button onClick={() => setIsRegistering(!isRegistering)} className="text-slate-400 hover:text-primary transition-colors">
                    {isRegistering ? 'Volver al inicio' : 'Crear cuenta'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};