import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, logActividad } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { useSyncOdometers } from '../hooks/useSyncOdometers';
import Swal from 'sweetalert2';
import { ReservaTurismo, Conductor, Vehiculo, OrdenDeTrabajo, PautaMantenimiento, TareaEstandar, TipoFalla, KitRepuesto, Usuario, Proveedor, Collaborator, Repuesto, SolicitudRepuesto } from '../types';

interface AppContextType {
  reservasTurismo: ReservaTurismo[];
  ordenesTrabajo: OrdenDeTrabajo[];
  conductores: Conductor[];
  vehiculos: Vehiculo[];
  pautas: PautaMantenimiento[];
  tareasEstandar: TareaEstandar[];
  tiposFalla: TipoFalla[];
  kitsRepuesto: KitRepuesto[];
  repuestos: Repuesto[];
  setRepuestos?: (repuestos: Repuesto[]) => void;
  usuarios: Usuario[];
  currentUser: Usuario;
  setCurrentUser: (usuario: Usuario) => void;
  proveedores: Proveedor[];
  personal: Collaborator[];
  setPersonal: (personal: Collaborator[]) => void;
  crearReservaTurismo: (reserva: ReservaTurismo) => void;
  crearOrdenTrabajo: (ot: OrdenDeTrabajo) => void;
  eliminarOrdenTrabajo: (id: string, skipConfirm?: boolean) => Promise<void>;
  recargarOrdenesTrabajo: () => Promise<void>;
  actualizarOrdenTrabajo: (ot: OrdenDeTrabajo) => void;
  crearTipoFalla: (tipoFalla: TipoFalla) => void;
  eliminarTipoFalla: (id: string) => void;
  actualizarTipoFalla?: (tipoFalla: TipoFalla) => void;
  crearKitRepuesto: (kit: KitRepuesto) => void;
  eliminarKitRepuesto: (id: string) => void;
  crearProveedor: (proveedor: Proveedor) => void;
  eliminarProveedor: (id: string) => void;
  agregarTareaEstandar?: (tarea: TareaEstandar) => void;
}

const getStorageKeyOTs = (empresaId?: string | null) =>
  empresaId ? `pulser_ordenes_trabajo_${empresaId}` : 'pulser_ordenes_trabajo';

