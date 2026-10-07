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
        if (table !== 'pauta_mantenimiento' && table !== 'tarea_estandar') query = query.eq('empresa_id', gavalId);
        const { data } = await query;
        backupData[table] = data || [];
        log(`OK: ${table} (${backupData[table].length} registros)`);
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_gaval_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      log('Respaldo descargado exitosamente.');
    } catch (e: any) {
      log('Excepción: ' + e.message);
    }
    setLoading(false);
  };

  const handleSeeder = async () => {
    if(!window.confirm("¿Estás 100% seguro? Ya deberías tener tu archivo backup descargado. Esto inyectará decenas de OTs en Gaval.")) return;
    setLoading(true);
    log('--- INICIANDO SEMBRADO CRONOLÓGICO PARA GAVAL ---');
    const gavalId = '57fa41da-645d-48ba-a671-65a35312d0e9';

    try {
      // 1. Obtener insumos
      log('Cargando vehículos...');
      const { data: vehiculos } = await supabase.from('vehiculo').select('id, patente, kilometraje_actual').eq('empresa_id', gavalId);
      log(`Vehículos obtenidos: ${vehiculos?.length}`);

      log('Cargando mecánicos...');
      const { data: colaboradores } = await supabase.from('colaborador').select('id, nombre, rol').eq('empresa_id', gavalId);
      const mecanicos = (colaboradores || []).filter(c => (c.rol || '').toLowerCase().includes('mecanic') || (c.rol || '').toLowerCase().includes('taller'));
      log(`Mecánicos obtenidos: ${mecanicos.length}`);

      if (!vehiculos?.length || !mecanicos?.length) {
        throw new Error('Faltan vehículos o mecánicos para generar OTs');
      }

      const generateUUID = () => crypto.randomUUID();

      // Fechas desde Enero 2026 a Hoy
      const startDate = new Date('2026-01-01T08:00:00');
      const today = new Date();
      const numDias = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
      
      let otdsToInsert: any[] = [];
      let totalCostos = 0;

      log('Generando historial OTs...');
      
      // Vamos a generar unas 80-120 OTs repartidas en este tiempo
      const otCount = 100;
      for (let i = 0; i < otCount; i++) {
         const randomDayOffset = Math.floor(Math.random() * numDias);
         const randomDate = new Date(startDate);
         randomDate.setDate(startDate.getDate() + randomDayOffset);
         
         const veh = vehiculos[Math.floor(Math.random() * vehiculos.length)];
         const mec = mecanicos[Math.floor(Math.random() * mecanicos.length)];

         const isPreventive = Math.random() > 0.4; // 60% prev, 40% correct
         const costoInsumos = Math.floor(Math.random() * 450000) + 50000; // 50k - 500k
         const costoHH = Math.floor(Math.random() * 200000) + 30000; // 30k - 230k

         const formatDt = randomDate.toISOString().slice(0,10);

         otdsToInsert.push({
           id: generateUUID(),
           folio: `OT-GAV-${String(i+1000).padStart(4, '0')}`,
           vehiculo_id: veh.id,
           empresa_id: gavalId,
           tecnico_responsable: mec.nombre,
           tipo: isPreventive ? 'PREVENTIVA_MANTENCION' : 'CORRECTIVA',
           estado: 'TERMINADA',
           prioridad: isPreventive ? 'Media' : 'Alta',
           kilometraje_apertura: (veh.kilometraje_actual || 0) - (numDias - randomDayOffset) * 100, // simular km pasado
           kilometraje_cierre: (veh.kilometraje_actual || 0) - (numDias - randomDayOffset) * 100 + 10,
           fecha_creacion: formatDt,
           fecha_programada: formatDt,
           hora_inicio_programada: '08:00:00',
           hora_termino_programada: '16:00:00',
           inicio_proceso: randomDate.toISOString(),
           observacion_inicial: isPreventive ? 'Mantención de rutina simulada' : 'Falla reportada en terreno simulada',
           diagnostico_evaluacion: 'Equipos revisados y piezas ajustadas.',
           costo_insumos: costoInsumos,
           costo_mano_obra_tareas: 0,
           costo_mano_obra_hh: costoHH,
           tiempo_trabajado_segundos: 28800 // 8 horas
         });

         totalCostos += costoInsumos + costoHH;
      }

      log(`Insertando ${otdsToInsert.length} OTs históricas...`);
      // Chunk insertions due to Supabase limits
      const chunkSize = 20;
      for (let i = 0; i < otdsToInsert.length; i += chunkSize) {
         const chunk = otdsToInsert.slice(i, i + chunkSize);
         const { error } = await supabase.from('orden_de_trabajo').insert(chunk);
         if (error) throw error;
         log(`Insertado chunk ${i/chunkSize + 1} / ${Math.ceil(otdsToInsert.length/chunkSize)}`);
      }

      log('Registrando actividades (Log)...');
      await supabase.from('log_actividad').insert([
        { modulo: 'Sistema', accion: 'Sembrado de Datos', detalles: `Se generaron ${otCount} OTs y un histórico de $${totalCostos} simulados`, empresa_id: gavalId }
      ]);

      log('¡PROCESO FINALIZADO CON ÉXITO! Todos los dashboards y KPIs de Gaval ahora tienen vida.');

    } catch (e: any) {
      log('Error crítico en sembrado: ' + e.message);
      console.error(e);
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
          className="bg-slate-600 text-white px-4 py-2 rounded font-bold hover:bg-slate-700 disabled:opacity-50"
        >
          1. Descargar Respaldo Actual
        </button>
        <button 
          onClick={handleSeeder} 
          disabled={loading}
          className="bg-emerald-600 text-white px-4 py-2 rounded font-bold hover:bg-emerald-700 disabled:opacity-50 flex-1 shadow-lg border border-emerald-400"
        >
          {loading ? 'Inyectando datos...' : '2. 🚀 INYECTAR DATOS HISTÓRICOS (Ene-Oct 2026)'}
        </button>
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
        {logs.map((l, i) => <div key={i}>{l}</div>)}
        {!logs.length && "Esperando comandos..."}
      </div>
    </div>
  );
}
