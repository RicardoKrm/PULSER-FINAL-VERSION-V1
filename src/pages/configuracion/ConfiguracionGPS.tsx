import React, { useState, useEffect } from 'react';
import { Settings, Save, MapPin, Truck, RefreshCw, CheckCircle2, Server, Key, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { cn } from '@/lib/utils';

export default function ConfiguracionGPS() {
  const { activeCompanyId } = useCompany();
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  
  // Simulated Global API Keys State
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (activeCompanyId) {
      fetchVehicles();
      // Simulating fetching global API keys
      const savedKeys = localStorage.getItem(`gps_api_keys_${activeCompanyId}`);
      if (savedKeys) {
        setApiKeys(JSON.parse(savedKeys));
      }
    }
  }, [activeCompanyId]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehiculo')
        .select('id, patente, marca, modelo, detalles')
        .eq('empresa_id', activeCompanyId);
      
      if (!error && data) {
        setVehiculos(data.map(v => ({
          ...v,
          gps_proveedor: v.detalles?.gps_proveedor || '',
          gps_imei: v.detalles?.gps_imei || ''
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVehicleConfig = async (veh: any) => {
    setSaving(veh.id);
    try {
      const currentDetails = veh.detalles || {};
      const updatedDetails = {
        ...currentDetails,
        gps_proveedor: veh.gps_proveedor,
        gps_imei: veh.gps_imei,
      };

      await supabase
        .from('vehiculo')
        .update({ detalles: updatedDetails })
        .eq('id', veh.id);

      setTimeout(() => setSaving(null), 1000); // feedback
    } catch (e) {
      console.error(e);
      setSaving(null);
    }
  };

  const saveApiKeys = () => {
    if (activeCompanyId) {
      localStorage.setItem(`gps_api_keys_${activeCompanyId}`, JSON.stringify(apiKeys));
      alert('Credenciales de API guardadas exitosamente.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold border-b border-slate-200 dark:border-slate-800 pb-4 text-slate-800 dark:text-white flex items-center gap-3">
              <MapPin className="w-6 h-6 text-indigo-500" />
              Integración GPS y Telemetría
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Configura las credenciales de proveedores GPS y asocia dispositivos (IMEI/ID) a tus vehículos para sincronizar el kilometraje y paneles operativos en tiempo real.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Global API Config Panel */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Server className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  <h2 className="font-bold text-slate-800 dark:text-white">Conexiones Globales</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 block">TrackSolid Pro (API Key)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="password"
                          value={apiKeys.tracksolid || ''}
                          onChange={e => setApiKeys(prev => ({...prev, tracksolid: e.target.value}))}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Token de acceso..."
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 block">Wialon (Token)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="password"
                          value={apiKeys.wialon || ''}
                          onChange={e => setApiKeys(prev => ({...prev, wialon: e.target.value}))}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Token de acceso..."
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 block">Traccar (URL Servidor)</label>
                    <input 
                      type="text"
                      value={apiKeys.traccar_url || ''}
                      onChange={e => setApiKeys(prev => ({...prev, traccar_url: e.target.value}))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="https://mi-traccar.com/api"
                    />
                  </div>
                  <button onClick={saveApiKeys} className="w-full flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm mt-2">
                    <Save className="w-4 h-4" /> Guardar Credenciales
                  </button>
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-5">
                 <h3 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Sincronización</h3>
                 <p className="text-sm text-indigo-700/80 dark:text-indigo-400/80 mb-3">La información de odómetro (Km) y ubicación se nutrirá directamente desde estas APIs cada 5 minutos hacia los paneles operativos y de mantenimiento.</p>
              </div>
            </div>

            {/* Vehicles Map Configuration */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col">
                 <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                    <h2 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white"><Truck className="w-5 h-5 text-slate-400" /> Vehículos y Dispositivos</h2>
                    <span className="text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">{vehiculos.length} Unidades</span>
                 </div>
                 
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
                             <th className="p-3 font-semibold w-1/4">Vehículo</th>
                             <th className="p-3 font-semibold w-1/4">Proveedor</th>
                             <th className="p-3 font-semibold w-1/3">IMEI / ID Dispositivo</th>
                             <th className="p-3 font-semibold text-center w-1/6">Acción</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {loading ? (
                             <tr><td colSpan={4} className="text-center p-8 text-slate-500">Cargando vehículos...</td></tr>
                          ) : vehiculos.length === 0 ? (
                             <tr><td colSpan={4} className="text-center p-8 text-slate-500">No hay vehículos registrados en la flota.</td></tr>
                          ) : (
                             vehiculos.map(v => (
                                <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                   <td className="p-3">
                                      <div className="font-bold text-slate-800 dark:text-slate-200">{v.patente}</div>
                                      <div className="text-xs text-slate-500">{v.marca} {v.modelo}</div>
                                   </td>
                                   <td className="p-3">
                                      <select 
                                         value={v.gps_proveedor}
                                         onChange={(e) => {
                                            const updated = vehiculos.map(veh => veh.id === v.id ? { ...veh, gps_proveedor: e.target.value } : veh);
                                            setVehiculos(updated);
                                         }}
                                         className="w-full bg-transparent border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-200"
                                      >
                                         <option value="">-- Sin asignar --</option>
                                         <option value="tracksolid">TrackSolid Pro</option>
                                         <option value="wialon">Wialon</option>
                                         <option value="traccar">Traccar</option>
                                         <option value="samsara">Samsara</option>
                                      </select>
                                   </td>
                                   <td className="p-3">
                                      <input 
                                         type="text" 
                                         value={v.gps_imei}
                                         onChange={(e) => {
                                            const updated = vehiculos.map(veh => veh.id === v.id ? { ...veh, gps_imei: e.target.value } : veh);
                                            setVehiculos(updated);
                                         }}
                                         placeholder="Ej. 865123045..."
                                         className="w-full bg-transparent border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-200"
                                      />
                                   </td>
                                   <td className="p-3 text-center">
                                      <button 
                                         onClick={() => handleSaveVehicleConfig(v)}
                                         disabled={saving === v.id}
                                         className={cn(
                                            "inline-flex items-center justify-center p-1.5 rounded-lg transition-colors w-9 h-9",
                                            saving === v.id ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : 
                                            (v.gps_proveedor || v.gps_imei) ? "bg-indigo-100 hover:bg-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 dark:text-indigo-400" :
                                            "bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400"
                                         )}
                                      >
                                         {saving === v.id ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                                      </button>
                                   </td>
                                </tr>
                             ))
                          )}
                       </tbody>
                    </table>
                 </div>
                 {vehiculos.some(v => !v.gps_proveedor || !v.gps_imei) && vehiculos.length > 0 && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 text-xs font-medium flex items-center gap-2 border-t border-orange-100 dark:border-orange-800/30">
                       <AlertCircle className="w-4 h-4 shrink-0" /> Hay vehículos sin configuración GPS definida, no reportarán datos a la plataforma.
                    </div>
                 )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