const loadLocalOTs = (empresaId?: string | null): OrdenDeTrabajo[] => {
  try {
    if (empresaId) {
      const cached = localStorage.getItem(getStorageKeyOTs(empresaId));
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed.filter((o: any) => !o.empresa_id || o.empresa_id === empresaId);
      }
      return [];
    }
    const cached = localStorage.getItem('pulser_ordenes_trabajo');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

const saveLocalOTs = (ots: OrdenDeTrabajo[], empresaId?: string | null) => {
  try {
    if (empresaId) {
      localStorage.setItem(getStorageKeyOTs(empresaId), JSON.stringify(ots));
    } else {
      localStorage.setItem('pulser_ordenes_trabajo', JSON.stringify(ots));
    }
  } catch (e) {}
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const { activeCompanyId } = useCompany();
  const [reservasTurismo] = useState<ReservaTurismo[]>([]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenDeTrabajo[]>(() => loadLocalOTs(activeCompanyId));
  const [conductores] = useState<Conductor[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [pautas, setPautas] = useState<PautaMantenimiento[]>([]);
  const [tareasEstandar, setTareasEstandar] = useState<TareaEstandar[]>([]);
  const [tiposFalla, setTiposFalla] = useState<TipoFalla[]>([]);
  const [kitsRepuesto, setKitsRepuesto] = useState<KitRepuesto[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [currentUser, setCurrentUser] = useState<Usuario>({ id: 'u4', nombre: 'Admin Usuario', cargo: 'Súper Administrador' });
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [personal, setPersonal] = useState<Collaborator[]>([]);

  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);

  // Activa la sincronización del GPS en background cada vez que exista una compañía activa
  useSyncOdometers(activeCompanyId, setVehiculos);

  const generateUUID = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const sincronizarYRecargarOTs = React.useCallback(async (companyId: string) => {
    if (!companyId) return [];

    try {
      // 1. Obtener vehículos con mantención registrada previa
      const { data: vehsData } = await supabase.from('vehiculo').select('*').eq('empresa_id', companyId);
      let { data: otsData } = await supabase.from('orden_de_trabajo').select('*').eq('empresa_id', companyId);

      // 2. Si hay vehículos con km_ultima_mantencion > 0 que no tengan OT creada, generarles su OT inicial de línea base
      if (vehsData && Array.isArray(vehsData)) {
        const vehsConMant = vehsData.filter(v => {
          const rawKm = v.km_ultima_mantencion !== undefined ? v.km_ultima_mantencion : (v.detalles?.km_ultima_mantencion !== undefined ? v.detalles.km_ultima_mantencion : 0);
          const km = typeof rawKm === 'number' ? rawKm : parseFloat(String(rawKm).replace(/[^0-9.-]+/g, '')) || 0;
          return km > 0;
        });

        const existingVehOts = new Set((otsData || []).map(o => String(o.vehiculo_id)));
        const vehsMissingOT = vehsConMant.filter(v => !existingVehOts.has(String(v.id)));

        if (vehsMissingOT.length > 0) {
          const newOtsToInsert = vehsMissingOT.map(v => {
            const rawKm = v.km_ultima_mantencion !== undefined ? v.km_ultima_mantencion : (v.detalles?.km_ultima_mantencion !== undefined ? v.detalles.km_ultima_mantencion : 0);
            const km = typeof rawKm === 'number' ? rawKm : parseFloat(String(rawKm).replace(/[^0-9.-]+/g, '')) || 0;
            const rawFecha = v.fecha_ultima_mantencion || v.fecha_ult_mantencion || v.detalles?.fecha_ultima_mantencion || new Date().toISOString();
            const pautaNombre = v.tipo_ultimo_mant || v.tipo_ult_pauta || v.detalles?.tipo_ultimo_mant || v.detalles?.tipo_ult_pauta || 'Mantenimiento Preventivo Inicial';
            const numInt = v.numero_interno || v.patente || '01';

            return {
              id: generateUUID(),
              empresa_id: companyId,
              vehiculo_id: v.id,
              folio: `OT-INI-${numInt}`,
              tipo: 'PREVENTIVA',
              estado: 'FINALIZADA',
              prioridad: 'NORMAL',
              kilometraje_apertura: km,
              kilometraje_cierre: km,
              fecha_creacion: typeof rawFecha === 'string' ? rawFecha : new Date(rawFecha).toISOString(),
              fecha_programada: typeof rawFecha === 'string' ? rawFecha : new Date(rawFecha).toISOString(),
              inicio_proceso: typeof rawFecha === 'string' ? rawFecha : new Date(rawFecha).toISOString(),
              termino_proceso: typeof rawFecha === 'string' ? rawFecha : new Date(rawFecha).toISOString(),
              pauta: pautaNombre,
              observacion_inicial: `Línea Base: Mantención ${pautaNombre} registrada a los ${km.toLocaleString('es-CL')} km.`,
              observaciones: 'Orden de trabajo generada automáticamente para trazabilidad y línea base histórica.',
              costo_insumos: 0,
              costo_mano_obra_tareas: 0,
              costo_mano_obra_hh: 0,
              tiempo_trabajado_segundos: 0
            };
          });

          try {
            const { error: insErr } = await supabase.from('orden_de_trabajo').insert(newOtsToInsert);
            if (insErr) {
              console.warn("Aviso al insertar OTs iniciales en Supabase:", insErr);
            }
          } catch (e) {
            console.warn("Excepción al insertar OTs iniciales:", e);
          }

          otsData = [...(otsData || []), ...newOtsToInsert];
        }
      }

      if (otsData) {
        let tareasAll: any[] = [];
        let insumosAll: any[] = [];
        let historialAll: any[] = [];
        let solicitudesAll: any[] = [];

        try {
          const { data: tData } = await supabase.from('ot_tareas_realizadas').select('*');
          if (tData) tareasAll = tData;
        } catch (e) {
          console.warn("Error loading ot_tareas_realizadas:", e);
        }

        try {
          const { data: iData } = await supabase.from('detalle_insumo_ot').select('*');
          if (iData) insumosAll = iData;
        } catch (e) {
          console.warn("Error loading detalle_insumo_ot:", e);
        }

        try {
          const { data: hData } = await supabase.from('historial_ot').select('*').order('created_at', { ascending: true });
          if (hData) historialAll = hData;
        } catch (e) {
          console.warn("Error loading historial_ot:", e);
        }

        try {
          const { data: sData } = await supabase.from('solicitud_repuesto_ot').select('*').order('created_at', { ascending: true });
          if (sData) solicitudesAll = sData;
        } catch (e) {
          console.warn("Error loading solicitud_repuesto_ot:", e);
        }

        const mappedDbOts = otsData.map(row => {
          const otId = row.id;

          const otTareas = tareasAll
            .filter((t: any) => t.orden_id === otId)
            .map((t: any) => ({
              id: t.id,
              orden_id: t.orden_id,
              tarea_estandar_id: t.tarea_estandar_id,
              tiempo_real_minutos: Number(t.tiempo_real_minutos || 0),
              costo_real: Number(t.costo_real || 0),
              tarea_estandar: t.tarea_estandar || {
                id: t.tarea_estandar_id,
                descripcion: 'Tarea',
                costoManoObra: Number(t.costo_real || 0)
              }
            }));

          const otInsumos = insumosAll
            .filter((i: any) => i.orden_id === otId)
            .map((i: any) => ({
              id: i.id,
              orden_id: i.orden_id,
              repuesto_id: i.repuesto_id,
              cantidad: Number(i.cantidad || 0),
              costo_unitario_aplicado: Number(i.costo_unitario_aplicado || i.costo_unitario || 0),
              costo_total: Number(i.costo_total || i.cantidad * (i.costo_unitario_aplicado || i.costo_unitario || 0) || 0),
              repuesto: i.repuesto || {
                id: i.repuesto_id,
                nombre: 'Repuesto/Insumo',
                costo_unitario: Number(i.costo_unitario_aplicado || i.costo_unitario || 0)
              }
            }));

          const otHistorial = historialAll
            .filter((h: any) => h.orden_id === otId)
            .map((h: any) => ({
              id: h.id,
              orden_id: h.orden_id,
              usuario_nombre: h.usuario_nombre || 'Sistema',
              comentario: h.comentario || '',
              created_at: h.created_at || h.fecha_evento || new Date().toISOString()
            }));

          const otSolicitudes: SolicitudRepuesto[] = solicitudesAll
            .filter((s: any) => s.orden_id === otId)
            .map((s: any) => ({
              id: s.id,
              orden_id: s.orden_id,
              repuesto_id: s.repuesto_id,
              repuesto_nombre: s.repuesto_nombre,
              cantidad: Number(s.cantidad || 0),
              estado: s.estado || 'PENDIENTE',
              fecha_solicitud: s.fecha_solicitud || s.created_at || new Date().toISOString(),
              created_at: s.created_at || new Date().toISOString(),
              usuario_nombre: s.usuario_nombre || 'Mecánico',
              motivo_rechazo: s.motivo_rechazo || ''
            }));

          return {
            id: row.id,
            folio: row.folio,
            empresa_id: row.empresa_id,
            empresaId: row.empresa_id,
            vehiculoId: row.vehiculo_id,
            tecnicoResponsable: row.tecnico_responsable || undefined,
            responsable_id: row.responsable_id || undefined,
            tecnico_tipo: row.tecnico_tipo || undefined,
            externo_nombre: row.externo_nombre || undefined,
            externo_especialidad: row.externo_especialidad || undefined,
            externo_intervencion: row.externo_intervencion || undefined,
            tipo: row.tipo as any,
            estado: row.estado as any,
            prioridad: row.prioridad as any,
            inicio_proceso: row.inicio_proceso || undefined,
            kilometrajeApertura: Number(row.kilometraje_apertura || 0),
            kilometrajeCierre: row.kilometraje_cierre ? Number(row.kilometraje_cierre) : undefined,
            fechaCreacion: row.fecha_creacion,
            fechaProgramada: row.fecha_programada || undefined,
            horaInicioProgramada: row.hora_inicio_programada || undefined,
            horaTerminoProgramada: row.hora_termino_programada || undefined,
            observacionInicial: row.observacion_inicial || undefined,
            diagnosticoEvaluacion: row.diagnostico_evaluacion || undefined,
            pauta: row.pauta || undefined,
            pauta_mantenimiento_id: row.pauta_mantenimiento_id || undefined,
            kitRepuestos: row.kit_repuestos || undefined,
            tipoFalla: row.tipo_falla || undefined,
            sintomas: row.sintomas || undefined,
            inspeccionTrenMotriz: row.inspeccion_tren_motriz || undefined,
            eje: row.eje || undefined,
            presionNeumatico: row.presion_neumatico ? Number(row.presion_neumatico) : undefined,
            personalOperativo: row.personal_operativo || undefined,
            proveedor: row.proveedor || undefined,
            empresaExterna: row.empresa_externa || undefined,
            rutEmpresa: row.rut_empresa || undefined,
            valorHH: row.valor_hh ? Number(row.valor_hh) : undefined,
            presupuestoAprobado: row.presupuesto_aprobado ? Number(row.presupuesto_aprobado) : undefined,
            observaciones: row.observaciones || undefined,
            costoInsumos: Number(row.costo_insumos || 0),
            costoManoObraTareas: Number(row.costo_mano_obra_tareas || 0),
            costoManoObraHH: Number(row.costo_mano_obra_hh || 0),
            tiempoTrabajadoSegundos: Number(row.tiempo_trabajado_segundos || 0),
            tareasRealizadas: otTareas,
            insumos: otInsumos,
            historial: otHistorial,
            solicitudes: otSolicitudes
          } as OrdenDeTrabajo;
        });

        const localOTs = loadLocalOTs(companyId);
        const merged: OrdenDeTrabajo[] = [...mappedDbOts];
        localOTs.forEach(lot => {
          if ((!lot.empresa_id || lot.empresa_id === companyId) && !merged.some(m => m.id === lot.id || (lot.folio && m.folio === lot.folio))) {
            merged.push(lot);
          }
        });

        // Also sync with server-side persistent endpoint if available
        try {
          const resp = await fetch(`/api/flota/ordenes?empresa_id=${companyId}`);
          if (resp.ok) {
            const serverOts = await resp.json();
            if (Array.isArray(serverOts) && serverOts.length > 0) {
              serverOts.forEach((s: any) => {
                if (s.empresa_id === companyId && !merged.some(u => u.id === s.id || (s.folio && u.folio === s.folio))) {
                  merged.push(s);
                }
              });
            }
          }
        } catch (e) {}

        setOrdenesTrabajo(merged);
        saveLocalOTs(merged, companyId);
        return merged;
      } else {
        const localOTs = loadLocalOTs(companyId);
        setOrdenesTrabajo(localOTs);
        return localOTs;
      }
    } catch (err) {
      console.error("Error sincronizando y recargando órdenes de trabajo:", err);
      const localOTs = loadLocalOTs(companyId);
      setOrdenesTrabajo(localOTs);
      return localOTs;
    }
  }, []);

  const recargarOrdenesTrabajo = React.useCallback(async () => {
    if (activeCompanyId) {
      await sincronizarYRecargarOTs(activeCompanyId);
    }
  }, [activeCompanyId, sincronizarYRecargarOTs]);

  const fetchAllData = React.useCallback(async () => {
    if (!activeCompanyId) {
      setOrdenesTrabajo([]);
      setVehiculos([]);
      setPautas([]);
      setTareasEstandar([]);
      setTiposFalla([]);
      setKitsRepuesto([]);
      setProveedores([]);
      setPersonal([]);
      setRepuestos([]);
      return;
    }

    const loadData = async () => {
      // Immediately reset previous company's data to ensure clean isolation
      setVehiculos([]);
      setPautas([]);
      setTareasEstandar([]);
      setTiposFalla([]);
      setKitsRepuesto([]);
      setProveedores([]);
      setPersonal([]);
      setRepuestos([]);
      setOrdenesTrabajo(loadLocalOTs(activeCompanyId));

      const pageSize = 1000;
      // Fetch Tareas
      let allTareasData: any[] = [];
      let startT = 0;
      let hasMoreTareas = true;
      while (hasMoreTareas) {
        const { data } = await supabase.from('mantenimiento_tarea').select('*').eq('empresa_id', activeCompanyId).range(startT, startT + pageSize - 1);
        if (data && data.length > 0) {
          allTareasData = [...allTareasData, ...data];
          startT += pageSize;
        } else {
          hasMoreTareas = false;
        }
      }
      setTareasEstandar(allTareasData.map(t => ({
          id: t.id, 
          descripcion: t.descripcion, 
          tiempoEstandarMinutos: t.tiempo_estandar_minutos, 
          costoManoObra: t.costo_mano_obra 
      })));

      // Fetch Tipos Falla
      let allFallasData: any[] = [];
      let hasMoreFallas = true;
      let startF = 0;
      
      while (hasMoreFallas) {
        const { data } = await supabase
          .from('tipo_falla')
          .select('*')
          .eq('empresa_id', activeCompanyId)
          .range(startF, startF + pageSize - 1);
          
        if (data && data.length > 0) {
          allFallasData = [...allFallasData, ...data];
          if (data.length < pageSize) {
            hasMoreFallas = false;
          } else {
            startF += pageSize;
          }
        } else {
          hasMoreFallas = false;
        }
      }
      
      if (allFallasData.length > 0) {
        setTiposFalla(allFallasData.map(f => ({ 
           id: f.id, 
           nombre: f.nombre || f.descripcion, 
           descripcion: f.descripcion,
           modelo_afectado: f.modelo_afectado,
           criticidad: f.criticidad,
           causa: f.causa,
           tfs_predeterminado_horas: Number(f.tfs_predeterminado_horas)
        } as any)));
      } else {
        setTiposFalla([]);
      }

      // Fetch Vehiculos
      const { data: vehiculosData } = await supabase.from('vehiculo').select('*').eq('empresa_id', activeCompanyId);
      if (vehiculosData && Array.isArray(vehiculosData)) {
        setVehiculos(vehiculosData.map(v => {
          const detalles = v.detalles || {};
          let rawMarca = v.marca || detalles.marca || '';
          let rawModelo = v.modelo || detalles.modelo || '';

          if (rawModelo && rawModelo.includes('/')) {
            const parts = rawModelo.split('/');
            if (!rawMarca) rawMarca = parts[0]?.trim();
            rawModelo = parts.slice(1).join('/').trim();
          } else if (rawModelo && rawMarca && rawModelo.toLowerCase().startsWith(rawMarca.toLowerCase())) {
            rawModelo = rawModelo.substring(rawMarca.length).replace(/^[-/:\s]+/, '').trim();
          }

          let kmsActuales = typeof v.kilometraje_actual === 'number' ? v.kilometraje_actual : parseFloat(String(v.kilometraje_actual).replace(/[^0-9.-]+/g, '')) || 0;
          const rawKmUlt = (v.km_ultima_mantencion !== undefined && v.km_ultima_mantencion !== null && v.km_ultima_mantencion !== '')
            ? v.km_ultima_mantencion
            : (detalles.km_ultima_mantencion !== undefined && detalles.km_ultima_mantencion !== null ? detalles.km_ultima_mantencion : 0);
          const kmUltMant = typeof rawKmUlt === 'number' ? rawKmUlt : parseFloat(String(rawKmUlt).replace(/[^0-9.-]+/g, '')) || 0;

          // Detección automática de escala x10 errónea del GPS (ej: 881051 cuando la mantención es 84.484)
          if (kmUltMant > 1000 && kmsActuales > (kmUltMant * 4) && Math.abs((kmsActuales / 10) - kmUltMant) < kmUltMant) {
            kmsActuales = Math.round((kmsActuales / 10) * 100) / 100;
          }

          // Respetar calibración manual realizada por el usuario
          if (detalles?.odometro_manual && typeof detalles?.km_manual === 'number') {
            if (kmsActuales < detalles.km_manual || (kmsActuales > (detalles.km_manual * 4))) {
              kmsActuales = detalles.km_manual;
            }
          }
          const pautasSecuenciaStr = v.tipo_ultimo_mant || v.tipo_ult_pauta || detalles.tipo_ultimo_mant || detalles.tipo_ult_pauta || '';
          const fechaUltMant = v.fecha_ultima_mantencion || v.fecha_ult_mantencion || detalles.fecha_ultima_mantencion || '';
          const rawInterval = (v.intervalo_km !== undefined && v.intervalo_km !== null) ? v.intervalo_km : (detalles.intervalo_km !== undefined ? detalles.intervalo_km : 10000);
          const kmInterv = typeof rawInterval === 'number' ? rawInterval : parseFloat(String(rawInterval).replace(/[^0-9.-]+/g, '')) || 10000;

          return {
            id: v.id,
            patente: v.patente || v.numero_interno || 'Sin Patente',
            numeroInterno: v.numero_interno?.toString() || '',
            numero_interno: v.numero_interno?.toString() || '',
            modelo: rawModelo,
            marca: rawMarca,
            ano: v.anio || v.ano || detalles.ano || detalles.anio || '',
            vin: v.vin || v.chasis || detalles.vin || detalles.chasis || '',
            kilometrajeActual: kmsActuales,
            kilometraje_actual: kmsActuales,
            kmUltimaMantencion: kmUltMant,
            km_ultima_mantencion: kmUltMant,
            fechaUltimaMantencion: fechaUltMant,
            fecha_ultima_mantencion: fechaUltMant,
            tipoUltimoMant: pautasSecuenciaStr,
            tipo_ultimo_mant: pautasSecuenciaStr,
            intervaloMantencionKm: kmInterv,
            intervalo_km: kmInterv,
            detalles: v.detalles
          };
        }));
      } else {
        setVehiculos([]);
      }

      // Fetch Pautas
      const { data: pautasData } = await supabase.from('mantenimiento_pauta').select('*, modelo:mantenimiento_modelo_vehiculo(nombre)').eq('empresa_id', activeCompanyId);
      if (pautasData && Array.isArray(pautasData)) {
        setPautas(pautasData.map(p => ({
          id: p.id,
          nombre: p.nombre,
          kmRecomendado: p.kilometraje_inicial || 0,
          modeloVehiculo: p.modelo?.nombre || ''
        } as any)));
      } else {
        setPautas([]);
      }

      // Fetch Repuestos (strictly scoped to active company)
      let allRepuestosData: any[] = [];
      let startR = 0;
      let hasMoreRepuestos = true;
      if (activeCompanyId) {
        while (hasMoreRepuestos) {
          const { data } = await supabase.from('logistica_repuestos').select('*').eq('empresa_id', activeCompanyId).range(startR, startR + pageSize - 1);
          if (data && data.length > 0) {
            allRepuestosData = [...allRepuestosData, ...data];
            startR += pageSize;
          } else {
            hasMoreRepuestos = false;
          }
        }
      }

      setRepuestos(allRepuestosData.map(r => ({ 
          id: r.id, 
          sku: r.sku || r.referencia || '', 
          nombre: r.nombre, 
          stock_actual: Number(r.stock) || 0, 
          costo_unitario: Number(r.precio) || 0 
      })));

      // Fetch Kits
      const { data: kitsData } = await supabase.from('kit_repuesto').select(`
        id, nombre, descripcion,
        kit_repuesto_detalle ( repuesto, cantidad )
      `).eq('empresa_id', activeCompanyId);
      if (kitsData) {
        setKitsRepuesto(kitsData.map(k => ({
          id: k.id,
          nombre: k.nombre,
          descripcion: k.descripcion,
          detalles: k.kit_repuesto_detalle || []
        })));
      }

      // Fetch Proveedores
      const { data: provData } = await supabase.from('proveedores_directorio').select('*').eq('empresa_id', activeCompanyId);
      if (provData) {
        setProveedores(provData.map(p => ({
          id: p.id,
          nombre: p.nombre,
          rut: p.rut || undefined,
          direccion: p.direccion || undefined,
          telefono: p.telefono || undefined,
          email: p.email || undefined
        })));
      } else {
        setProveedores([]);
      }

      // Fetch Personal
      const { data: colabData } = await supabase.from('colaborador').select('*').eq('empresa_id', activeCompanyId);
      if (colabData) {
        setPersonal(colabData.map(c => {
          const roleText = c.rol || c.cargo || '';
          const isMec = roleText.toLowerCase().includes('mecanic') || roleText.toLowerCase().includes('mecánic') || !!c.detalles?.isMecanico || !!c.is_mecanico || false;
          const isCond = roleText.toLowerCase().includes('conduct') || roleText.toLowerCase().includes('chofer') || roleText.toLowerCase().includes('conductor') || !!c.detalles?.isConductor || !!c.is_conductor || false;
          return {
            ...c,
            name: c.nombre || c.nombre_completo || c.name || '',
            email: c.email || '',
            phone: c.telefono || '',
            role: roleText,
            roleBadgeText: roleText,
            isMecanico: isMec,
            isConductor: isCond,
            // Add default avatar/stats for UI compatibility
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nombre || c.nombre_completo || c.name || '')}&background=random`,
            performanceScore: c.performanceScore || 0,
            pendingTasks: c.pendingTasks || 0,
          };
        }));
      }

      // Fetch and sync Ordenes de Trabajo
      await sincronizarYRecargarOTs(activeCompanyId);

    };

    await loadData();
  }, [activeCompanyId, sincronizarYRecargarOTs]);

  useEffect(() => {
    fetchAllData();
  }, [activeCompanyId, fetchAllData]);

  useEffect(() => {
    const handleVehiculoActualizado = (e: any) => {
      const detail = e?.detail;
      if (detail && detail.vehiculoId) {
        setVehiculos(prev => prev.map(v => {
          if (String(v.id) === String(detail.vehiculoId)) {
            const newKm = detail.kmActual !== undefined ? Number(detail.kmActual) : v.kilometrajeActual;
            const newFecha = detail.fechaActualizacionKm || new Date().toISOString();
            return {
              ...v,
              kilometrajeActual: newKm,
              kilometraje_actual: newKm,
              fechaActualizacionKm: newFecha,
              detalles: {
                ...(v.detalles || {}),
                fecha_actualizacion_km: newFecha
              }
            };
          }
          return v;
        }));
      }
    };

    window.addEventListener('vehiculo-actualizado', handleVehiculoActualizado);
    return () => {
      window.removeEventListener('vehiculo-actualizado', handleVehiculoActualizado);
    };
  }, []);

  const crearReservaTurismo = (reserva: ReservaTurismo) => {
    // Logic for adding a reservation
  };

  const crearOrdenTrabajo = async (ot: OrdenDeTrabajo) => {
    let finalId = ot.id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(finalId);
    if (!isUuid) {
      finalId = generateUUID();
    }
    const targetCompanyId = activeCompanyId || profile?.empresa_id || '57fa41da-645d-48ba-a671-65a35312d0e9';
    const finalOT = { ...ot, id: finalId, empresa_id: targetCompanyId };
    
    // 1. Immediately persist locally so the work order is NEVER lost or discarded
    setOrdenesTrabajo(prev => {
      const nextList = [...prev.filter(o => o.id !== finalId && o.folio !== finalOT.folio), finalOT];
      saveLocalOTs(nextList, targetCompanyId);
      return nextList;
    });

    // 2. Also persist to Node server memory / storage
    try {
      fetch('/api/flota/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalOT)
      }).catch(() => {});
    } catch(e) {}

    try {
      const clampNum = (val: string | number | undefined | null, maxVal = 99999999.99): number | null => {
        if (val === undefined || val === null || val === '') return null;
        const num = Number(val);
        if (isNaN(num)) return null;
        return Math.min(Math.max(num, -maxVal), maxVal);
      };

      const targetCompanyId = activeCompanyId || profile?.empresa_id || '57fa41da-645d-48ba-a671-65a35312d0e9';

      const dbPayload = {
        id: finalOT.id,
        folio: finalOT.folio,
        vehiculo_id: finalOT.vehiculoId,
        empresa_id: targetCompanyId,
        tecnico_responsable: finalOT.tecnicoResponsable || finalOT.personalOperativo || null,
        tipo: finalOT.tipo,
        estado: finalOT.estado,
        prioridad: finalOT.prioridad,
        inicio_proceso: finalOT.inicio_proceso || null,
        kilometraje_apertura: clampNum(finalOT.kilometrajeApertura) || 0,
        kilometraje_cierre: clampNum(finalOT.kilometrajeCierre),
        fecha_creacion: finalOT.fechaCreacion,
        fecha_programada: finalOT.fechaProgramada || null,
        hora_inicio_programada: finalOT.horaInicioProgramada || null,
        hora_termino_programada: finalOT.horaTerminoProgramada || null,
        observacion_inicial: finalOT.observacionInicial || null,
        diagnostico_evaluacion: finalOT.diagnosticoEvaluacion || null,
        pauta: finalOT.pauta || null,
        pauta_mantenimiento_id: finalOT.pauta_mantenimiento_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(finalOT.pauta_mantenimiento_id) ? finalOT.pauta_mantenimiento_id : null,
        kit_repuestos: finalOT.kitRepuestos || null,
        tipo_falla: finalOT.tipoFalla || null,
        sintomas: finalOT.sintomas || null,
        inspeccion_tren_motriz: finalOT.inspeccionTrenMotriz || null,
        eje: finalOT.eje || null,
        presion_neumatico: clampNum(finalOT.presionNeumatico, 999.99),
        personal_operativo: finalOT.personalOperativo || null,
        proveedor: finalOT.proveedor || null,
        empresa_externa: finalOT.empresaExterna || null,
        rut_empresa: finalOT.rutEmpresa || null,
        valor_hh: clampNum(finalOT.valorHH),
        presupuesto_aprobado: clampNum(finalOT.presupuestoAprobado),
        observaciones: finalOT.observaciones || null,
        tecnico_tipo: finalOT.tecnico_tipo || 'INTERNO',
        externo_nombre: finalOT.externo_nombre || null,
        externo_especialidad: finalOT.externo_especialidad || null,
        externo_intervencion: finalOT.externo_intervencion || null,
        costo_insumos: clampNum(finalOT.costoInsumos) || 0,
        costo_mano_obra_tareas: clampNum(finalOT.costoManoObraTareas) || 0,
        costo_mano_obra_hh: clampNum(finalOT.costoManoObraHH) || 0,
        tiempo_trabajado_segundos: clampNum(finalOT.tiempoTrabajadoSegundos, 2000000000) || 0
      };

      // Helper to check for duplicate folio constraint
      const isDuplicateFolio = (err: any) =>
        err && (err.code === '23505' || (err.message && (err.message.includes('folio') || err.message.includes('unique constraint') || err.message.includes('duplicate key'))));

      let currentFolio = finalOT.folio;
      let lastError: any = null;
      let attempts = 0;
      let insertedSuccessfully = false;

      while (attempts < 6) {
        const { error } = await supabase.from('orden_de_trabajo').insert([{ ...dbPayload, folio: currentFolio }]);
        if (!error) {
          insertedSuccessfully = true;
          lastError = null;
          finalOT.folio = currentFolio;
          setOrdenesTrabajo(prev => {
            const updated = prev.map(o => o.id === finalId ? { ...o, folio: currentFolio } : o);
            saveLocalOTs(updated, targetCompanyId);
            return updated;
          });
          break;
        }
        lastError = error;
        if (isDuplicateFolio(error)) {
          attempts++;
          const match = currentFolio.match(/OT-(\d+)/);
          const currNum = match ? parseInt(match[1], 10) : attempts;
          currentFolio = `OT-${String(currNum + 1).padStart(4, '0')}`;
          console.warn(`Folio collision in database. Auto-retrying with ${currentFolio}...`);
        } else {
          break;
        }
      }

      if (insertedSuccessfully) {
        console.log("Work order successfully persistent in Supabase database with folio:", finalOT.folio);
        
        // Save sub-tables matching the initialized work order (if any are pre-defined)
        if (finalOT.tareasRealizadas && finalOT.tareasRealizadas.length > 0) {
          const insertPayload = finalOT.tareasRealizadas.map(t => ({
            id: t.id && t.id.length > 20 ? t.id : generateUUID(),
            orden_id: finalOT.id,
            tarea_estandar_id: t.tarea_estandar_id || null,
            tiempo_real_minutos: t.tiempo_real_minutos || 0,
            costo_real: t.costo_real || 0,
            tarea_estandar: t.tarea_estandar || null
          }));
          await supabase.from('ot_tareas_realizadas').insert(insertPayload);
        }
        
        if (finalOT.insumos && finalOT.insumos.length > 0) {
          // Pre-ensure catalog entries exist to satisfy foreign keys
          for (const item of finalOT.insumos) {
            if (item.repuesto) {
              try {
                await supabase.from('repuesto').upsert({
                  id: item.repuesto.id,
                  sku: item.repuesto.sku || item.repuesto.referencia || Math.random().toString(36).substr(2, 9),
                  nombre: item.repuesto.nombre || 'Repuesto',
                  stock_actual: Number(item.repuesto.stock_actual || 0),
                  costo_unitario: Number(item.repuesto.costo_unitario || item.repuesto.costo_unitario_aplicado || 0)
                });
              } catch (errRec) {
                console.warn("Failed to pre-upsert repuesto, continuing:", errRec);
              }
            }
          }

          const insertPayload = finalOT.insumos.map(i => ({
            id: i.id && i.id.length > 20 ? i.id : generateUUID(),
            orden_id: finalOT.id,
            repuesto_id: i.repuesto?.id || i.repuesto_id || null,
            cantidad: i.cantidad || 0,
            costo_unitario_aplicado: i.costo_unitario_aplicado || 0,
            repuesto: i.repuesto || null
          }));
          await supabase.from('detalle_insumo_ot').insert(insertPayload);
        }
        
        if (finalOT.historial && finalOT.historial.length > 0) {
          const insertPayload = finalOT.historial.map(h => ({
            orden_id: finalOT.id,
            usuario_nombre: h.usuario_nombre || 'Sistema',
            comentario: h.comentario || '',
            created_at: h.created_at || new Date().toISOString()
          }));
          await supabase.from('historial_ot').insert(insertPayload);
        }

        if (finalOT.solicitudes && finalOT.solicitudes.length > 0) {
          try {
            const insertPayload = finalOT.solicitudes.map(s => ({
              id: s.id && s.id.length > 20 ? s.id : generateUUID(),
              orden_id: finalOT.id,
              repuesto_id: s.repuesto_id || null,
              repuesto_nombre: s.repuesto_nombre || 'Insumo',
              cantidad: s.cantidad || 0,
              estado: s.estado || 'PENDIENTE',
              usuario_nombre: s.usuario_nombre || 'Mecánico',
              motivo_rechazo: s.motivo_rechazo || null,
              created_at: s.created_at || new Date().toISOString()
            }));
            await supabase.from('solicitud_repuesto_ot').insert(insertPayload);
          } catch (eSol) {
            console.warn("Could not write solicitudes on creation:", eSol);
          }
        }

        try {
          await logActividad(
            'Mantenimiento',
            'Creó Orden de Trabajo',
            `OT #${finalOT.folio || finalOT.id} - Tipo: ${finalOT.tipo} - Estado: ${finalOT.estado}`,
            activeCompanyId || profile?.empresa_id || undefined,
            profile?.id
          );
        } catch (le) {
          console.warn('Logging error:', le);
        }

        Swal.fire({
          title: "¡Guardado Exitoso!",
          text: `La orden de trabajo ${finalOT.folio} se ha guardado correctamente en la base de datos.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        console.warn("Supabase insertion skipped or rejected:", lastError);
        const isRls = lastError?.code === '42501' || lastError?.message?.includes('row-level security') || lastError?.message?.includes('policy');
        Swal.fire({
          title: "¡Orden de Trabajo Creada!",
          text: `La Orden de Trabajo ${finalOT.folio} fue creada y guardada con éxito en tu sistema local.${isRls ? ' (Registrada localmente debido a políticas de sesión).' : ''}`,
          icon: "success",
          confirmButtonColor: "#0891b2"
        });
      }
    } catch (err: any) {
      console.warn("Exception during Supabase sync, retained in local storage:", err);
      Swal.fire({
        title: "¡Orden de Trabajo Creada!",
        text: `La Orden de Trabajo ${finalOT.folio} ha sido creada y guardada correctamente.`,
        icon: "success",
        confirmButtonColor: "#0891b2"
      });
    }

    // Si la OT fue creada directamente como FINALIZADA o CERRADA, sincronizar vehículo
    if (finalOT.estado === 'FINALIZADA' || finalOT.estado === 'CERRADA_POR_MECANICO') {
      await sincronizarCierreOTVehiculo(finalOT);
    }
  };

  const eliminarOrdenTrabajo = async (id: string, skipConfirm = false) => {
    const otAEliminar = ordenesTrabajo.find(ot => ot.id === id || ot.folio === id);
    const isOtPreventiva = otAEliminar && String(otAEliminar.tipo || '').toUpperCase().includes('PREVENTIV');
    const wasCerrada = otAEliminar && (otAEliminar.estado === 'FINALIZADA' || otAEliminar.estado === 'CERRADA_POR_MECANICO');
    const vehId = otAEliminar ? (otAEliminar.vehiculoId || (otAEliminar as any).vehiculo_id) : null;

    if (!skipConfirm) {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Eliminar una Orden de Trabajo es una acción irreversible.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#3b82f6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });
      if (!result.isConfirmed) return;
    }

    const nextList = ordenesTrabajo.filter(ot => ot.id !== id && ot.folio !== id);

    // 1. ACTUALIZACIÓN OPTIMISTA INMEDIATA EN MEMORIA (0 ms)
    setOrdenesTrabajo(nextList);
    saveLocalOTs(nextList, activeCompanyId);

    let finalKm = 0;
    let finalFecha: string | null = null;
    let finalPauta: string = 'SM1';
    let newDetalles: any = null;

    if (isOtPreventiva && wasCerrada && vehId) {
      const remainingPrevOts = nextList.filter(o => 
        (String(o.vehiculoId) === String(vehId) || String(o.vehiculo_id) === String(vehId)) &&
        (o.estado === 'FINALIZADA' || o.estado === 'CERRADA_POR_MECANICO') &&
        String(o.tipo || '').toUpperCase().includes('PREVENTIV')
      );

      if (remainingPrevOts.length > 0) {
        remainingPrevOts.sort((a, b) => {
          const kmB = Number(b.kilometrajeCierre || b.kilometraje_cierre || b.kilometrajeApertura || 0);
          const kmA = Number(a.kilometrajeCierre || a.kilometraje_cierre || a.kilometrajeApertura || 0);
          if (kmB !== kmA) return kmB - kmA;
          const timeB = new Date(b.termino_proceso || b.fechaProgramada || b.fechaCreacion || 0).getTime();
          const timeA = new Date(a.termino_proceso || a.fechaProgramada || a.fechaCreacion || 0).getTime();
          return timeB - timeA;
        });

        const topPrev = remainingPrevOts[0];
        finalKm = Number(topPrev.kilometrajeCierre || topPrev.kilometraje_cierre || topPrev.kilometrajeApertura || 0);
        finalFecha = (topPrev.termino_proceso || topPrev.fechaProgramada || topPrev.fechaCreacion || '').split('T')[0];
        finalPauta = topPrev.pauta || 'SM1';
      } else {
        const vCurrent = vehiculos.find(v => String(v.id) === String(vehId));
        const existingDetalles = vCurrent?.detalles || {};
        finalKm = existingDetalles.km_linea_base || existingDetalles.km_ultima_mantencion_inicial || 0;
        finalFecha = existingDetalles.fecha_linea_base || existingDetalles.fecha_ultima_mantencion_inicial || null;
        finalPauta = existingDetalles.tipo_linea_base || existingDetalles.tipo_ultimo_mant_inicial || 'SM1';
      }

      setVehiculos(prev => prev.map(v => {
        if (String(v.id) === String(vehId)) {
          const existingDetalles = v.detalles || {};
          const fallbackKm = finalKm > 0 ? finalKm : (existingDetalles.km_linea_base || existingDetalles.km_ultima_mantencion_inicial || 0);
          const fallbackFecha = finalFecha || existingDetalles.fecha_linea_base || existingDetalles.fecha_ultima_mantencion_inicial || null;
          const fallbackPauta = finalPauta || existingDetalles.tipo_linea_base || existingDetalles.tipo_ultimo_mant_inicial || 'SM1';
          
          newDetalles = {
            ...existingDetalles,
            km_ultima_mantencion: fallbackKm,
            fecha_ultima_mantencion: fallbackFecha,
            tipo_ultimo_mant: fallbackPauta
          };

          return {
            ...v,
            kmUltimaMantencion: fallbackKm,
            km_ultima_mantencion: fallbackKm,
            fechaUltimaMantencion: fallbackFecha || undefined,
            fecha_ultima_mantencion: fallbackFecha || undefined,
            tipoUltimoMant: fallbackPauta,
            tipo_ultimo_mant: fallbackPauta,
            detalles: newDetalles
          };
        }
        return v;
      }));

      // Disparar evento reactivo inmediato a la Pizarra (0 ms)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vehiculo-actualizado', { 
          detail: { vehiculoId: vehId, kmCierre: finalKm, fechaMant: finalFecha, tipoMant: finalPauta } 
        }));
        window.dispatchEvent(new CustomEvent('ot-actualizada', { 
          detail: { otId: id, vehiculoId: vehId } 
        }));
      }
    }

    if (!skipConfirm) {
      Swal.fire({
        title: '¡Eliminada!',
        text: 'La Orden de Trabajo ha sido eliminada y la última mantención se recalculó de forma instantánea.',
        icon: 'success',
        timer: 1800,
        showConfirmButton: false
      });
    }

    // 2. PERSISTENCIA EN SEGUNDO PLANO EN PARALELO (sin bloquear la UI)
    try {
      fetch(`/api/flota/ordenes/${id}`, { method: 'DELETE' }).catch(() => {});

      // Borrado en paralelo de tablas hijas
      await Promise.all([
        supabase.from('ot_tareas_realizadas').delete().eq('orden_id', id),
        supabase.from('detalle_insumo_ot').delete().eq('orden_id', id),
        supabase.from('historial_ot').delete().eq('orden_id', id),
        supabase.from('solicitud_repuesto_ot').delete().eq('orden_id', id)
      ]);

      await supabase.from('orden_de_trabajo').delete().eq('id', id);

      if (isOtPreventiva && wasCerrada && vehId) {
        const { data: vParams } = await supabase
          .from('vehiculo')
          .select('id, detalles')
          .eq('id', vehId)
          .maybeSingle();

        const mergedDetalles = {
          ...(vParams?.detalles || {}),
          ...(newDetalles || {}),
          km_ultima_mantencion: finalKm,
          fecha_ultima_mantencion: finalFecha,
          tipo_ultimo_mant: finalPauta
        };

        await supabase.from('vehiculo').update({
          km_ultima_mantencion: finalKm,
          fecha_ultima_mantencion: finalFecha,
          tipo_ultimo_mant: finalPauta,
          detalles: mergedDetalles
        }).eq('id', vehId);
      }
    } catch (err) {
      console.warn("Aviso en persistencia background tras eliminar OT:", err);
    }
  };

  const sincronizarCierreOTVehiculo = async (otCerrada: OrdenDeTrabajo) => {
    const isOtPreventiva = String(otCerrada.tipo || '').toUpperCase().includes('PREVENTIV');
    const isOtCerrada = otCerrada.estado === 'FINALIZADA' || otCerrada.estado === 'CERRADA_POR_MECANICO';
    const vehId = otCerrada.vehiculoId || (otCerrada as any).vehiculo_id;
    const kmCierre = Number(otCerrada.kilometrajeCierre || otCerrada.kilometrajeApertura || 0);

    if (!isOtCerrada || !isOtPreventiva || !vehId || kmCierre <= 0) {
      return;
    }

    try {
      const tipoMant = (otCerrada.pauta && otCerrada.pauta !== 'Mantenimiento Preventivo')
        ? otCerrada.pauta
        : undefined;
      const fechaMant = (otCerrada.termino_proceso || otCerrada.fechaProgramada || new Date().toISOString()).split('T')[0];

      let newDetallesLocal: any = {};
      let finalPautaLocal = 'SM1';

      // 1. Actualización Inmediata en Memoria (State Local React) - 0 ms
      setVehiculos(prev => prev.map(v => {
        if (String(v.id) === String(vehId)) {
          finalPautaLocal = tipoMant || v.tipoUltimoMant || v.tipo_ultimo_mant || 'SM1';
          const newKmMax = Math.max(kmCierre, Number(v.kilometrajeActual || v.kilometraje_actual || 0));
          const existingDetalles = v.detalles || {};
          
          // Preservar línea base original para no perderla jamás en futuros rollbacks
          const kmLineaBase = existingDetalles.km_linea_base || existingDetalles.km_ultima_mantencion_inicial || v.km_ultima_mantencion || v.kmUltimaMantencion;
          const fechaLineaBase = existingDetalles.fecha_linea_base || existingDetalles.fecha_ultima_mantencion_inicial || v.fecha_ultima_mantencion || v.fechaUltimaMantencion;
          const tipoLineaBase = existingDetalles.tipo_linea_base || existingDetalles.tipo_ultimo_mant_inicial || v.tipo_ultimo_mant || v.tipoUltimoMant;

          newDetallesLocal = {
            ...existingDetalles,
            km_linea_base: kmLineaBase,
            fecha_linea_base: fechaLineaBase,
            tipo_linea_base: tipoLineaBase,
            km_ultima_mantencion: kmCierre,
            fecha_ultima_mantencion: fechaMant,
            tipo_ultimo_mant: finalPautaLocal
          };
          return {
            ...v,
            kilometrajeActual: newKmMax,
            kilometraje_actual: newKmMax,
            kmUltimaMantencion: kmCierre,
            km_ultima_mantencion: kmCierre,
            fechaUltimaMantencion: fechaMant,
            fecha_ultima_mantencion: fechaMant,
            tipoUltimoMant: finalPautaLocal,
            tipo_ultimo_mant: finalPautaLocal,
            detalles: newDetallesLocal
          };
        }
        return v;
      }));

      // 2. Disparar evento reactivo de inmediato (0 ms)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vehiculo-actualizado', { 
          detail: { vehiculoId: vehId, kmCierre, fechaMant, tipoMant: finalPautaLocal } 
        }));
        window.dispatchEvent(new CustomEvent('ot-actualizada', { 
          detail: { otId: otCerrada.id, vehiculoId: vehId } 
        }));
      }

      // 3. Persistencia en Supabase en background
      const { data: vParams } = await supabase
        .from('vehiculo')
        .select('id, kilometraje_actual, km_ultima_mantencion, fecha_ultima_mantencion, tipo_ultimo_mant, detalles')
        .eq('id', vehId)
        .maybeSingle();

      const currentKmMax = vParams ? Math.max(kmCierre, Number(vParams.kilometraje_actual || 0)) : kmCierre;
      const existingDetalles = vParams?.detalles || {};
      const kmLineaBase = existingDetalles.km_linea_base || existingDetalles.km_ultima_mantencion_inicial || vParams?.km_ultima_mantencion;
      const fechaLineaBase = existingDetalles.fecha_linea_base || existingDetalles.fecha_ultima_mantencion_inicial || vParams?.fecha_ultima_mantencion;
      const tipoLineaBase = existingDetalles.tipo_linea_base || existingDetalles.tipo_ultimo_mant_inicial || vParams?.tipo_ultimo_mant;

      const newDetalles = {
        ...existingDetalles,
        ...newDetallesLocal,
        km_linea_base: kmLineaBase,
        fecha_linea_base: fechaLineaBase,
        tipo_linea_base: tipoLineaBase,
        km_ultima_mantencion: kmCierre,
        fecha_ultima_mantencion: fechaMant,
        tipo_ultimo_mant: finalPautaLocal
      };

      const updatePayload: any = {
        km_ultima_mantencion: kmCierre,
        fecha_ultima_mantencion: fechaMant,
        tipo_ultimo_mant: finalPautaLocal,
        kilometraje_actual: currentKmMax,
        fecha_actualizacion_km: new Date().toISOString(),
        detalles: newDetalles
      };

      await supabase
        .from('vehiculo')
        .update(updatePayload)
        .eq('id', vehId);

    } catch (ve) {
      console.error("Error en sincronizarCierreOTVehiculo:", ve);
    }
  };

  const actualizarOrdenTrabajo = async (otActualizada: OrdenDeTrabajo) => {
    let finalId = otActualizada.id;
    const isVirtualId = !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(finalId);
    if (isVirtualId) {
      finalId = generateUUID();
      otActualizada = { ...otActualizada, id: finalId };
    }

    setOrdenesTrabajo(prev => {
      const exists = prev.some(ot => ot.id === finalId || ot.id === otActualizada.id || (otActualizada.folio && ot.folio === otActualizada.folio));
      const nextList = exists
        ? prev.map(ot => (ot.id === finalId || ot.id === otActualizada.id || (otActualizada.folio && ot.folio === otActualizada.folio)) ? otActualizada : ot)
        : [...prev, otActualizada];
      saveLocalOTs(nextList, activeCompanyId);
      return nextList;
    });

    try {
      fetch(`/api/flota/ordenes/${otActualizada.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(otActualizada)
      }).catch(() => {});
    } catch (e) {}

    try {
      const clampNum = (val: string | number | undefined | null, maxVal = 99999999.99): number | null => {
        if (val === undefined || val === null || val === '') return null;
        const num = Number(val);
        if (isNaN(num)) return null;
        return Math.min(Math.max(num, -maxVal), maxVal);
      };

      const targetCompanyId = activeCompanyId || profile?.empresa_id || '57fa41da-645d-48ba-a671-65a35312d0e9';

      const dbPayload = {
        id: finalId,
        folio: otActualizada.folio,
        vehiculo_id: otActualizada.vehiculoId,
        empresa_id: targetCompanyId,
        tecnico_responsable: otActualizada.tecnicoResponsable || otActualizada.personalOperativo || null,
        tipo: otActualizada.tipo,
        estado: otActualizada.estado,
        prioridad: otActualizada.prioridad,
        inicio_proceso: otActualizada.inicio_proceso || null,
        kilometraje_apertura: clampNum(otActualizada.kilometrajeApertura) || 0,
        kilometraje_cierre: clampNum(otActualizada.kilometrajeCierre),
        fecha_creacion: otActualizada.fechaCreacion,
        fecha_programada: otActualizada.fechaProgramada || null,
        hora_inicio_programada: otActualizada.horaInicioProgramada || null,
        hora_termino_programada: otActualizada.horaTerminoProgramada || null,
        observacion_inicial: otActualizada.observacionInicial || null,
        diagnostico_evaluacion: otActualizada.diagnosticoEvaluacion || null,
        pauta: otActualizada.pauta || null,
        pauta_mantenimiento_id: otActualizada.pauta_mantenimiento_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(otActualizada.pauta_mantenimiento_id) ? otActualizada.pauta_mantenimiento_id : null,
        kit_repuestos: otActualizada.kitRepuestos || null,
        tipo_falla: otActualizada.tipoFalla || null,
        sintomas: otActualizada.sintomas || null,
        inspeccion_tren_motriz: otActualizada.inspeccionTrenMotriz || null,
        eje: otActualizada.eje || null,
        presion_neumatico: clampNum(otActualizada.presionNeumatico, 999.99),
        personal_operativo: otActualizada.personalOperativo || null,
        proveedor: otActualizada.proveedor || null,
        empresa_externa: otActualizada.empresaExterna || null,
        rut_empresa: otActualizada.rutEmpresa || null,
        valor_hh: clampNum(otActualizada.valorHH),
        presupuesto_aprobado: clampNum(otActualizada.presupuestoAprobado),
        observaciones: otActualizada.observaciones || null,
        tecnico_tipo: otActualizada.tecnico_tipo || 'INTERNO',
        externo_nombre: otActualizada.externo_nombre || null,
        externo_especialidad: otActualizada.externo_especialidad || null,
        externo_intervencion: otActualizada.externo_intervencion || null,
        costo_insumos: clampNum(otActualizada.costoInsumos) || 0,
        costo_mano_obra_tareas: clampNum(otActualizada.costoManoObraTareas) || 0,
        costo_mano_obra_hh: clampNum(otActualizada.costoManoObraHH) || 0,
        tiempo_trabajado_segundos: clampNum(otActualizada.tiempoTrabajadoSegundos, 2000000000) || 0
      };

      const { error } = await supabase.from('orden_de_trabajo').upsert(dbPayload);
      if (error) {
        console.warn("Supabase update skipped or rejected (saved locally):", error);
        if (dbPayload.pauta_mantenimiento_id && (error.message?.includes('foreign key') || error.message?.includes('pauta_mantenimiento_id'))) {
          try {
            const retryPayload = { ...dbPayload, pauta_mantenimiento_id: null };
            await supabase.from('orden_de_trabajo').upsert(retryPayload);
            console.log("OT guardada exitosamente en reintento sin restricción estricta de pauta_mantenimiento_id");
          } catch (rErr) {
            console.warn("Fallo reintento sin pauta_mantenimiento_id:", rErr);
          }
        }
      } else {
        console.log("Work order successfully updated in Supabase database!");
      }

      // ACTUALIZAR VEHÍCULO EXPLÍCITAMENTE AL CERRAR LA OT PREVENTIVA (RESET PIZARRA)
      // Se ejecuta de forma garantizada tanto en memoria como en BD para reiniciar el ciclo en la Pizarra
      await sincronizarCierreOTVehiculo(otActualizada);  
        // Sync Child Tables
        // Tareas Realizadas
        if (otActualizada.tareasRealizadas) {
          const { error: delTareasErr } = await supabase.from('ot_tareas_realizadas').delete().eq('orden_id', otActualizada.id);
          if (delTareasErr) {
            console.error("Error deleting old ot_tareas_realizadas:", delTareasErr);
            throw new Error(`No se pudieron eliminar las tareas anteriores: ${delTareasErr.message}`);
          }
          if (otActualizada.tareasRealizadas.length > 0) {
            const insertPayload = otActualizada.tareasRealizadas.map(t => ({
              orden_id: otActualizada.id,
              tarea_estandar_id: t.tarea_estandar_id || null,
              tiempo_real_minutos: t.tiempo_real_minutos || 0,
              costo_real: t.costo_real || 0,
              tarea_estandar: t.tarea_estandar || null
            }));
            const { error: insTareasErr } = await supabase.from('ot_tareas_realizadas').insert(insertPayload);
            if (insTareasErr) {
              console.error("Error inserting ot_tareas_realizadas:", insTareasErr);
              throw new Error(`No se pudieron guardar las tareas realizadas: ${insTareasErr.message}`);
            }
          }
        }
        
        // Insumos y Repuestos
        if (otActualizada.insumos) {
          // A. Obtener el detalle de insumos actualmente registrado en la base de datos para calcular el delta
          let dbInsumos: any[] = [];
          try {
            const { data: qData, error: qErr } = await supabase
              .from('detalle_insumo_ot')
              .select('repuesto_id, cantidad')
              .eq('orden_id', otActualizada.id);
            if (!qErr && qData) {
              dbInsumos = qData;
            }
          } catch (eQuery) {
            console.error("No se pudieron cargar los insumos previos para calcular el delta:", eQuery);
          }

          // B. Eliminar antiguos detalles
          const { error: delInsumosErr } = await supabase.from('detalle_insumo_ot').delete().eq('orden_id', otActualizada.id);
          if (delInsumosErr) {
            console.error("Error deleting old detalle_insumo_ot:", delInsumosErr);
            throw new Error(`No se pudieron limpiar los insumos anteriores: ${delInsumosErr.message}`);
          }

          // C. Insertar los nuevos
          if (otActualizada.insumos.length > 0) {
            // Asegurar que existan en la tabla "repuesto" auxiliar
            for (const item of otActualizada.insumos) {
              if (item.repuesto) {
                try {
                  await supabase.from('repuesto').upsert({
                    id: item.repuesto.id,
                    sku: item.repuesto.sku || item.repuesto.referencia || Math.random().toString(36).substring(2, 11),
                    nombre: item.repuesto.nombre || 'Repuesto',
                    stock_actual: Number(item.repuesto.stock_actual || 0),
                    costo_unitario: Number(item.repuesto.costo_unitario || item.repuesto.costo_unitario_aplicado || 0)
                  });
                } catch (errRec) {
                  console.warn("Failed to pre-upsert repuesto auxiliary, continuing:", errRec);
                }
              }
            }

            const insertPayload = otActualizada.insumos.map(i => ({
              orden_id: otActualizada.id,
              repuesto_id: i.repuesto?.id || i.repuesto_id || null,
              cantidad: i.cantidad || 0,
              costo_unitario_aplicado: i.costo_unitario_aplicado || 0,
              repuesto: i.repuesto || null
            }));
            const { error: insInsumosErr } = await supabase.from('detalle_insumo_ot').insert(insertPayload);
            if (insInsumosErr) {
              console.error("Error inserting detalle_insumo_ot:", insInsumosErr);
              throw new Error(`No se pudieron registrar los insumos de repuesto: ${insInsumosErr.message}`);
            }
          }

          // D. Calcular diferencia de cantidades, aplicar rebaja a "logistica_repuestos" y registrar en "logistica_movimientos"
          try {
            const dbMap: Record<string, number> = {};
            for (const dbI of dbInsumos) {
              if (dbI.repuesto_id) {
                dbMap[dbI.repuesto_id] = (dbMap[dbI.repuesto_id] || 0) + Number(dbI.cantidad || 0);
              }
            }

            const newMap: Record<string, number> = {};
            for (const newI of otActualizada.insumos) {
              const rId = newI.repuesto?.id || newI.repuesto_id;
              if (rId) {
                newMap[rId] = (newMap[rId] || 0) + Number(newI.cantidad || 0);
              }
            }

            const todosRepIds = Array.from(new Set([...Object.keys(dbMap), ...Object.keys(newMap)]));

            for (const rId of todosRepIds) {
              const oldQty = dbMap[rId] || 0;
              const newQty = newMap[rId] || 0;
              const diff = newQty - oldQty;

              if (diff !== 0) {
                console.log(`[BODEGA DELTA COMPLETA] Repuesto: ${rId}, diff: ${diff}`);
                const { data: currentRepData, error: currentRepErr } = await supabase
                  .from('logistica_repuestos')
                  .select('stock, nombre, empresa_id')
                  .eq('id', rId)
                  .single();

                if (!currentRepErr && currentRepData) {
                  const stockActualBD = Number(currentRepData.stock) || 0;
                  const nuevoStockBD = stockActualBD - diff;

                  // Actualizar stock de bodega real
                  await supabase
                    .from('logistica_repuestos')
                    .update({ stock: nuevoStockBD })
                    .eq('id', rId);

                  // Crear registro de movimiento hist_bodega
                  const otFolio = otActualizada.folio || otActualizada.id;
                  const latMovInsert = {
                    empresa_id: currentRepData.empresa_id || activeCompanyId,
                    repuesto_id: rId,
                    tipo: diff > 0 ? "SALIDA" : "ENTRADA",
                    cantidad: Math.abs(diff),
                    referencia: `OT #${otFolio}`,
                    notas: diff > 0 
                      ? `Consumo de material cargado a Orden de Trabajo #${otFolio}` 
                      : `Devolución de material de Orden de Trabajo #${otFolio}`,
                    usuario_nombre: 'Central/Taller OT',
                    estado: 'COMPLETADO'
                  };

                  await supabase
                    .from('logistica_movimientos')
                    .insert([latMovInsert]);
                }
              }
            }

            // Recargar datos para que se actualice la vista de inventarios
            // await fetchAllData(); // Removed to prevent race condition breaking optimistic OT update
          } catch (eDelta) {
            console.error("Error al descontar de bodega:", eDelta);
          }
        }
        
        // Historial de la OT
        if (otActualizada.historial) {
          const nuevosHistorial = otActualizada.historial.filter(h => !h.id || h.id.length < 20);
          if (nuevosHistorial.length > 0) {
            const insertPayload = nuevosHistorial.map(h => ({
              orden_id: otActualizada.id,
              usuario_nombre: h.usuario_nombre || 'Sistema',
              comentario: h.comentario || '',
              created_at: h.created_at || new Date().toISOString()
            }));
            const { error: insHistErr } = await supabase.from('historial_ot').insert(insertPayload);
            if (insHistErr) {
              console.error("Error inserting historial_ot:", insHistErr);
              throw new Error(`No se pudo guardar el historial: ${insHistErr.message}`);
            }
          }
        }

        // Solicitudes Bodega (Safe try-catch in case table is not ready yet)
        if (otActualizada.solicitudes) {
          try {
            const { error: delSolErr } = await supabase.from('solicitud_repuesto_ot').delete().eq('orden_id', otActualizada.id);
            if (delSolErr) {
              console.error("Error deleting old solicitudes:", delSolErr);
            }
            if (otActualizada.solicitudes.length > 0) {
              const insertPayload = otActualizada.solicitudes.map(s => ({
                orden_id: otActualizada.id,
                repuesto_id: s.repuesto_id || null,
                repuesto_nombre: s.repuesto_nombre || 'Insumo',
                cantidad: s.cantidad || 0,
                estado: s.estado || 'PENDIENTE',
                usuario_nombre: s.usuario_nombre || 'Mecánico',
                motivo_rechazo: s.motivo_rechazo || null,
                created_at: s.created_at || new Date().toISOString()
              }));
              const { error: insSolErr } = await supabase.from('solicitud_repuesto_ot').insert(insertPayload);
              if (insSolErr) {
                console.error("Error inserting solicitudes:", insSolErr);
              }
            }
          } catch (eSol) {
            console.warn("Could not sync solicitudes to database:", eSol);
          }
        }

        try {
          await logActividad(
            'Mantenimiento',
            'Actualizó Orden de Trabajo',
            `OT #${otActualizada.folio || otActualizada.id} - Estado: ${otActualizada.estado} - Prioridad: ${otActualizada.prioridad}`,
            activeCompanyId || profile?.empresa_id || undefined,
            profile?.id
          );
        } catch (le) {
          console.warn('Logging error:', le);
        }

        Swal.fire({
          title: "¡Actualización Exitosa!",
          text: `La orden de trabajo ${otActualizada.folio} se ha actualizado correctamente.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
    } catch (err: any) {
      console.warn("Error updating in Supabase, keeping local state:", err);
      saveLocalOTs(ordenesTrabajo);
      Swal.fire({
        title: "Cambios Guardados",
        text: "Los cambios han sido guardados localmente en tu sistema.",
        icon: "info",
        confirmButtonColor: "#0891b2"
      });
    }
  };

  const crearTipoFalla = (tipoFalla: TipoFalla) => {
    setTiposFalla([...tiposFalla, tipoFalla]);
  };

  const eliminarTipoFalla = (id: string) => {
    setTiposFalla(tiposFalla.filter(tf => tf.id !== id));
  };

  const actualizarTipoFalla = (tipoFallaActualizada: TipoFalla) => {
    setTiposFalla(tiposFalla.map(tf => tf.id === tipoFallaActualizada.id ? tipoFallaActualizada : tf));
  };

  const crearKitRepuesto = (kit: KitRepuesto) => {
    setKitsRepuesto([...kitsRepuesto, kit]);
  };

  const eliminarKitRepuesto = (id: string) => {
    setKitsRepuesto(kitsRepuesto.filter(kr => kr.id !== id));
  };

  const crearProveedor = (proveedor: Proveedor) => {
    setProveedores([...proveedores, proveedor]);
  };

  const eliminarProveedor = (id: string) => {
    setProveedores(proveedores.filter(p => p.id !== id));
  };

  const agregarTareaEstandar = (tarea: TareaEstandar) => {
    setTareasEstandar(prev => [...prev, tarea]);
  };

  return (
    <AppContext.Provider value={{ reservasTurismo, ordenesTrabajo, conductores, vehiculos, pautas, tareasEstandar, tiposFalla, kitsRepuesto, repuestos, setRepuestos, usuarios, currentUser, setCurrentUser, proveedores, personal, setPersonal, crearReservaTurismo, crearOrdenTrabajo, eliminarOrdenTrabajo, recargarOrdenesTrabajo, actualizarOrdenTrabajo, crearTipoFalla, eliminarTipoFalla, actualizarTipoFalla, crearKitRepuesto, eliminarKitRepuesto, crearProveedor, eliminarProveedor, agregarTareaEstandar }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
