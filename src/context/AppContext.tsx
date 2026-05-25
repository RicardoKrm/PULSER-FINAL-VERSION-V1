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
      // Fetch Tareas
      const { data: tareasData } = await supabase.from('tarea_estandar').select('*').eq('empresa_id', activeCompanyId);
      if (tareasData) {
        setTareasEstandar(tareasData.map(t => ({ id: t.id, descripcion: t.descripcion, tiempoEstandarMinutos: t.tiempo_estandar_minutos, costoManoObra: t.costo_base })));
      }

      // Fetch Tipos Falla
      let allFallasData: any[] = [];
      let hasMoreFallas = true;
      let startF = 0;
      const pageSize = 1000;
      
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
      const { data: vehiculosData } = await supabase.from('vehiculo').select('*');
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
      const { data: repData } = await supabase.from('repuesto').select('*');
      if (repData) {
        setRepuestos(repData.map(r => ({ ...r, stock_actual: Number(r.stock_actual), costo_unitario: Number(r.costo_unitario) })));
      }

      // Fetch Kits
      const { data: kitsData } = await supabase.from('kit_repuesto').select(`
        id, nombre, descripcion,
        kit_repuesto_detalle ( repuesto, cantidad )
      `);
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
      const { data: otsData } = await supabase.from('orden_de_trabajo').select('*');
      if (otsData) {
        setOrdenesTrabajo(otsData.map(row => ({
          id: row.id,
          folio: row.folio,
          vehiculoId: row.vehiculo_id,
          tecnicoResponsable: row.tecnico_responsable || undefined,
          responsable_id: row.responsable_id || undefined,
          tipo: row.tipo as any,
          estado: row.estado as any,
          prioridad: row.prioridad as any,
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
          tareasRealizadas: [],
          insumos: [],
          historial: []
        })));
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
        title: "Error Inesperado",
        text: `Ocurrió un error al intentar actualizar la OT: ${err.message || err}`,
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
