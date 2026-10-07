import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';

export default function GavalSeeder() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  const log = (msg: string) => setLogs(prev => [...prev, msg]);

  useEffect(() => {
    // Fetch all companies to avoid blind fallback IDs
    supabase.from('empresa').select('id, nombre').then(({ data, error }) => {
      if (data) {
        setCompanies(data);
      } else if (error) {
         log('Error cargando empresas: ' + error.message);
      }
    });
  }, []);

  const handleBackup = async () => {
    if (!selectedCompanyId) return log('Selecciona una empresa primero');
    setLoading(true);
    log(`Iniciando respaldo para empresa: ${selectedCompanyId}...`);

    try {
      const backupData: any = {};
      const tables = ['vehiculo', 'colaborador', 'orden_de_trabajo', 'logistica_repuestos'];
      for (const table of tables) {
        log(`Extrayendo tabla: ${table}...`);
        const { data } = await supabase.from(table).select('*').eq('empresa_id', selectedCompanyId);
        backupData[table] = data || [];
        log(`OK: ${table} (${backupData[table].length} registros)`);
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const compName = companies.find(c => c.id === selectedCompanyId)?.nombre || 'empresa';
      a.download = `backup_${compName}_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      log('Respaldo descargado exitosamente.');
    } catch (e: any) {
      log('Excepción: ' + e.message);
    }
    setLoading(false);
  };

  const handleSeeder = async () => {
    if (!selectedCompanyId) return log('Selecciona una empresa primero');
    setLoading(true);
    log(`--- INICIANDO SEMBRADO CRONOLÓGICO PARA EMPRESA: ${selectedCompanyId} ---`);

    try {
      log('Limpiando OTs simuladas anteriores...');
      await supabase.from('orden_de_trabajo').delete().like('folio', 'OT-GAV-%').eq('empresa_id', selectedCompanyId);

      log('Cargando vehículos...');
      const { data: vehiculos } = await supabase.from('vehiculo').select('id, patente, kilometraje_actual').eq('empresa_id', selectedCompanyId);
      log(`Vehículos obtenidos: ${vehiculos?.length}`);

      log('Cargando mecánicos...');
      const { data: colaboradores } = await supabase.from('colaborador').select('id, nombre, rol').eq('empresa_id', selectedCompanyId);
      const mecanicos = (colaboradores || []).filter(c => (c.rol || '').toLowerCase().includes('mecanic') || (c.rol || '').toLowerCase().includes('taller'));
      log(`Mecánicos obtenidos: ${mecanicos.length}`);

      if (!vehiculos?.length || !mecanicos?.length) {
        throw new Error('Faltan vehículos o mecánicos en la empresa seleccionada para generar OTs');
      }

      const generateUUID = () => crypto.randomUUID();

      const startDate = new Date('2026-01-01T08:00:00');
      const today = new Date();
      const numDias = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
      
      let otdsToInsert: any[] = [];
      let totalCostos = 0;

      log('Generando historial OTs...');
      
      const otCount = 100;
      for (let i = 0; i < otCount; i++) {
         const randomDayOffset = Math.floor(Math.random() * numDias);
         const randomDate = new Date(startDate);
         randomDate.setDate(startDate.getDate() + randomDayOffset);
         
         const veh = vehiculos[Math.floor(Math.random() * vehiculos.length)];
         const mec = mecanicos[Math.floor(Math.random() * mecanicos.length)];

         const isPreventive = Math.random() > 0.4;
         const costoInsumos = Math.floor(Math.random() * 450000) + 50000;
         const costoHH = Math.floor(Math.random() * 200000) + 30000;
         const formatDt = randomDate.toISOString().slice(0,10);

         otdsToInsert.push({
           id: generateUUID(),
           folio: `OT-GAV-${String(i+1000).padStart(4, '0')}`,
           vehiculo_id: veh.id,
           empresa_id: selectedCompanyId, 
           tecnico_responsable: mec.nombre,
           tipo: isPreventive ? 'PREVENTIVA' : 'CORRECTIVA', 
           estado: 'FINALIZADA', 
           prioridad: isPreventive ? 'Media' : 'Alta',
           kilometraje_apertura: (veh.kilometraje_actual || 0) - (numDias - randomDayOffset) * 100,
           kilometraje_cierre: (veh.kilometraje_actual || 0) - (numDias - randomDayOffset) * 100 + 10,
           fecha_creacion: randomDate.toISOString(), 
           fecha_programada: formatDt,
           hora_inicio_programada: '08:00:00',
           hora_termino_programada: '16:00:00',
           inicio_proceso: randomDate.toISOString(),
           observacion_inicial: isPreventive ? 'Mantención de rutina simulada' : 'Falla reportada en terreno simulada',
           diagnostico_evaluacion: 'Equipos revisados y piezas ajustadas.',
           costo_insumos: costoInsumos,
           costo_mano_obra_tareas: 0,
           costo_mano_obra_hh: costoHH,
           tiempo_trabajado_segundos: 28800 
         });

         totalCostos += costoInsumos + costoHH;
      }

      log(`Insertando ${otdsToInsert.length} OTs históricas...`);
      const chunkSize = 20;
      for (let i = 0; i < otdsToInsert.length; i += chunkSize) {
         const chunk = otdsToInsert.slice(i, i + chunkSize);
         const { error } = await supabase.from('orden_de_trabajo').insert(chunk);
         if (error) {
           log(`Error insertando chunk: ${error.message}`);
           throw error;
         }
         log(`Insertado chunk ${i/chunkSize + 1} / ${Math.ceil(otdsToInsert.length/chunkSize)}`);
      }

      log('Registrando actividades (Log)...');
      await supabase.from('log_actividad').insert([
        { modulo: 'Sistema', accion: 'Sembrado de Datos', detalles: `Se generaron ${otCount} OTs simuladas`, empresa_id: selectedCompanyId }
      ]);

      log('¡PROCESO FINALIZADO CON ÉXITO! Ve a tu pestaña de incógnito y presiona F5.');
      localStorage.removeItem(`pulser_ots_${selectedCompanyId}`);

    } catch (e: any) {
      log('Error crítico en sembrado: ' + e.message);
      console.error(e);
    }

    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white dark:bg-slate-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Herramienta de Sembrado Definitiva</h1>
      <p className="mb-4 text-slate-500">Selecciona la empresa exacta donde inyectarás los datos:</p>
      
      <div className="mb-6">
        <select 
          className="w-full p-3 border rounded text-lg font-bold"
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
        >
           <option value="">-- SELECCIONA LA EMPRESA --</option>
           {companies.map(c => (
              <option key={c.id} value={c.id}>{c.nombre} (ID: {c.id.slice(0,8)}...)</option>
           ))}
        </select>
      </div>

      <div className="flex gap-4 mb-8">
        <button 
          onClick={handleBackup} 
          disabled={loading || !selectedCompanyId}
          className="bg-slate-600 text-white px-4 py-2 rounded font-bold hover:bg-slate-700 disabled:opacity-50"
        >
          1. Descargar Respaldo Actual
        </button>
        <button 
          onClick={handleSeeder} 
          disabled={loading || !selectedCompanyId}
          className="bg-emerald-600 text-white px-4 py-2 rounded font-bold hover:bg-emerald-700 disabled:opacity-50 flex-1 shadow-lg border border-emerald-400"
        >
          {loading ? 'Inyectando datos...' : '2. 🚀 INYECTAR DATOS'}
        </button>
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
        {logs.map((l, i) => <div key={i}>{l}</div>)}
        {!logs.length && "Esperando comandos..."}
      </div>
    </div>
  );
}
