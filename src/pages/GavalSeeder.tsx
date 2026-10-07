import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';

export default function GavalSeeder() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { activeCompanyId } = useAppContext();

  const log = (msg: string) => setLogs(prev => [...prev, msg]);

  const getTargetCompany = () => {
     // Si es super admin y está viendo "GLOBAL", no podemos sembrar a ciegas.
     // Usamos el fallback original solo en el peor de los casos
     if (!activeCompanyId || activeCompanyId === 'GLOBAL') {
        return '57fa41da-645d-48ba-a671-65a35312d0e9';
     }
     return activeCompanyId;
  };

  const handleBackup = async () => {
    setLoading(true);
    const targetId = getTargetCompany();
    log(`Iniciando respaldo para empresa: ${targetId}...`);

    try {
      const backupData: any = {};
      const tables = ['vehiculo', 'colaborador', 'orden_de_trabajo', 'logistica_repuestos'];
      for (const table of tables) {
        log(`Extrayendo tabla: ${table}...`);
        const { data } = await supabase.from(table).select('*').eq('empresa_id', targetId);
        backupData[table] = data || [];
        log(`OK: ${table} (${backupData[table].length} registros)`);
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_empresa_${targetId}_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      log('Respaldo descargado exitosamente.');
    } catch (e: any) {
      log('Excepción: ' + e.message);
    }
    setLoading(false);
  };

  const handleSeeder = async () => {
    setLoading(true);
    const targetId = getTargetCompany();
    log(`--- INICIANDO SEMBRADO CRONOLÓGICO PARA EMPRESA: ${targetId} ---`);

    try {
      log('Limpiando OTs simuladas anteriores...');
      await supabase.from('orden_de_trabajo').delete().like('folio', 'OT-GAV-%').eq('empresa_id', targetId);

      log('Cargando vehículos...');
      const { data: vehiculos } = await supabase.from('vehiculo').select('id, patente, kilometraje_actual').eq('empresa_id', targetId);
      log(`Vehículos obtenidos: ${vehiculos?.length}`);

      log('Cargando mecánicos...');
      const { data: colaboradores } = await supabase.from('colaborador').select('id, nombre, rol').eq('empresa_id', targetId);
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
           empresa_id: targetId, // <-- AQUÍ USAMOS EL ID REAL AL QUE ESTÁS CONECTADO
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
        { modulo: 'Sistema', accion: 'Sembrado de Datos', detalles: `Se generaron ${otCount} OTs simuladas`, empresa_id: targetId }
      ]);

      log('¡PROCESO FINALIZADO CON ÉXITO! Ve a tu pestaña de incógnito y presiona F5.');
      localStorage.removeItem(`pulser_ots_${targetId}`);

    } catch (e: any) {
      log('Error crítico en sembrado: ' + e.message);
      console.error(e);
    }

    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white dark:bg-slate-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Herramienta de Sembrado Dinámica</h1>
      <p className="mb-4 text-slate-500">ID de Empresa Activa: <strong>{getTargetCompany()}</strong></p>
      
      <div className="flex gap-4 mb-8">
        <button 
          onClick={handleBackup} 
          disabled={loading}
          className="bg-slate-600 text-white px-4 py-2 rounded font-bold hover:bg-slate-700 disabled:opacity-50"
        >
          1. Descargar Respaldo Actual
        </button>
        <button 
          onClick={handleSeeder} 
          disabled={loading}
          className="bg-emerald-600 text-white px-4 py-2 rounded font-bold hover:bg-emerald-700 disabled:opacity-50 flex-1 shadow-lg border border-emerald-400"
        >
          {loading ? 'Inyectando datos...' : '2. 🚀 INYECTAR DATOS EN LA EMPRESA SELECCIONADA'}
        </button>
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
        {logs.map((l, i) => <div key={i}>{l}</div>)}
        {!logs.length && "Esperando comandos..."}
      </div>
    </div>
  );
}
