import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Activity, Clock, Users, Building, ShieldAlert, FileText, CheckCircle2, ChevronDown, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Badge } from '../../components/ui/Badge';

interface LogEntry {
  id: string;
  company_id: string;
  company_name: string;
  company_logo?: string;
  user_id: string;
  user_name: string;
  action: string;
  module: string;
  details: string;
  created_at: string;
}

interface UserSession {
  user_id: string;
  user_name: string;
  company_name: string;
  first_action: Date;
  last_action: Date;
  action_count: number;
  modules_visited: Set<string>;
}

export default function LogActividad() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState('all');
  
  // Default to today
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local
  );
  
  const [activeCompaniesList, setActiveCompaniesList] = useState<{id: string, name: string}[]>([]);
  
  const [showUsersPanel, setShowUsersPanel] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate start and end bounds based on local date string
      // If user clears the date input, default to today
      const safeDate = selectedDate || new Date().toLocaleDateString('en-CA');
      const start = new Date(`${safeDate}T00:00:00`);
      const end = new Date(`${safeDate}T23:59:59.999`);

      // We remove the currentCompany filter here because the Super Admin should see everything globally.
      let logQuery = supabase.from('log_actividad').select(`
        id,
        accion,
        modulo,
        detalles,
        created_at,
        empresa_id,
        empresa:empresa_id (nombre),
        usuario_id,
        usuario:usuario_id (nombre)
      `)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000); // Increased limit to ensure we capture a full day's session data for stats

      if (selectedCompany !== 'all') {
        logQuery = logQuery.eq('empresa_id', selectedCompany);
      }

      const [empresaRes, logRes] = await Promise.all([
        supabase.from('empresa').select('id, nombre').order('nombre'),
        logQuery
      ]);

      if (logRes.error) throw logRes.error;

      if (empresaRes.data) {
        setActiveCompaniesList(empresaRes.data.map(c => ({ id: c.id, name: c.nombre })));
      }

      if (logRes.data) {
        const mappedLogs: LogEntry[] = logRes.data.map((item: any) => ({
          id: item.id,
          company_id: item.empresa_id,
          company_name: item.empresa?.nombre || 'Empresa Desconocida',
          company_logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.empresa?.nombre || 'UN')}&background=0D8ABC&color=fff`,
          user_id: item.usuario_id,
          user_name: item.usuario?.nombre || 'Sistema',
          action: item.accion,
          module: item.modulo,
          details: item.detalles || '',
          created_at: item.created_at
        }));
        setLogs(mappedLogs);
        
        // Calculate Sessions / Users Activity from the logs
        const sessionsMap = new Map<string, UserSession>();
        
        mappedLogs.forEach(log => {
          if (!log.user_id) return;
          const logTime = new Date(log.created_at);
          if (sessionsMap.has(log.user_id)) {
            const sess = sessionsMap.get(log.user_id)!;
            if (logTime < sess.first_action) sess.first_action = logTime;
            if (logTime > sess.last_action) sess.last_action = logTime;
            sess.action_count++;
            if (log.module) sess.modules_visited.add(log.module);
          } else {
            sessionsMap.set(log.user_id, {
              user_id: log.user_id,
              user_name: log.user_name,
              company_name: log.company_name,
              first_action: logTime,
              last_action: logTime,
              action_count: 1,
              modules_visited: new Set(log.module ? [log.module] : [])
            });
          }
        });

        setActiveSessions(Array.from(sessionsMap.values()).sort((a, b) => b.last_action.getTime() - a.last_action.getTime()));
      }
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      setError("No se pudo cargar el registro (asegúrate de haber ejecutado el script SQL de logs).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedDate, selectedCompany]);

  // Optionally subscribe to realtime if the date is today
  useEffect(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    if (selectedDate !== todayStr) return; // Don't real-time update past dates

    const channel = supabase
      .channel('log_actividad_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'log_actividad' },
        (payload) => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate, selectedCompany]);

  const getModuleIcon = (moduleName: string) => {
    switch(moduleName) {
      case 'Mantenimiento': return <ShieldAlert className="w-4 h-4 text-orange-500" />;
      case 'Operaciones': return <Activity className="w-4 h-4 text-blue-500" />;
      case 'Finanzas': return <FileText className="w-4 h-4 text-emerald-500" />;
      default: return <CheckCircle2 className="w-4 h-4 text-slate-500" />;
    }
  };
  
  // Format duration
  const getDurationString = (start: Date, end: Date) => {
    const diffMins = Math.round((end.getTime() - start.getTime()) / 60000);
    if (diffMins === 0) return 'Menos de 1 min';
    if (diffMins < 60) return `${diffMins} min`;
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Trazabilidad y Auditoría
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Monitoreo global de operaciones y acciones de todas las empresas registradas.
          </p>
        </div>
        
        <div className="flex items-center flex-wrap gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 px-3 border-r border-slate-200 dark:border-slate-800">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              title="Filtrar por fecha"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="py-1.5 text-sm bg-transparent text-slate-900 dark:text-white outline-none font-semibold cursor-pointer"
            />
          </div>
          <select
            title="Filtrar por empresa"
            className="px-3 py-1.5 text-sm bg-transparent text-slate-900 dark:text-white outline-none font-semibold cursor-pointer"
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            <option value="all">Todas las empresas</option>
            {activeCompaniesList.map(company => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Transacciones ({selectedDate})</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{logs.length.toLocaleString()}</h3>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
              <Building className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Empresas con Actividad</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {new Set(logs.map(l => l.company_id)).size}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden relative cursor-pointer hover:ring-2 ring-purple-500 transition-all" onClick={() => setShowUsersPanel(!showUsersPanel)}>
          <div className="p-6 flex justify-between items-center h-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Usuarios Activos</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{activeSessions.length}</h3>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showUsersPanel ? 'rotate-180' : ''}`} />
          </div>
        </Card>
      </div>
      
      {/* Detalle de Usuarios Activos */}
      {showUsersPanel && (
        <Card className="p-0 overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4">
           <div className="bg-purple-50 dark:bg-purple-900/20 p-4 border-b border-purple-100 dark:border-purple-800/50 flex items-center gap-2">
             <Users className="w-5 h-5 text-purple-600" />
             <h3 className="font-bold text-purple-900 dark:text-purple-100">Desglose de Conexiones ({selectedDate})</h3>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                 <tr>
                   <th className="p-3 text-xs font-bold text-slate-500 uppercase">Usuario</th>
                   <th className="p-3 text-xs font-bold text-slate-500 uppercase">Empresa</th>
                   <th className="p-3 text-xs font-bold text-slate-500 uppercase">Módulos Visitados</th>
                   <th className="p-3 text-xs font-bold text-slate-500 uppercase">1ra Acción</th>
                   <th className="p-3 text-xs font-bold text-slate-500 uppercase">Última Acción</th>
                   <th className="p-3 text-xs font-bold text-slate-500 uppercase">Tiempo Activo</th>
                   <th className="p-3 text-xs font-bold text-slate-500 uppercase text-right">Cant. Transacciones</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {activeSessions.map(sess => (
                   <tr key={sess.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                     <td className="p-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{sess.user_name}</td>
                     <td className="p-3 text-sm text-slate-600 dark:text-slate-400">{sess.company_name}</td>
                     <td className="p-3 text-sm">
                       <div className="flex flex-wrap gap-1">
                         {Array.from(sess.modules_visited).map(mod => (
                           <Badge key={mod} variant="outline" className="text-[10px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                             {mod}
                           </Badge>
                         ))}
                       </div>
                     </td>
                     <td className="p-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                       {sess.first_action.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })} - {sess.first_action.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                     </td>
                     <td className="p-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                       {sess.last_action.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })} - {sess.last_action.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                     </td>
                     <td className="p-3 text-sm font-medium text-purple-600 dark:text-purple-400">{getDurationString(sess.first_action, sess.last_action)}</td>
                     <td className="p-3 text-sm font-bold text-slate-900 dark:text-slate-100 text-right">{sess.action_count}</td>
                   </tr>
                 ))}
                 {activeSessions.length === 0 && (
                   <tr>
                     <td colSpan={7} className="p-8 text-center text-slate-500">No hay actividad registrada en esta fecha.</td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </Card>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-xl text-red-600 dark:text-red-400">
          <p className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            {error}
          </p>
        </div>
      )}

      <Card className="p-0 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-500" />
            Registro Global Detallado
          </h2>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {selectedDate === new Date().toLocaleDateString('en-CA') && (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400 border-none flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                En vivo
              </Badge>
            )}
          </div>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
          {loading ? (
             <div className="p-12 text-center flex flex-col items-center gap-4">
               <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-slate-500">Cargando registros de la fecha...</p>
             </div>
          ) : (
            <>
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {log.company_logo ? (
                    <img src={log.company_logo} alt={log.company_name} className="w-10 h-10 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <Building className="w-5 h-5 text-slate-500" />
                    </div>
                  )}

                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1 gap-2">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{log.company_name}</span>
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold text-slate-500 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center gap-1">
                          {getModuleIcon(log.module)}
                          {log.module}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium whitespace-nowrap">
                        {new Date(log.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })} - {new Date(log.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second:'2-digit' })}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{log.user_name}</span> realizó la acción <span className="font-medium">"{log.action}"</span>: {log.details}
                    </p>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                  <Activity className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                  <p>No se encontraron actividades registradas para esta fecha o empresa.</p>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
