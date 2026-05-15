import React, { useState } from 'react';
import { RadioReceiver, MapPin, Search, Plus, Server, Database, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  type: string;
  description: string;
  status: 'CONECTADO' | 'DESCONECTADO' | 'SIN_CONFIGURAR';
  syncOptions: {
    label: string;
    active: boolean;
  }[];
  lastSync: string;
  icon: React.ElementType;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'samtech',
    name: 'Samtech GPS',
    type: 'GPS',
    description: 'Sincronización de ubicación y odómetro en tiempo real.',
    status: 'CONECTADO',
    syncOptions: [{ label: 'Sync Odómetros (Auto)', active: true }],
    lastSync: 'Hace 5 min',
    icon: RadioReceiver,
  },
  {
    id: 'geotab',
    name: 'Geotab',
    type: 'GPS',
    description: 'Telemetría avanzada y hábitos de conducción.',
    status: 'DESCONECTADO',
    syncOptions: [{ label: 'Sync Odómetros (Auto)', active: false }],
    lastSync: 'Hace 2 días',
    icon: RadioReceiver,
  },
  {
    id: 'sap',
    name: 'SAP S/4HANA',
    type: 'ERP',
    description: 'Sincronización de costos de mantenimiento y órdenes de compra.',
    status: 'CONECTADO',
    syncOptions: [{ label: 'Sync Costos', active: true }],
    lastSync: 'Hace 1 hora',
    icon: Server,
  },
  {
    id: 'softland',
    name: 'Softland ERP',
    type: 'ERP',
    description: 'Gestión contable y recursos humanos.',
    status: 'SIN_CONFIGURAR',
    syncOptions: [{ label: 'Sync Costos', active: false }],
    lastSync: 'Nunca',
    icon: Database,
  },
];

export default function Integraciones() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);

  const handleToggle = (id: string, idx: number) => {
    setIntegrations(prev => prev.map(int => {
      if (int.id === id) {
        const newSync = [...int.syncOptions];
        newSync[idx].active = !newSync[idx].active;
        return { ...int, syncOptions: newSync };
      }
      return int;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONECTADO': return 'text-emerald-600 bg-emerald-50';
      case 'DESCONECTADO': return 'text-amber-600 bg-amber-50';
      case 'SIN_CONFIGURAR': return 'text-slate-500 bg-slate-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Integraciones & Conectores</h1>
          <p className="text-slate-500 mt-1">Conecta el sistema con GPS, ERPs y sistemas externos para automatizar el flujo de datos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <div key={integration.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <integration.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">{integration.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{integration.type}</span>
                </div>
              </div>
              <div className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${getStatusColor(integration.status)}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${integration.status === 'CONECTADO' ? 'bg-emerald-500' : integration.status === 'DESCONECTADO' ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
                {integration.status.replace('_', ' ')}
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 flex-1">
              {integration.description}
            </p>

            <div className="space-y-3 mb-6">
              {integration.syncOptions.map((opt, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{opt.label}</span>
                  <button 
                    onClick={() => handleToggle(integration.id, idx)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${opt.active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${opt.active ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700">
              <span className="text-xs text-slate-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {integration.lastSync}</span>
              <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Configurar</button>
            </div>
          </div>
        ))}

        <button className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors h-full min-h-[280px]">
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-bold text-slate-700 dark:text-slate-200 mb-1">Nueva Conexión</span>
          <span className="text-xs text-center">Agregar API personalizada o Webhook</span>
        </button>
      </div>
    </div>
  );
}
