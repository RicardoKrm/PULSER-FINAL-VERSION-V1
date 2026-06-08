import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Activity, Clock, Users, Building, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Badge } from '../../components/ui/Badge';
import { useCompany } from '../../contexts/CompanyContext';

interface LogEntry {
  id: string;
  company_name: string;
  company_logo?: string;
  user_name: string;
  action: string;
  module: string;
  details: string;
  created_at: string;
}

export default function LogActividad() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeCompaniesList, setActiveCompaniesList] = useState<{id: string, name: string}[]>([]);
  const [stats, setStats] = useState({
    totalActions: 0,
    activeCompanies: 0,
    activeUsers: 0
  });

  const { currentCompany } = useCompany();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      let logQuery = supabase.from('log_actividad').select(`
        id,
        accion,
        modulo,
        detalles,
        created_at,
        empresa:empresa_id (nombre),
        usuario:usuario_id (nombre)
      `).order('created_at', { ascending: false }).limit(200);

      if (currentCompany) {
        logQuery = logQuery.eq('empresa_id', currentCompany.id);
      }

      if (selectedDate) {
        const start = new Date(`${selectedDate}T00:00:00`);
        const end = new Date(`${selectedDate}T23:59:59.999`);
        logQuery = logQuery.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
      }

      // Fetch stats natively instead of from logs
      let usrQuery = supabase.from('usuario_aplicacion').select('id', { count: 'exact' });
      if (currentCompany) {
          usrQuery = usrQuery.eq('empresa_id', currentCompany.id);
      }

      const [empresaRes, usuarioRes, logRes] = await Promise.all([
        supabase.from('empresa').select('id, nombre'),
        usrQuery,
        logQuery
      ]);

      if (logRes.error) throw logRes.error;

      let fetchedCompanies = [];
      if (empresaRes.data) {
        fetchedCompanies = empresaRes.data.map(c => ({ id: c.id, name: c.nombre }));
        setActiveCompaniesList(fetchedCompanies);
      }

      const activeUsersCount = usuarioRes.count || (usuarioRes.data ? usuarioRes.data.length : 0);
      const activeCompaniesCount = empresaRes.data ? empresaRes.data.length : 0;

      if (logRes.data) {
        const mappedLogs: LogEntry[] = logRes.data.map((item: any) => ({
          id: item.id,
          company_name: item.empresa?.nombre || 'Empresa Desconocida',
          company_logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.empresa?.nombre || 'UN')}&background=0D8ABC&color=fff`,
          user_name: item.usuario?.nombre || 'Sistema',
          action: item.accion,
          module: item.modulo,
          details: item.detalles || '',
          created_at: item.created_at
        }));
        setLogs(mappedLogs);
        
        setStats({
          totalActions: mappedLogs.length,
          activeCompanies: activeCompaniesCount,
          activeUsers: activeUsersCount
        });
      }
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      // Fallback for UI if table doesn't exist yet
      setError("No se pudo cargar el registro (asegúrate de haber ejecutado el script SQL de logs).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedDate, currentCompany]);

  useEffect(() => {
    // Subscribe to realtime inserts
    const channel = supabase
      .channel('log_actividad_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'log_actividad' },
        (payload) => {
          fetchLogs(); // simple reload on new event to get joins
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getModuleIcon = (moduleName: string) => {
    switch(moduleName) {
      case 'Mantenimiento': return <ShieldAlert className="w-4 h-4 text-orange-500" />;
      case 'Operaciones': return <Activity className="w-4 h-4 text-blue-500" />;
      case 'Finanzas': return <FileText className="w-4 h-4 text-emerald-500" />;
      default: return <CheckCircle2 className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" />
          Log de Actividad en Tiempo Real
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Monitoreo global de operaciones y acciones de todas las empresas registradas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Transacciones Hoy</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalActions.toLocaleString()}</h3>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
              <Building className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Empresas Activas</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeCompanies}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Usuarios Conectados</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeUsers}</h3>
            </div>
          </div>
        </Card>
      </div>

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
            Registro Global
          </h2>
          <div className="flex items-center flex-wrap gap-4 w-full sm:w-auto">
            <input
              type="date"
              title="Filtrar por fecha"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <select
              title="Filtrar por empresa"
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
            >
              <option value="all">Todas las empresas</option>
              {activeCompaniesList.map(company => (
                <option key={company.id} value={company.name}>{company.name}</option>
              ))}
            </select>
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400 border-none flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              En vivo
            </Badge>
          </div>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
          {logs.filter(log => selectedCompany === 'all' || log.company_name === selectedCompany).map((log) => (
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
                    {new Date(log.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second:'2-digit' })}
                  </span>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{log.user_name}</span> realizo la acción <span className="font-medium">"{log.action}"</span>: {log.details}
                </p>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center">
              <Activity className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
              <p>Esperando actividad...</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
