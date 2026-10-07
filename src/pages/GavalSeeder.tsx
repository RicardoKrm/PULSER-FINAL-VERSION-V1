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
    supabase.from('empresa').select('id, nombre').then(({ data, error }) => {
      if (data) setCompanies(data);
      else if (error) log('Error cargando empresas: ' + error.message);
    });
  }, []);

  const handleWipeOts = async () => {
    if (!selectedCompanyId) return log('Selecciona una empresa primero');
    if (!window.confirm('¿Seguro que quieres BORRAR TODAS las OTs de esta empresa? Esto liberará el inventario para que puedas subir tu Excel limpio.')) return;
    
    setLoading(true);
    log(Borrando historial de OTs para la empresa: ...);
    try {
      const { error } = await supabase.from('orden_de_trabajo').delete().eq('empresa_id', selectedCompanyId);
      if (error) throw error;
      log('✅ Todas las OTs han sido eliminadas. Ahora puedes borrar tu inventario viejo y subir el Excel.');
      localStorage.removeItem(pulser_ots_);
    } catch(e: any) {
      log('Error al borrar OTs: ' + e.message);
    }
    setLoading(false);
  };

  const handleSeeder = async () => {
    if (!selectedCompanyId) return log('Selecciona una empresa primero');
    setLoading(true);
    log(`--- INICIANDO SEMBRADO PROFUNDO (v3) PARA: ${selectedCompanyId} ---`);

    try {
      log('Limpiando OTs simuladas anteriores...');
      await supabase.from('orden_de_trabajo').delete().like('folio', 'OT-SIM-%').eq('empresa_id', selectedCompanyId);

      log('Cargando referencias base (vehículos, mecánicos, fallas, repuestos, tareas)...');
      
      const { data: vehiculos } = await supabase.from('vehiculo').select('id, patente, kilometraje_actual').eq('empresa_id', selectedCompanyId);
      const { data: colaboradores } = await supabase.from('colaborador').select('id, nombre, rol').eq('empresa_id', selectedCompanyId);
      const mecanicos = (colaboradores || []).filter(c => (c.rol || '').toLowerCase().includes('mecanic') || (c.rol || '').toLowerCase().includes('taller'));
      
      // Intentar obtener catálogo de fallas, tareas y repuestos para vincular
      const { data: tiposFallaData } = await supabase.from('tipo_falla').select('id, nombre').eq('empresa_id', selectedCompanyId);
      const { data: tareasEstandarData } = await supabase.from('tarea_estandar').select('id, descripcion').eq('empresa_id', selectedCompanyId);
      
      const { data: repuestosData } = await supabase.from('logistica_repuestos').select('id, nombre, costo_unitario').eq('empresa_id', selectedCompanyId);

      if (repuestosData && repuestosData.length > 0) {
          const updates = [];
          for (const rep of repuestosData) {
              if (!rep.costo_unitario || rep.costo_unitario <= 0) {
                  const randomPrice = Math.floor(Math.random() * 85000) + 15000;
                  updates.push({ id: rep.id, costo_unitario: randomPrice });
                  rep.costo_unitario = randomPrice;
              }
          }
          if (updates.length > 0) {
              log(`Fijando valor referencial a ${updates.length} repuestos que no tenían precio...`);
              const updatePromises = updates.map(u => supabase.from('logistica_repuestos').update({ costo_unitario: u.costo_unitario }).eq('id', u.id));
              await Promise.all(updatePromises);
          }
      }


      if (!vehiculos?.length || !mecanicos?.length) {
        throw new Error('Faltan vehículos o mecánicos para generar OTs');
      }

      // Fallbacks si no hay maestros creados
      const tiposFalla = tiposFallaData?.length ? tiposFallaData : [{ id: 'sim-falla-1', nombre: 'Falla Mecánica Simulada' }];
      const tareas = tareasEstandarData?.length ? tareasEstandarData : [{ id: 'sim-tarea-1', descripcion: 'Inspección General Simulada' }];
      const repuestos = repuestosData?.length ? repuestosData : [{ id: 'sim-rep-1', nombre: 'Kit Mantenimiento Simulado', costo_unitario: 50000 }];

      const generateUUID = () => crypto.randomUUID();

      const startDate = new Date('2026-01-01T08:00:00');
      const today = new Date();
      const numDias = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
      
      let otdsToInsert: any[] = [];
      let tareasToInsert: any[] = [];
      let insumosToInsert: any[] = [];

      log('Generando matriz de datos (OTs + Tareas + Insumos)...');
      
      const otCount = 100;
      for (let i = 0; i < otCount; i++) {
         const randomDayOffset = Math.floor(Math.random() * numDias);
         const randomDate = new Date(startDate);
         randomDate.setDate(startDate.getDate() + randomDayOffset);
         
         const veh = vehiculos[Math.floor(Math.random() * vehiculos.length)];
         const mec = mecanicos[Math.floor(Math.random() * mecanicos.length)];
         const isPreventive = Math.random() > 0.4;
         const falla = isPreventive ? null : tiposFalla[Math.floor(Math.random() * tiposFalla.length)];
         const tareaObj = tareas[Math.floor(Math.random() * tareas.length)];
         const repuestoObj = repuestos[Math.floor(Math.random() * repuestos.length)];

         const formatDt = randomDate.toISOString().slice(0,10);
         const otId = generateUUID();
         const costoHH = Math.floor(Math.random() * 200000) + 30000;
         const cantRepuestos = Math.floor(Math.random() * 3) + 1;
         const costoUnitarioRep = repuestoObj.costo_unitario || 45000;
         const costoInsumos = cantRepuestos * costoUnitarioRep;
         const minsReal = Math.floor(Math.random() * 180) + 60; // 1 a 4 horas

         // 1. Crear OT
         otdsToInsert.push({
           id: otId,
           folio: `OT-SIM-${Date.now().toString().slice(-4)}-${String(i).padStart(3, '0')}`,
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
           observacion_inicial: isPreventive ? 'Mantención preventiva rutinaria' : 'Falla reportada en operación',
           diagnostico_evaluacion: 'Atendido según pauta.',
           costo_insumos: costoInsumos,
           costo_mano_obra_tareas: costoHH,
           costo_mano_obra_hh: 0,
           tiempo_trabajado_segundos: minsReal * 60,
           tipo_falla_id: (falla && !falla.id.startsWith('sim-')) ? falla.id : null,
           tipo_falla: falla ? falla.nombre : null
         });

         // 2. Crear Tarea Realizada (Productividad / RRHH)
         if (!tareaObj.id.startsWith('sim-')) {
            tareasToInsert.push({
              id: generateUUID(),
              orden_id: otId,
              tarea_estandar_id: tareaObj.id,
              tiempo_real_minutos: minsReal,
              costo_real: costoHH
            });
         }

         // 3. Crear Consumo de Insumo (Bodega / Logística)
         if (!repuestoObj.id.startsWith('sim-')) {
            insumosToInsert.push({
              id: generateUUID(),
              orden_id: otId,
              repuesto_id: repuestoObj.id,
              cantidad: cantRepuestos,
              costo_unitario_aplicado: costoUnitarioRep,
              costo_total: costoInsumos
            });
         }
      }

      log(`Insertando ${otdsToInsert.length} OTs históricas...`);
      for (let i = 0; i < otdsToInsert.length; i += 20) {
         const { error } = await supabase.from('orden_de_trabajo').insert(otdsToInsert.slice(i, i + 20));
         if (error) throw error;
      }

      if (tareasToInsert.length > 0) {
        log(`Insertando ${tareasToInsert.length} Tareas Realizadas (Módulo RRHH)...`);
        for (let i = 0; i < tareasToInsert.length; i += 50) {
           const { error } = await supabase.from('ot_tareas_realizadas').insert(tareasToInsert.slice(i, i + 50));
           if (error) throw error;
        }
      }

      if (insumosToInsert.length > 0) {
        log(`Insertando ${insumosToInsert.length} Consumos Insumos (Módulo Bodega)...`);
        for (let i = 0; i < insumosToInsert.length; i += 50) {
           const { error } = await supabase.from('detalle_insumo_ot').insert(insumosToInsert.slice(i, i + 50));
           if (error) throw error;
        }
      }

      log('Registrando actividades...');
      await supabase.from('log_actividad').insert([
        { modulo: 'Sistema', accion: 'Sembrado Profundo', detalles: `Se generaron OTs, Tareas y Repuestos en matriz.`, empresa_id: selectedCompanyId }
      ]);

      log('¡PROCESO FINALIZADO CON ÉXITO! Ve a tu pestaña de incógnito y presiona F5.');
      localStorage.removeItem(`pulser_ots_${selectedCompanyId}`);

    } catch (e: any) {
      log('Error crítico en sembrado: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white dark:bg-slate-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-2">Sembrado Profundo (v3) - Relacional</h1>
      <p className="mb-4 text-slate-500 text-sm">Ahora inyecta OTs + Análisis de Fallas + Horas Reales (RRHH) + Movimiento Insumos</p>
      
      <div className="mb-6">
        <select className="w-full p-3 border rounded text-lg font-bold" value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value)}>
           <option value="">-- SELECCIONA LA EMPRESA --</option>
           {companies.map(c => <option key={c.id} value={c.id}>{c.nombre} (ID: {c.id.slice(0,8)}...)</option>)}
        </select>
      </div>

      <div className="flex gap-4 mb-8">
        <button onClick={handleWipeOts} disabled={loading || !selectedCompanyId} className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 disabled:opacity-50">
          🔥 LIMPIAR OTs ANTIGUAS
        </button>
        <button onClick={handleSeeder} disabled={loading || !selectedCompanyId} className="bg-emerald-600 text-white px-4 py-2 rounded font-bold hover:bg-emerald-700 disabled:opacity-50 flex-1 shadow-lg border border-emerald-400">
          {loading ? 'Inyectando matriz de datos...' : '🚀 INYECTAR MATRIZ PROFUNDA (OTs + RRHH + Fallas)'}
        </button>
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
        {logs.map((l, i) => <div key={i}>{l}</div>)}
        {!logs.length && "Esperando comandos..."}
      </div>
    </div>
  );
}

