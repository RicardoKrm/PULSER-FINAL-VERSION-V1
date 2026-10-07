import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function GavalSeeder() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const log = (msg: string) => setLogs(prev => [...prev, msg]);

  const handleBackup = async () => {
    setLoading(true);
    log('Iniciando respaldo de Gaval...');
    const gavalId = '57fa41da-645d-48ba-a671-65a35312d0e9';

    try {
      const backupData: any = {};
      
      const tables = ['vehiculo', 'colaborador', 'orden_de_trabajo', 'logistica_repuestos', 'pauta_mantenimiento', 'tarea_estandar'];
      
      for (const table of tables) {
        log(`Extrayendo tabla: ${table}...`);
        let query = supabase.from(table).select('*');
        if (table !== 'pauta_mantenimiento' && table !== 'tarea_estandar') {
           query = query.eq('empresa_id', gavalId);
        }
        
        const { data, error } = await query;
        if (error) {
          log(`Error en ${table}: ${error.message}`);
        } else {
          backupData[table] = data;
          log(`OK: ${table} (${data?.length} registros)`);
        }
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_gaval_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      log('Respaldo descargado exitosamente. Guardalo en un lugar seguro.');
    } catch (e: any) {
      log('Excepción: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white dark:bg-slate-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Herramienta de Sembrado - Gaval</h1>
      
      <div className="flex gap-4 mb-8">
        <button 
          onClick={handleBackup} 
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Procesando...' : '1. Descargar Respaldo Actual (JSON)'}
        </button>
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
        {logs.map((l, i) => <div key={i}>{l}</div>)}
        {!logs.length && "Esperando comandos..."}
      </div>
    </div>
  );
}
