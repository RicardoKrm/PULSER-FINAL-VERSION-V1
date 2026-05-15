import React, { useState } from 'react';
import { RadioReceiver, MapPin, Search, Plus, Server, Database, CheckCircle2, ShieldAlert, Key, Link as LinkIcon, RefreshCw, X, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import Swal from 'sweetalert2';

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
    id: 'fleetsat',
    name: 'FLEETSAT GPS',
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
    syncOptions: [{ label: 'Sync Costos', active: true }, { label: 'Sync Facturas', active: true }],
    lastSync: 'Hace 1 hora',
    icon: Server,
  },
  {
    id: 'softland',
    name: 'Softland ERP',
    type: 'ERP',
    description: 'Gestión contable y recursos humanos.',
    status: 'SIN_CONFIGURAR',
    syncOptions: [{ label: 'Sync Empleados', active: false }],
    lastSync: 'Nunca',
    icon: Database,
  },
];

export default function Integraciones() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isNewConnectionModalOpen, setIsNewConnectionModalOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Form states
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  // New connection states
  const [newIntegrationName, setNewIntegrationName] = useState('');
  const [newIntegrationType, setNewIntegrationType] = useState('GPS');
  const [newIntegrationDesc, setNewIntegrationDesc] = useState('');
  const [newIntegrationApiUrl, setNewIntegrationApiUrl] = useState('');
  const [newIntegrationApiKey, setNewIntegrationApiKey] = useState('');
  const [isTestingNew, setIsTestingNew] = useState(false);

  const handleToggle = (id: string, idx: number) => {
    setIntegrations(prev => prev.map(int => {
      if (int.id === id) {
        const newSync = [...int.syncOptions];
        newSync[idx].active = !newSync[idx].active;
        return { ...int, syncOptions: newSync };
      }
      return int;
    }));
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Opciones de sincronización actualizadas',
      showConfirmButton: false,
      timer: 2000
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONECTADO': return 'text-emerald-600 bg-emerald-50';
      case 'DESCONECTADO': return 'text-amber-600 bg-amber-50';
      case 'SIN_CONFIGURAR': return 'text-slate-500 bg-slate-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  const openConfig = (integration: Integration) => {
    setSelectedIntegration(integration);
    setApiUrl(integration.status !== 'SIN_CONFIGURAR' ? `https://api.${integration.id}.com/v1/` : '');
    setApiKey(integration.status !== 'SIN_CONFIGURAR' ? '••••••••••••••••••••••••••••' : '');
    setIsConfigModalOpen(true);
  };

  const testConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      Swal.fire({
        title: 'Conexión Exitosa',
        text: 'Se han validado las credenciales y el endpoint responde correctamente.',
        icon: 'success',
        confirmButtonColor: '#10b981' // emerald-500
      });
      // Optionally update status to DECONECTADO if they were SIN_CONFIGURAR to show partial progress
    }, 1500);
  };

  const handleSaveConfig = () => {
    if (!selectedIntegration) return;
    
    Swal.fire({
      title: 'Guardar Configuración',
      text: '¿Deseas aplicar estos cambios de conexión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4f46e5' // indigo-600
    }).then((result) => {
      if (result.isConfirmed) {
        setIntegrations(prev => prev.map(int => {
          if (int.id === selectedIntegration.id) {
            return { ...int, status: 'CONECTADO', lastSync: 'Recién configurado' };
          }
          return int;
        }));
        setIsConfigModalOpen(false);
        Swal.fire('Guardado', 'La integración ha sido configurada correctamente.', 'success');
      }
    });
  };

  const handleSaveNewConnection = () => {
    if (!newIntegrationName || !newIntegrationDesc || !newIntegrationApiUrl || !newIntegrationApiKey) {
      Swal.fire('Error', 'Por favor completa todos los campos requeridos para la conexión.', 'error');
      return;
    }

    const newInt: Integration = {
      id: newIntegrationName.toLowerCase().replace(/\s+/g, '-'),
      name: newIntegrationName,
      type: newIntegrationType,
      description: newIntegrationDesc,
      status: 'CONECTADO',
      syncOptions: [{ label: 'Sync Datos', active: true }],
      lastSync: 'Recién configurado',
      icon: newIntegrationType === 'GPS' ? RadioReceiver : (newIntegrationType === 'ERP' ? Server : Database),
    };

    setIntegrations(prev => [...prev, newInt]);
    setIsNewConnectionModalOpen(false);
    setNewIntegrationName('');
    setNewIntegrationType('GPS');
    setNewIntegrationDesc('');
    setNewIntegrationApiUrl('');
    setNewIntegrationApiKey('');
    
    Swal.fire('Conexión Exitosa', 'La integración ha sido conectada y guardada correctamente.', 'success');
  };

  const testNewConnection = () => {
    setIsTestingNew(true);
    setTimeout(() => {
      setIsTestingNew(false);
      Swal.fire({
        title: 'Conexión Exitosa',
        text: 'Se han validado las credenciales y el endpoint responde correctamente.',
        icon: 'success',
        confirmButtonColor: '#10b981'
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <LinkIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Integraciones & API
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Conecta el sistema operativo con proveedores GPS, plataformas ERP y sistemas corporativos.
          </p>
        </div>
        <Button onClick={() => setIsNewConnectionModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-6 rounded-xl flex items-center gap-2">
          <Plus className="w-5 h-5" /> Nueva Conexión
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <div key={integration.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col hover:shadow-lg transition-all relative overflow-hidden group">
            {/* Type badge corner */}
            <div className="absolute top-0 right-0 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-bl-xl text-[10px] font-black tracking-widest uppercase text-slate-500 dark:text-slate-400 z-10">
              {integration.type}
            </div>

            <div className="flex justify-between items-start mb-5 relative z-10">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-800 shrink-0">
                  <integration.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 pr-12">{integration.name}</h3>
                  <div className={`mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1.5 border border-transparent ${getStatusColor(integration.status)}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${integration.status === 'CONECTADO' ? 'bg-emerald-500' : integration.status === 'DESCONECTADO' ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
                    {integration.status.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6 flex-1 leading-relaxed">
              {integration.description}
            </p>

            <div className="space-y-3 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Opciones de Sincronización</h4>
              {integration.syncOptions.map((opt, idx) => (
                <div key={idx} className="flex justify-between items-center group/sync">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover/sync:text-indigo-600 dark:group-hover/sync:text-indigo-400 transition-colors">{opt.label}</span>
                  <button 
                    onClick={() => handleToggle(integration.id, idx)}
                    disabled={integration.status === 'SIN_CONFIGURAR'}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${opt.active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${opt.active ? 'translate-x-[18px]' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800 mt-auto">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                <RefreshCw className="w-3 h-3 text-slate-400" /> 
                {integration.lastSync}
              </div>
              <Button 
                variant="outline" 
                onClick={() => openConfig(integration)}
                className="text-xs font-bold h-8 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 dark:border-slate-700 dark:hover:border-indigo-500 dark:text-slate-300 dark:hover:text-indigo-400"
              >
                Configurar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Config Modal */}
      <Modal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)}
        title={selectedIntegration ? `Configurar ${selectedIntegration.name}` : 'Configurar Integración'}
      >
        {selectedIntegration && (
          <div className="space-y-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex gap-4 items-start">
               <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm shrink-0">
                  <selectedIntegration.icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
               </div>
               <div>
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-100 text-sm">Parámetros de Conexión</h4>
                  <p className="text-xs font-medium text-indigo-700/80 dark:text-indigo-300/80 mt-1 leading-relaxed">
                    Ingresa los datos proporcionados por el proveedor del servicio. Asegúrate de que las credenciales tengan permisos de lectura/escritura según el alcance requerido.
                  </p>
               </div>
            </div>

            <div className="space-y-4">
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                    Endpoint URL API
                 </label>
                 <div className="relative">
                    <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                       type="text" 
                       value={apiUrl}
                       onChange={(e) => setApiUrl(e.target.value)}
                       className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100 font-mono" 
                       placeholder="https://api.proveedor.com/v1/" 
                    />
                 </div>
              </div>

              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                    API Key / Token de Acceso
                 </label>
                 <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                       type="password" 
                       value={apiKey}
                       onChange={(e) => setApiKey(e.target.value)}
                       className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100 font-mono" 
                       placeholder="••••••••••••••••" 
                    />
                 </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
               <button 
                 type="button"
                 onClick={testConnection}
                 disabled={!apiUrl || !apiKey || isTesting}
                 className="flex-1 flex justify-center items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {isTesting ? (
                   <>
                     <RefreshCw className="w-4 h-4 animate-spin" /> Probando...
                   </>
                 ) : (
                   <>
                     <RadioReceiver className="w-4 h-4" /> Probar Conexión
                   </>
                 )}
               </button>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
               <Button variant="outline" onClick={() => setIsConfigModalOpen(false)}>Cancelar</Button>
               <Button 
                 onClick={handleSaveConfig}
                 className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-6 rounded-xl flex items-center gap-2 shadow-sm"
               >
                 <Save className="w-4 h-4" />
                 Guardar Configuración
               </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Connection Modal */}
      <Modal 
        isOpen={isNewConnectionModalOpen} 
        onClose={() => setIsNewConnectionModalOpen(false)}
        title="Crear Nueva Conexión"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                Nombre del Proveedor / Sistema
              </label>
              <div className="relative">
                <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={newIntegrationName}
                  onChange={(e) => setNewIntegrationName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100" 
                  placeholder="Ej: SAP S/4HANA" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                Tipo de Integración
              </label>
              <select 
                value={newIntegrationType}
                onChange={(e) => setNewIntegrationType(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100"
              >
                <option value="GPS">GPS / Telemetría</option>
                <option value="ERP">ERP / Finanzas</option>
                <option value="CRM">CRM / Ventas</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                Descripción
              </label>
              <textarea 
                value={newIntegrationDesc}
                onChange={(e) => setNewIntegrationDesc(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100 min-h-[80px]" 
                placeholder="Ej: Sincronización de datos mediante API externa." 
              />
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-4">Credenciales de API</h4>
              
              <div className="space-y-4">
                <div>
                   <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                      Endpoint URL API
                   </label>
                   <div className="relative">
                      <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                         type="text" 
                         value={newIntegrationApiUrl}
                         onChange={(e) => setNewIntegrationApiUrl(e.target.value)}
                         className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100 font-mono" 
                         placeholder="https://api.proveedor.com/v1/" 
                      />
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                      API Key / Token de Acceso
                   </label>
                   <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                         type="password" 
                         value={newIntegrationApiKey}
                         onChange={(e) => setNewIntegrationApiKey(e.target.value)}
                         className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100 font-mono" 
                         placeholder="••••••••••••••••" 
                      />
                   </div>
                </div>
              </div>
              
              <div className="pt-5 flex items-center gap-3">
                 <button 
                   type="button"
                   onClick={testNewConnection}
                   disabled={!newIntegrationApiUrl || !newIntegrationApiKey || isTestingNew}
                   className="w-full flex justify-center items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                 >
                   {isTestingNew ? (
                     <>
                       <RefreshCw className="w-4 h-4 animate-spin" /> Probando...
                     </>
                   ) : (
                     <>
                       <RadioReceiver className="w-4 h-4" /> Probar Conexión
                     </>
                   )}
                 </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
             <Button variant="outline" onClick={() => setIsNewConnectionModalOpen(false)}>Cancelar</Button>
             <Button 
               onClick={handleSaveNewConnection}
               className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-6 rounded-xl flex items-center gap-2 shadow-sm"
             >
               <Plus className="w-4 h-4" />
               Crear Conexión
             </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

