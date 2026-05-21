import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Activity, Clock, Users, Building, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Badge } from '../../components/ui/Badge';

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
  const [stats, setStats] = useState({
    totalActions: 0,
    activeCompanies: 0,
    activeUsers: 0
  });

  useEffect(() => {
    // Mock inicial de la base de datos de actividad
    const mockDb: LogEntry[] = [
      { id: '1', company_name: 'Minera Los Andes', company_logo: 'https://ui-avatars.com/api/?name=ML&background=0D8ABC&color=fff', user_name: 'Juan Pérez', action: 'Creó OT', module: 'Mantenimiento', details: 'OT-2023-001 generada para equipo CAT-793', created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
      { id: '2', company_name: 'Transportes Global', company_logo: 'https://ui-avatars.com/api/?name=TG&background=F7703D&color=fff', user_name: 'María Silva', action: 'Creó Reserva', module: 'Operaciones', details: 'Reserva R-098 confirmada origen Stgo destino Valpo', created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
      { id: '3', company_name: 'Minera Los Andes', company_logo: 'https://ui-avatars.com/api/?name=ML&background=0D8ABC&color=fff', user_name: 'Carlos Gómez', action: 'Aprobó Factura', module: 'Finanzas', details: 'Factura #9901 aprobada por $1.5M', created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
      { id: '4', company_name: 'EcoLogistics', company_logo: 'https://ui-avatars.com/api/?name=EL&background=2DD4BF&color=fff', user_name: 'Ana Rojas', action: 'Completó Ruta', module: 'Operaciones', details: 'Ruta Santiago-Concepción finalizada sin novedades', created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
    ];

    setStats({
      totalActions: mockDb.length + 1204, // Un número base de acciones para dar contexto
      activeCompanies: 3,
      activeUsers: 45
    });

    setLogs(mockDb);
    setLoading(false);

    // Simular el ingreso de nuevas actividades en tiempo real
    const interval = setInterval(() => {
      const newAction = {
        id: Math.random().toString(),
        company_name: 'Transportes Global',
        company_logo: 'https://ui-avatars.com/api/?name=TG&background=F7703D&color=fff',
        user_name: 'Sistema Automatizado',
        action: 'Alerta GPS',
        module: 'Flota',
        details: 'Exceso de velocidad registrado en Patente AB-CD-12',
        created_at: new Date().toISOString()
      };
      setLogs(prev => [newAction, ...prev]);
      setStats(prev => ({ ...prev, totalActions: prev.totalActions + 1 }));
    }, 12000); // Se añade un nuevo evento cada 12 segundos para que se vea el efecto en vivo

    return () => clearInterval(interval);
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

      <Card className="p-0 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-500" />
            Registro Global
          </h2>
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400 border-none flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            En vivo
          </Badge>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
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
