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
      if (data) {
        setCompanies(data);
        const gaval = data.find(c => (c.nombre || '').toLowerCase().includes('gaval'));
        if (gaval) setSelectedCompanyId(gaval.id);
      } else if (error) {
        log('Error cargando empresas: ' + error.message);
      }
    });
  }, []);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const isGavalCompany = Boolean(
    selectedCompany && 
    ((selectedCompany.nombre || selectedCompany.name || '').toLowerCase().includes('gaval'))
  );

  const handleWipeInventory = async () => {
    if (!selectedCompanyId) return log('Selecciona una empresa primero');
    if (!isGavalCompany) {
      alert('⛔ ACCIÓN BLOQUEADA: Esta herramienta está estrictamente restringida a la empresa demo "Gaval".');
      return log('⛔ Operación bloqueada: Solo permitida para el demo Gaval.');
    }
    if (!window.confirm('¿Seguro que quieres BORRAR TODO EL INVENTARIO (Repuestos) del demo Gaval?')) return;
    
    setLoading(true);
    log(`Destruyendo catálogo de repuestos para el demo Gaval (${selectedCompanyId})...`);
    try {
      const { error } = await supabase.from('logistica_repuestos').delete().eq('empresa_id', selectedCompanyId);
      if (error) throw error;
      log('✅ Catálogo de inventario eliminado en Gaval. Ya puedes subir tu Excel.');
    } catch(e: any) {
      log('Error al borrar inventario: ' + e.message);
    }
    setLoading(false);
  };

  const handleWipeOts = async () => {
    if (!selectedCompanyId) return log('Selecciona una empresa primero');
    if (!isGavalCompany) {
      alert('⛔ ACCIÓN BLOQUEADA: Esta herramienta está estrictamente restringida a la empresa demo "Gaval".');
      return log('⛔ Operación bloqueada: Solo permitida para el demo Gaval.');
    }
    if (!window.confirm('¿Seguro que quieres BORRAR TODAS las OTs del demo Gaval?')) return;
    
    setLoading(true);
    log(`Borrando historial de OTs para el demo Gaval (${selectedCompanyId})...`);
    try {
      const { error } = await supabase.from('orden_de_trabajo').delete().eq('empresa_id', selectedCompanyId);
      if (error) throw error;
      log('✅ Todas las OTs de Gaval han sido eliminadas.');
      localStorage.removeItem(`pulser_ots_${selectedCompanyId}`);
    } catch(e: any) {
      log('Error al borrar OTs: ' + e.message);
    }
    setLoading(false);
  };

  const handleSeeder = async () => {
    if (!selectedCompanyId) return log('Selecciona una empresa primero');
    if (!isGavalCompany) {
      alert('⛔ ACCIÓN BLOQUEADA: Esta herramienta de sembrado está estrictamente restringida a la empresa demo "Gaval".');
      return log('⛔ Operación bloqueada: Solo permitida para el demo Gaval.');
    }
    setLoading(true);
    log(`--- INICIANDO SEMBRADO PROFUNDO RELACIONAL PARA: ${selectedCompany?.nombre} ---`);

    try {
      log('Limpiando OTs simuladas anteriores...');
      await supabase.from('orden_de_trabajo').delete().like('folio', 'OT-SIM-%').eq('empresa_id', selectedCompanyId);

      log('Cargando referencias base (vehículos, mecánicos, fallas, repuestos, tareas)...');
      
      const { data: vehiculos } = await supabase.from('vehiculo').select('id, patente, kilometraje_actual').eq('empresa_id', selectedCompanyId);
      const { data: colaboradores } = await supabase.from('colaborador').select('id, nombre, rol').eq('empresa_id', selectedCompanyId);
      const mecanicos = (colaboradores || []).filter(c => (c.rol || '').toLowerCase().includes('mecanic') || (c.rol || '').toLowerCase().includes('taller'));
      
      const { data: tiposFallaData } = await supabase.from('tipo_falla').select('id, nombre').eq('empresa_id', selectedCompanyId);
      const { data: tareasEstandarData } = await supabase.from('mantenimiento_tarea').select('id, descripcion, costo_mano_obra, tiempo_estandar_minutos').eq('empresa_id', selectedCompanyId);
      const { data: repuestosData } = await supabase.from('logistica_repuestos').select('id, nombre, precio, stock_actual').eq('empresa_id', selectedCompanyId);

      if (repuestosData && repuestosData.length > 0) {
        for (const rep of repuestosData) {
          if (!rep.precio || rep.precio <= 0) {
            rep.precio = Math.floor(Math.random() * 85000) + 15000;
          }
        }
      }

      if (!vehiculos?.length || !mecanicos?.length) {
        throw new Error('Faltan vehículos o mecánicos para generar OTs en la empresa seleccionada');
      }

      const tiposFalla = tiposFallaData?.length ? tiposFallaData : [{ id: 'sim-falla-1', nombre: 'Falla Mecánica General' }];
      const tareas = tareasEstandarData?.length ? tareasEstandarData : [{ id: 'sim-tarea-1', descripcion: 'Inspección Rutinaria', costo_mano_obra: 35000, tiempo_estandar_minutos: 90 }];
      const repuestos = repuestosData?.length ? repuestosData : [{ id: 'sim-rep-1', nombre: 'Kit Mantenimiento Preventivo', precio: 50000 }];

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
         const minsReal = tareaObj.tiempo_estandar_minutos ? Number(tareaObj.tiempo_estandar_minutos) : (Math.floor(Math.random() * 180) + 60);
         const costoHH = tareaObj.costo_mano_obra ? Number(tareaObj.costo_mano_obra) : (Math.floor(Math.random() * 120000) + 30000);
         const cantRepuestos = Math.floor(Math.random() * 3) + 1;
         const costoUnitarioRep = repuestoObj.precio ? Number(repuestoObj.precio) : 45000;
         const costoInsumos = cantRepuestos * costoUnitarioRep;

         otdsToInsert.push({
           id: otId,
           folio: `OT-SIM-${Date.now().toString().slice(-4)}-${String(i).padStart(3, '0')}`,
           vehiculo_id: veh.id,
           empresa_id: selectedCompanyId, 
           tecnico_responsable: mec.nombre,
           tipo: isPreventive ? 'PREVENTIVA' : 'CORRECTIVA', 
           estado: 'FINALIZADA', 
           prioridad: isPreventive ? 'Media' : 'Alta',
           kilometraje_apertura: Math.max(0, (veh.kilometraje_actual || 0) - (numDias - randomDayOffset) * 100),
           kilometraje_cierre: Math.max(0, (veh.kilometraje_actual || 0) - (numDias - randomDayOffset) * 100 + 10),
           fecha_creacion: randomDate.toISOString(), 
           fecha_programada: formatDt,
           hora_inicio_programada: '08:00:00',
           hora_termino_programada: '16:00:00',
           inicio_proceso: randomDate.toISOString(),
           observacion_inicial: isPreventive ? 'Mantención preventiva según pauta' : 'Falla reportada en operación',
           diagnostico_evaluacion: 'Atendido según requerimiento técnico.',
           costo_insumos: costoInsumos,
           costo_mano_obra_tareas: costoHH,
           costo_mano_obra_hh: 0,
           tiempo_trabajado_segundos: minsReal * 60,
           tipo_falla_id: (falla && !falla.id.startsWith('sim-')) ? falla.id : null,
           tipo_falla: falla ? falla.nombre : null
         });

         tareasToInsert.push({
           id: generateUUID(),
           orden_id: otId,
           tarea_estandar_id: (tareaObj && !tareaObj.id.startsWith('sim-')) ? tareaObj.id : null,
           tiempo_real_minutos: minsReal,
           costo_real: costoHH
         });

         insumosToInsert.push({
           id: generateUUID(),
           orden_id: otId,
           repuesto_id: (repuestoObj && !repuestoObj.id.startsWith('sim-')) ? repuestoObj.id : null,
           cantidad: cantRepuestos,
           costo_unitario_aplicado: costoUnitarioRep
         });
      }

      log(`Insertando ${otdsToInsert.length} OTs históricas...`);
      for (let i = 0; i < otdsToInsert.length; i += 20) {
         const { error } = await supabase.from('orden_de_trabajo').insert(otdsToInsert.slice(i, i + 20));
         if (error) throw error;
      }

      if (tareasToInsert.length > 0) {
        log(`Insertando ${tareasToInsert.length} Tareas Realizadas (Mano de Obra / HH)...`);
        for (let i = 0; i < tareasToInsert.length; i += 50) {
           const { error } = await supabase.from('ot_tareas_realizadas').insert(tareasToInsert.slice(i, i + 50));
           if (error) throw error;
        }
      }

      if (insumosToInsert.length > 0) {
        log(`Insertando ${insumosToInsert.length} Consumos de Insumos (Módulo Bodega)...`);
        for (let i = 0; i < insumosToInsert.length; i += 50) {
           const { error } = await supabase.from('detalle_insumo_ot').insert(insumosToInsert.slice(i, i + 50));
           if (error) throw error;
        }
      }

      log('Registrando log de actividad...');
      await supabase.from('log_actividad').insert([
        { modulo: 'Sistema', accion: 'Sembrado Profundo Gaval', detalles: `Se generaron OTs, Tareas e Insumos relacionales para demo Gaval.`, empresa_id: selectedCompanyId }
      ]);

      log('¡PROCESO FINALIZADO CON ÉXITO! Ve al Dashboard o al módulo de OTs y presiona F5.');
      localStorage.removeItem(`pulser_ots_${selectedCompanyId}`);

    } catch (e: any) {
      log('Error crítico en sembrado: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white dark:bg-slate-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-2">Sembrado Relacional - Demo Gaval</h1>
      <p className="mb-4 text-slate-500 text-sm">
        Generador exclusivo de datos de demostración: OTs + Tareas Realizadas (HH) + Detalle de Insumos (Bodega) + Fallas.
      </p>

      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Empresa Seleccionada:</label>
        <select 
          className="w-full p-3 border rounded text-lg font-bold" 
          value={selectedCompanyId} 
          onChange={(e) => setSelectedCompanyId(e.target.value)}
        >
           <option value="">-- SELECCIONA LA EMPRESA --</option>
           {companies.map(c => (
             <option key={c.id} value={c.id}>
               {c.nombre} {c.nombre?.toLowerCase().includes('gaval') ? '⭐ (DEMO OFICIAL)' : ''} (ID: {c.id.slice(0,8)}...)
             </option>
           ))}
        </select>
      </div>

      {!isGavalCompany && selectedCompanyId && (
        <div className="p-4 mb-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-lg text-amber-900 dark:text-amber-200 text-sm">
          🛡️ <strong>Modo Seguro Activado:</strong> La empresa seleccionada <u>no es el Demo Gaval</u>. Todas las acciones de borrado y sembrado están estrictamente deshabilitadas para proteger la integridad de los datos de empresas reales.
        </div>
      )}

      {isGavalCompany && (
        <div className="p-3 mb-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-lg text-emerald-800 dark:text-emerald-200 text-sm">
          ✅ <strong>Demo Gaval Seleccionado:</strong> Puedes inyectar OTs completas con tareas e insumos relacionales.
        </div>
      )}

      <div className="flex gap-4 mb-4">
        <button 
          onClick={handleWipeOts} 
          disabled={loading || !selectedCompanyId || !isGavalCompany} 
          className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          🔥 LIMPIAR OTs GAVAL
        </button>
        <button 
          onClick={handleWipeInventory} 
          disabled={loading || !selectedCompanyId || !isGavalCompany} 
          className="bg-orange-600 text-white px-4 py-2 rounded font-bold hover:bg-orange-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          🧹 BORRAR INVENTARIO GAVAL
        </button>
      </div>
      
      <div className="flex gap-4 mb-8">
        <button 
          onClick={handleSeeder} 
          disabled={loading || !selectedCompanyId || !isGavalCompany} 
          className="bg-emerald-600 text-white px-4 py-2 rounded font-bold hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed flex-1 shadow-lg border border-emerald-400"
        >
          {loading ? 'Inyectando matriz de datos relacionales...' : '🚀 INYECTAR MATRIZ PROFUNDA (OTs + RRHH + Insumos)'}
        </button>
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
        {logs.map((l, i) => <div key={i}>{l}</div>)}
        {!logs.length && "Esperando comandos..."}
      </div>
    </div>
  );
}
