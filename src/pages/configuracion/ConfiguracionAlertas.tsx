import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Bell, Save, ShieldAlert, FileText, Settings2 } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import Swal from 'sweetalert2';

export default function ConfiguracionAlertas() {
  const { currentCompany } = useCompany();
  
  const [config, setConfig] = useState({
    diasAvisoLicencia: 15,
    diasAvisoSalud: 15,
    diasAvisoRevision: 30,
    diasAvisoSeguro: 30
  });

  useEffect(() => {
    if (currentCompany?.id) {
      const saved = localStorage.getItem(`config_alertas_${currentCompany.id}`);
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    }
  }, [currentCompany?.id]);

  const handleSave = () => {
    if (currentCompany?.id) {
      localStorage.setItem(`config_alertas_${currentCompany.id}`, JSON.stringify(config));
      Swal.fire('Guardado', 'La configuración de alertas ha sido actualizada', 'success');
    }
  };

  return (
    <div className="p-6 w-full max-w-[1600px] mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Settings2 className="w-8 h-8 text-indigo-500" />
            Configuración de Alertas
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Define con cuántos días de anticipación el sistema debe marcar un documento como "Próximo a Vencer" (Ámbar).
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm"
        >
          <Save className="w-4 h-4" />
          Guardar Cambios
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
              <FileText className="w-5 h-5 text-emerald-500" />
              Documentos de Conductores
            </CardTitle>
            <p className="text-sm text-slate-500">Días de pre-aviso antes del vencimiento real</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Licencia de Conducir
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={config.diasAvisoLicencia}
                  onChange={(e) => setConfig({ ...config, diasAvisoLicencia: Number(e.target.value) })}
                  className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium outline-none text-slate-900 dark:text-white"
                />
                <span className="text-sm text-slate-500">días antes</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Examen de Salud
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={config.diasAvisoSalud}
                  onChange={(e) => setConfig({ ...config, diasAvisoSalud: Number(e.target.value) })}
                  className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium outline-none text-slate-900 dark:text-white"
                />
                <span className="text-sm text-slate-500">días antes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
              <ShieldAlert className="w-5 h-5 text-blue-500" />
              Documentos de Vehículos
            </CardTitle>
            <p className="text-sm text-slate-500">Días de pre-aviso antes del vencimiento real</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Revisión Técnica
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={config.diasAvisoRevision}
                  onChange={(e) => setConfig({ ...config, diasAvisoRevision: Number(e.target.value) })}
                  className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium outline-none text-slate-900 dark:text-white"
                />
                <span className="text-sm text-slate-500">días antes</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Seguro Obligatorio
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={config.diasAvisoSeguro}
                  onChange={(e) => setConfig({ ...config, diasAvisoSeguro: Number(e.target.value) })}
                  className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium outline-none text-slate-900 dark:text-white"
                />
                <span className="text-sm text-slate-500">días antes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


