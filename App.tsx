import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LayoutDashboard, CalendarDays, BarChart3, LogOut, RefreshCcw, Bell, Timer, Plus, Calendar, ShieldAlert } from 'lucide-react';
import { FormData, OvertimeRecord, User } from './types';
import { calculatePreciseOvertime } from './utils/calculation';
import { StatsCard } from './components/StatsCard';
import { EntryForm } from './components/EntryForm';
import { EntryTable } from './components/EntryTable';
import { Login } from './components/Login';
import { Notification, NotificationState } from './components/Notification';
import { SheetsAPI } from './services/api';

const DEFAULT_DB_URL = 'https://script.google.com/macros/s/AKfycbwfcjRPdWLt6DbC749VYoJMRA5hu1rNJjwBj_tThWL3B06CQhJi0cH4QSgXZEkkjMlyPw/exec';

type ViewType = 'dashboard' | 'calendar' | 'form' | 'reports';

const App: React.FC = () => {
  const [sheetUrl] = useState<string>(() => localStorage.getItem('sheet_script_url') || DEFAULT_DB_URL);
  const [isLoading, setIsLoading] = useState(false);
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  
  // Auth State
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
  }, []);

  const loadDataFromSheet = useCallback(async () => {
    if (!sheetUrl || !user) return;
    setIsLoading(true);
    try {
      const data = await SheetsAPI.fetchRecords(sheetUrl, user);
      
      // --- SECURITY LAYER ---
      // Even if the backend returns all data (due to script limitations), 
      // we strictly filter it here based on the role.
      let filteredData = data;
      
      if (user.rol !== 'admin') {
         // If not admin, ONLY show records that belong to this user
         // We check both username (system ID) and nombre (legacy check)
         filteredData = data.filter(r => 
            (r.username && r.username === user.username) || 
            (!r.username && r.nombre === user.nombre)
         );
      }
      
      setRecords(filteredData.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error(error);
      showNotification('error', error instanceof Error ? error.message : "Error al cargar datos");
    } finally {
      setIsLoading(false);
    }
  }, [sheetUrl, user, showNotification]);

  useEffect(() => {
    if (!localStorage.getItem('sheet_script_url')) {
      localStorage.setItem('sheet_script_url', DEFAULT_DB_URL);
    }
    if (sheetUrl && user) {
      loadDataFromSheet();
    } else {
        setRecords([]);
    }
  }, [sheetUrl, user, loadDataFromSheet]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('current_user', JSON.stringify(userData));
    showNotification('success', `Bienvenido, ${userData.nombre}`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('current_user');
    setRecords([]); // Security: Wipe data from memory immediately
  };

  const handleAddRecord = async (data: FormData) => {
    if (!sheetUrl || !user) {
      showNotification('error', 'Error de configuración o sesión');
      return;
    }

    const result = calculatePreciseOvertime(
        data.horaInicio, 
        data.horaFin, 
        data.turno, 
        data.novedad, 
        data.fecha
    );
    
    const totalHE = result.heDiurna + result.heNocturna;
    const totalHR = result.recargoNocturno + result.recargoFestivo;

    const newRecord: OvertimeRecord = {
      ...data,
      id: crypto.randomUUID(),
      username: user.username, // Security: Tag record with owner
      cantidadHE: totalHE,
      cantidadHR: totalHR,
      timestamp: Date.now()
    };

    setRecords(prev => [newRecord, ...prev]);
    setCurrentView('dashboard'); 
    showNotification('success', 'Registro guardado localmente (sincronizando...)');

    try {
      await SheetsAPI.saveRecord(sheetUrl, newRecord);
      showNotification('success', 'Sincronizado con la nube');
    } catch (error) {
      setRecords(prev => prev.filter(r => r.id !== newRecord.id));
      showNotification('error', error instanceof Error ? error.message : "Error al guardar en la nube");
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!sheetUrl) return;
    if (!window.confirm("¿Estás seguro de eliminar este registro?")) return;
    const previousRecords = [...records];
    setRecords(prev => prev.filter(r => r.id !== id));
    try {
      await SheetsAPI.deleteRecord(sheetUrl, id);
      showNotification('success', 'Registro eliminado');
    } catch (error) {
      setRecords(previousRecords);
      showNotification('error', "Error al eliminar registro");
    }
  };

  const handleExport = () => {
     alert("Exportando...");
  };

  // Stats Calculation
  const stats = useMemo(() => {
    return records.reduce((acc, curr) => ({
      totalHE: acc.totalHE + curr.cantidadHE,
      totalHR: acc.totalHR + curr.cantidadHR,
      totalRecords: acc.totalRecords + 1,
      uniquePeople: new Set([...Array.from(acc.uniquePeople), curr.cedula])
    }), { totalHE: 0, totalHR: 0, totalRecords: 0, uniquePeople: new Set<string>() });
  }, [records]);

  if (!user) {
    return (
      <>
        <Notification notification={notification} onClose={() => setNotification(null)} />
        <Login onLogin={handleLogin} sheetUrl={sheetUrl} />
      </>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pb-20 bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white transition-colors duration-200">
      <Notification notification={notification} onClose={() => setNotification(null)} />

      {/* HEADER */}
      {/* Added pt-[calc(...)] to handle Status Bar Notch on Mobile */}
      <header className="flex items-center justify-between px-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-4 sticky top-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-transparent dark:border-white/5">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 mr-4">
               Control Horas Extras
          </h1>
          
          <nav className="hidden md:flex items-center gap-6">
            <button 
                onClick={() => setCurrentView('dashboard')} 
                className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${currentView === 'dashboard' ? 'bg-white/10 text-primary' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
            >
                Inicio
            </button>
            <button 
                onClick={() => setCurrentView('reports')} 
                className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${currentView === 'reports' ? 'bg-white/10 text-primary' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
            >
                Historial
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button 
             onClick={() => setCurrentView('form')}
             className="hidden md:flex items-center gap-2 bg-btn-cobalt text-white border border-white/10 px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
          >
             <Plus className="w-4 h-4" />
             <span>Nuevo Registro</span>
          </button>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

          <button 
            onClick={loadDataFromSheet}
            className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${isLoading ? 'animate-spin' : ''}`}
            title="Sincronizar"
          >
             <RefreshCcw className="w-5 h-5 text-slate-700 dark:text-primary" />
          </button>
          
          <button 
             onClick={handleLogout}
             className="hidden md:flex p-2 rounded-full hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
             title="Cerrar Sesión"
          >
             <LogOut className="w-5 h-5" />
          </button>
          
          <div className={`h-10 w-10 rounded-full overflow-hidden border-2 shadow-glow ml-2 flex items-center justify-center font-bold text-lg ${user.rol === 'admin' ? 'bg-amber-500 border-amber-300 text-black' : 'bg-primary border-primary text-background-dark'}`} title={user.rol === 'admin' ? 'Administrador' : 'Colaborador'}>
            {user.nombre.charAt(0)}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1">
        {currentView === 'dashboard' && (
            <div className="animate-in fade-in duration-500">
                <div className="px-6 pb-2 mt-4 md:mt-8">
                    <div className="flex items-center justify-between">
                         <div>
                            <p className="text-secondary-text text-sm font-medium mb-1 tracking-wide uppercase">
                                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Hola, {user.nombre.split(' ')[0]}</h1>
                        </div>
                        {user.rol === 'admin' && (
                            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-xs font-bold uppercase tracking-wider">
                                <ShieldAlert className="w-4 h-4" /> Modo Administrador
                            </div>
                        )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {user.rol === 'admin' ? 'Visualizando datos globales de la operación.' : 'Aquí tienes el resumen de tu actividad personal.'}
                    </p>
                </div>

                <div className="px-6 py-6 space-y-6">
                    {/* Big Stats Card */}
                    <div className="bg-white dark:bg-gradient-to-br dark:from-[#1e293b] dark:to-[#0f172a] rounded-2xl p-6 shadow-soft dark:shadow-lg dark:shadow-blue-900/10 relative overflow-hidden group border border-slate-200 dark:border-card-border">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none"></div>
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Timer className="w-24 h-24 text-primary drop-shadow-[0_0_15px_rgba(0,224,255,0.5)]" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex flex-col">
                                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Horas Extras</span>
                                    <span className="text-4xl font-extrabold tracking-tight mt-1 text-slate-800 dark:text-white drop-shadow-md">
                                        {Math.floor(stats.totalHE)}<span className="text-2xl text-slate-400 font-bold">h</span> {(stats.totalHE % 1 * 60).toFixed(0)}<span className="text-2xl text-slate-400 font-bold">m</span>
                                    </span>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-bold bg-primary-dim text-cyan-600 dark:text-primary px-2.5 py-1 rounded-full border border-primary/20 shadow-[0_0_10px_rgba(0,224,255,0.2)]">
                                    Recargos: {stats.totalHR.toFixed(1)}h
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-2.5 mb-2 overflow-hidden shadow-inner">
                                <div className="bg-blue-metal h-2.5 rounded-full shadow-[0_0_10px_rgba(0,224,255,0.6)]" style={{ width: '65%' }}></div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Total registros: {stats.totalRecords}</p>
                        </div>
                    </div>

                    {/* Secondary Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <StatsCard title="Colaboradores" value={stats.uniquePeople.size} icon={BarChart3} colorClass="text-primary" />
                        <StatsCard title="Recargos" value={stats.totalHR.toFixed(1)} icon={CalendarDays} colorClass="text-primary" />
                    </div>

                    {/* Recent Activity / Table Teaser */}
                    <div className="bg-white dark:bg-card-dark rounded-2xl p-6 shadow-soft dark:shadow-md border border-slate-200 dark:border-card-border relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                         <div className="flex items-center justify-between mb-4 relative z-10">
                            <h3 className="text-base font-semibold text-slate-800 dark:text-white">Actividad Reciente</h3>
                            <button onClick={() => setCurrentView('reports')} className="text-primary text-sm font-medium hover:text-primary-dark transition-colors hover:underline shadow-black drop-shadow-sm">Ver todo</button>
                         </div>
                         <div className="space-y-4 relative z-10">
                            {records.slice(0, 3).map(rec => (
                                <div key={rec.id} className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                        <Timer className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{rec.nombre}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{rec.fecha} • {rec.horaInicio} - {rec.horaFin}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-sm font-bold text-primary drop-shadow-[0_0_8px_rgba(0,224,255,0.4)]">
                                            +{rec.cantidadHE.toFixed(1)} HE
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {records.length === 0 && <p className="text-slate-500 text-sm">No hay registros recientes.</p>}
                         </div>
                    </div>
                </div>

                {/* Floating Action Button for Mobile */}
                <div className="fixed bottom-20 right-6 z-50 md:hidden">
                    <button 
                        onClick={() => setCurrentView('form')}
                        className="flex items-center gap-2 bg-blue-metal text-white px-6 py-4 rounded-full shadow-glow transform transition hover:scale-105 active:scale-95 font-bold text-base border border-white/20"
                    >
                        <Plus className="w-6 h-6" />
                        <span>Nuevo Registro</span>
                    </button>
                </div>
            </div>
        )}

        {currentView === 'form' && (
            <div className="h-full px-4 pt-4 animate-in slide-in-from-bottom-10 duration-300">
                <div className="max-w-md mx-auto">
                    <div className="flex items-center mb-6">
                        <button onClick={() => setCurrentView('dashboard')} className="p-2 -ml-2 text-slate-400 hover:text-white">
                            <span className="material-symbols-outlined">arrow_back_ios_new</span>
                        </button>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white ml-2">Nuevo Registro</h2>
                    </div>
                    <EntryForm onAdd={handleAddRecord} />
                </div>
            </div>
        )}

        {currentView === 'reports' && (
             <div className="h-full px-4 pt-4 animate-in slide-in-from-right-10 duration-300">
                 <div className="max-w-4xl mx-auto h-full flex flex-col">
                    <div className="flex items-center mb-6">
                        <button onClick={() => setCurrentView('dashboard')} className="p-2 -ml-2 text-slate-400 hover:text-white">
                            <span className="material-symbols-outlined">arrow_back_ios_new</span>
                        </button>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white ml-2">Historial Completo</h2>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <EntryTable records={records} onDelete={handleDeleteRecord} onExport={handleExport} />
                    </div>
                 </div>
             </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION (Mobile) */}
      {/* Added h-[calc(...)] and pb-[env(...)] to handle Home Indicator on newer iPhones/Androids */}
      <div className="fixed bottom-0 left-0 w-full h-[calc(3.5rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-white dark:bg-card-dark border-t border-slate-200 dark:border-slate-800 flex justify-around items-center z-40 md:hidden backdrop-blur-lg bg-opacity-90 dark:bg-opacity-95">
        <button 
            onClick={() => setCurrentView('dashboard')}
            className={`flex flex-col items-center justify-center w-full h-full relative transition-colors ${currentView === 'dashboard' ? 'text-primary' : 'text-slate-400'}`}
        >
          {currentView === 'dashboard' && (
              <span className="absolute -top-[1px] w-8 h-[2px] bg-primary rounded-b-full shadow-[0_0_10px_rgba(0,224,255,0.8)]"></span>
          )}
          <LayoutDashboard className={`w-6 h-6 ${currentView === 'dashboard' ? 'drop-shadow-[0_0_5px_rgba(0,224,255,0.5)]' : ''}`} />
          <span className="text-[10px] font-medium mt-1">Inicio</span>
        </button>
        
        <button 
            onClick={() => setCurrentView('reports')}
            className={`flex flex-col items-center justify-center w-full h-full relative transition-colors ${currentView === 'reports' ? 'text-primary' : 'text-slate-400'}`}
        >
           {currentView === 'reports' && (
              <span className="absolute -top-[1px] w-8 h-[2px] bg-primary rounded-b-full shadow-[0_0_10px_rgba(0,224,255,0.8)]"></span>
          )}
          <CalendarDays className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">Historial</span>
        </button>

        <button 
             onClick={handleLogout}
             className="flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">Salir</span>
        </button>
      </div>

    </div>
  );
};

export default App;