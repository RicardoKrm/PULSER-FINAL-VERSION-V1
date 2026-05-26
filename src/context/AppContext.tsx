import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import Swal from 'sweetalert2';
import { ReservaTurismo, Conductor, Vehiculo, OrdenDeTrabajo, PautaMantenimiento, TareaEstandar, TipoFalla, KitRepuesto, Usuario, Proveedor, Collaborator, Repuesto } from '../types';

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
  eliminarOrdenTrabajo: (id: string) => void;
  actualizarOrdenTrabajo: (ot: OrdenDeTrabajo) => void;
  crearTipoFalla: (tipoFalla: TipoFalla) => void;
  eliminarTipoFalla: (id: string) => void;
  actualizarTipoFalla?: (tipoFalla: TipoFalla) => void;
  crearKitRepuesto: (kit: KitRepuesto) => void;
  eliminarKitRepuesto: (id: string) => void;
  crearProveedor: (proveedor: Proveedor) => void;
  eliminarProveedor: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [reservasTurismo] = useState<ReservaTurismo[]>([]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenDeTrabajo[]>([]);
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
  const { profile } = useAuth();
  const { activeCompanyId } = useCompany();

  useEffect(() => {
    if (!activeCompanyId) return;

    const fetchAllData = async () => {
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
      if (vehiculosData) {
        setVehiculos(vehiculosData.map(v => ({
          id: v.id,
          patente: v.patente || v.numero_interno || 'Sin Patente',
          modelo: v.modelo || '',
          marca: v.marca || ''
        })));
      }

      // Fetch Pautas
      const { data: pautasData } = await supabase.from('mantenimiento_pauta').select('*, modelo:mantenimiento_modelo_vehiculo(nombre)').eq('empresa_id', activeCompanyId);
      if (pautasData) {
        setPautas(pautasData.map(p => ({
          id: p.id,
          nombre: p.nombre,
          kmRecomendado: p.kilometraje_inicial || 0,
          modeloVehiculo: p.modelo?.nombre || ''
        } as any)));
      }

      // Fetch Repuestos
      let allRepuestosData: any[] = [];
      let startR = 0;
      let hasMoreRepuestos = true;
      while (hasMoreRepuestos) {
        const { data } = await supabase.from('logistica_repuestos').select('*').eq('empresa_id', activeCompanyId).range(startR, startR + pageSize - 1);
        if (data && data.length > 0) {
          allRepuestosData = [...allRepuestosData, ...data];
          startR += pageSize;
        } else {
          hasMoreRepuestos = false;
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

      // Fetch Ordenes de Trabajo
      const { data: otsData } = await supabase.from('orden_de_trabajo').select('*').eq('empresa_id', activeCompanyId);
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

        setOrdenesTrabajo(otsData.map(row => {
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

          const otSolicitudes = solicitudesAll
            .filter((s: any) => s.orden_id === otId)
            .map((s: any) => ({
              id: s.id,
              orden_id: s.orden_id,
              repuesto_id: s.repuesto_id,
              repuesto_nombre: s.repuesto_nombre,
              cantidad: Number(s.cantidad || 0),
              estado: s.estado || 'PENDIENTE',
              created_at: s.created_at || new Date().toISOString(),
              usuario_nombre: s.usuario_nombre || 'Mecánico',
              motivo_rechazo: s.motivo_rechazo || ''
            }));

          return {
            id: row.id,
            folio: row.folio,
            vehiculoId: row.vehiculo_id,
            tecnicoResponsable: row.tecnico_responsable || undefined,
            responsable_id: row.responsable_id || undefined,
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
          };
        }));
      } else {
        setOrdenesTrabajo([]);
      }

    };

    fetchAllData();
  }, [activeCompanyId]);

  const crearReservaTurismo = (reserva: ReservaTurismo) => {
    // Logic for adding a reservation
  };
  
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

  const crearOrdenTrabajo = async (ot: OrdenDeTrabajo) => {
    let finalId = ot.id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(finalId);
    if (!isUuid) {
      finalId = generateUUID();
    }
    const finalOT = { ...ot, id: finalId };
    
    setOrdenesTrabajo(prev => [...prev, finalOT]);

    try {
      const dbPayload = {
        id: finalOT.id,
        folio: finalOT.folio,
        vehiculo_id: finalOT.vehiculoId,
        empresa_id: activeCompanyId || null,
        tecnico_responsable: finalOT.tecnicoResponsable || finalOT.personalOperativo || null,
        tipo: finalOT.tipo,
        estado: finalOT.estado,
        prioridad: finalOT.prioridad,
        inicio_proceso: finalOT.inicio_proceso || null,
        kilometraje_apertura: finalOT.kilometrajeApertura ? Number(finalOT.kilometrajeApertura) : 0,
        kilometraje_cierre: finalOT.kilometrajeCierre ? Number(finalOT.kilometrajeCierre) : null,
        fecha_creacion: finalOT.fechaCreacion,
        fecha_programada: finalOT.fechaProgramada || null,
        hora_inicio_programada: finalOT.horaInicioProgramada || null,
        hora_termino_programada: finalOT.horaTerminoProgramada || null,
        observacion_inicial: finalOT.observacionInicial || null,
        diagnostico_evaluacion: finalOT.diagnosticoEvaluacion || null,
        pauta: finalOT.pauta || null,
        kit_repuestos: finalOT.kitRepuestos || null,
        tipo_falla: finalOT.tipoFalla || null,
        sintomas: finalOT.sintomas || null,
        inspeccion_tren_motriz: finalOT.inspeccionTrenMotriz || null,
        eje: finalOT.eje || null,
        presion_neumatico: finalOT.presionNeumatico ? Number(finalOT.presionNeumatico) : null,
        personal_operativo: finalOT.personalOperativo || null,
        proveedor: finalOT.proveedor || null,
        empresa_externa: finalOT.empresaExterna || null,
        rut_empresa: finalOT.rutEmpresa || null,
        valor_hh: finalOT.valorHH ? Number(finalOT.valorHH) : null,
        presupuesto_aprobado: finalOT.presupuestoAprobado ? Number(finalOT.presupuestoAprobado) : null,
        observaciones: finalOT.observaciones || null,
        costo_insumos: finalOT.costoInsumos ? Number(finalOT.costoInsumos) : 0,
        costo_mano_obra_tareas: finalOT.costoManoObraTareas ? Number(finalOT.costoManoObraTareas) : 0,
        costo_mano_obra_hh: finalOT.costoManoObraHH ? Number(finalOT.costoManoObraHH) : 0,
        tiempo_trabajado_segundos: finalOT.tiempoTrabajadoSegundos ? Number(finalOT.tiempoTrabajadoSegundos) : 0
      };

      const { error } = await supabase.from('orden_de_trabajo').insert([dbPayload]);
      if (error) {
        console.error("Error inserting work order to Supabase:", error);
        setOrdenesTrabajo(prev => prev.filter(o => o.id !== finalId));
        Swal.fire({
          title: "Error al Guardar OT",
          text: `La base de datos rechazó la OT: ${error.message}. Detalle: ${error.details || ''}`,
          icon: "error",
          confirmButtonColor: "#4f46e5"
        });
      } else {
        console.log("Work order successfully persistent in Supabase database!");
        
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
            id: h.id && h.id.length > 20 ? h.id : generateUUID(),
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

        Swal.fire({
          title: "¡Guardado Exitoso!",
          text: `La orden de trabajo ${finalOT.folio} se ha guardado correctamente en la base de datos.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err: any) {
      console.error("Exception during database insert:", err);
      setOrdenesTrabajo(prev => prev.filter(o => o.id !== finalId));
      Swal.fire({
        title: "Error Inesperado",
        text: `Ocurrió un error al intentar guardar la OT: ${err.message || err}`,
        icon: "error",
        confirmButtonColor: "#4f46e5"
      });
    }
  };

  const eliminarOrdenTrabajo = async (id: string) => {
    setOrdenesTrabajo(prev => prev.filter(ot => ot.id !== id));
    try {
      const { error } = await supabase.from('orden_de_trabajo').delete().eq('id', id);
      if (error) {
        console.error("Error deleting work order from database:", error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const actualizarOrdenTrabajo = async (otActualizada: OrdenDeTrabajo) => {
    const originalOts = [...ordenesTrabajo];
    setOrdenesTrabajo(prev => prev.map(ot => ot.id === otActualizada.id ? otActualizada : ot));
    try {
      const dbPayload = {
        folio: otActualizada.folio,
        vehiculo_id: otActualizada.vehiculoId,
        empresa_id: activeCompanyId || null,
        tecnico_responsable: otActualizada.tecnicoResponsable || otActualizada.personalOperativo || null,
        tipo: otActualizada.tipo,
        estado: otActualizada.estado,
        prioridad: otActualizada.prioridad,
        inicio_proceso: otActualizada.inicio_proceso || null,
        kilometraje_apertura: otActualizada.kilometrajeApertura ? Number(otActualizada.kilometrajeApertura) : 0,
        kilometraje_cierre: otActualizada.kilometrajeCierre ? Number(otActualizada.kilometrajeCierre) : null,
        fecha_creacion: otActualizada.fechaCreacion,
        fecha_programada: otActualizada.fechaProgramada || null,
        hora_inicio_programada: otActualizada.horaInicioProgramada || null,
        hora_termino_programada: otActualizada.horaTerminoProgramada || null,
        observacion_inicial: otActualizada.observacionInicial || null,
        diagnostico_evaluacion: otActualizada.diagnosticoEvaluacion || null,
        pauta: otActualizada.pauta || null,
        kit_repuestos: otActualizada.kitRepuestos || null,
        tipo_falla: otActualizada.tipoFalla || null,
        sintomas: otActualizada.sintomas || null,
        inspeccion_tren_motriz: otActualizada.inspeccionTrenMotriz || null,
        eje: otActualizada.eje || null,
        presion_neumatico: otActualizada.presionNeumatico ? Number(otActualizada.presionNeumatico) : null,
        personal_operativo: otActualizada.personalOperativo || null,
        proveedor: otActualizada.proveedor || null,
        empresa_externa: otActualizada.empresaExterna || null,
        rut_empresa: otActualizada.rutEmpresa || null,
        valor_hh: otActualizada.valorHH ? Number(otActualizada.valorHH) : null,
        presupuesto_aprobado: otActualizada.presupuestoAprobado ? Number(otActualizada.presupuestoAprobado) : null,
        observaciones: otActualizada.observaciones || null,
        costo_insumos: otActualizada.costoInsumos ? Number(otActualizada.costoInsumos) : 0,
        costo_mano_obra_tareas: otActualizada.costoManoObraTareas ? Number(otActualizada.costoManoObraTareas) : 0,
        costo_mano_obra_hh: otActualizada.costoManoObraHH ? Number(otActualizada.costoManoObraHH) : 0,
        tiempo_trabajado_segundos: otActualizada.tiempoTrabajadoSegundos ? Number(otActualizada.tiempoTrabajadoSegundos) : 0
      };

      const { error } = await supabase.from('orden_de_trabajo').update(dbPayload).eq('id', otActualizada.id);
      if (error) {
        console.error("Error updating work order in database:", error);
        setOrdenesTrabajo(originalOts);
        Swal.fire({
          title: "Error al Actualizar OT",
          text: `La base de datos rechazó los cambios: ${error.message}`,
          icon: "error",
          confirmButtonColor: "#4f46e5"
        });
      } else {
        console.log("Work order successfully updated in Supabase database!");
        
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
              id: t.id && t.id.length > 20 ? t.id : generateUUID(), // ensure UUID
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
          const { error: delInsumosErr } = await supabase.from('detalle_insumo_ot').delete().eq('orden_id', otActualizada.id);
          if (delInsumosErr) {
            console.error("Error deleting old detalle_insumo_ot:", delInsumosErr);
            throw new Error(`No se pudieron limpiar los insumos anteriores: ${delInsumosErr.message}`);
          }
          if (otActualizada.insumos.length > 0) {
            // Pre-ensure catalog entries exist to satisfy foreign keys
            for (const item of otActualizada.insumos) {
              if (item.repuesto) {
                try {
                  await supabase.from('repuesto').upsert({
                    id: item.repuesto.id,
                    sku: item.repuesto.sku || item.repuesto.referencia || Math.random().toString(36).substr(2, 9),
                    nombre: item.repuesto.nombre || 'Repuesto',
                    stock_actual: Number(item.repuesto.stock_actual || 0),
                    costo_unitario: Number(item.repuesto.costo_unitario || item.repuesto.costo_unitario_aplicado || item.repuesto.costo_unitario || 0)
                  });
                } catch (errRec) {
                  console.warn("Failed to pre-upsert repuesto, continuing:", errRec);
                }
              }
            }

            const insertPayload = otActualizada.insumos.map(i => ({
              id: i.id && i.id.length > 20 ? i.id : generateUUID(),
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
        }
        
        // Historial de la OT
        if (otActualizada.historial) {
          const { error: delHistErr } = await supabase.from('historial_ot').delete().eq('orden_id', otActualizada.id);
          if (delHistErr) {
            console.error("Error deleting old historial_ot:", delHistErr);
            throw new Error(`No se pudo limpiar el historial anterior: ${delHistErr.message}`);
          }
          if (otActualizada.historial.length > 0) {
            const insertPayload = otActualizada.historial.map(h => ({
              id: h.id && h.id.length > 20 ? h.id : generateUUID(),
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
                id: s.id && s.id.length > 20 ? s.id : generateUUID(),
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

        Swal.fire({
          title: "¡Actualización Exitosa!",
          text: `La orden de trabajo ${otActualizada.folio} se ha actualizado correctamente.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err: any) {
      console.error(err);
      setOrdenesTrabajo(originalOts);
      Swal.fire({
        title: "Error al actualizar",
        text: err?.message || "Ocurrió un error inesperado al guardar los cambios en la base de datos.",
        icon: "error",
        confirmButtonColor: "#4f46e5"
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

  return (
    <AppContext.Provider value={{ reservasTurismo, ordenesTrabajo, conductores, vehiculos, pautas, tareasEstandar, tiposFalla, kitsRepuesto, repuestos, setRepuestos, usuarios, currentUser, setCurrentUser, proveedores, personal, setPersonal, crearReservaTurismo, crearOrdenTrabajo, eliminarOrdenTrabajo, actualizarOrdenTrabajo, crearTipoFalla, eliminarTipoFalla, actualizarTipoFalla, crearKitRepuesto, eliminarKitRepuesto, crearProveedor, eliminarProveedor }}>
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
