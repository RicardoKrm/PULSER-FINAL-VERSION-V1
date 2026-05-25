import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useCompany } from '../contexts/CompanyContext';
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
      const { data: pautasData } = await supabase.from('mantenimiento_pauta').select('*').eq('empresa_id', activeCompanyId);
      if (pautasData) {
        setPautas(pautasData.map(p => ({ id: p.id, nombre: p.nombre, kmRecomendado: p.kilometraje_inicial || 0 } as any)));
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
        setPersonal(colabData.map(c => ({
          ...c,
          name: c.nombre_completo || c.name || '',
          email: c.email || '',
          phone: c.telefono || '',
          roleBadgeText: c.cargo || c.roleBadgeText || '',
          // Add default avatar/stats for UI compatibility
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nombre_completo || c.name || '')}&background=random`,
          performanceScore: c.performanceScore || 0,
          pendingTasks: c.pendingTasks || 0,
        })));
      }

    };

    fetchAllData();
  }, [activeCompanyId]);

  const crearReservaTurismo = (reserva: ReservaTurismo) => {
    // Logic for adding a reservation
  };
  
  const crearOrdenTrabajo = (ot: OrdenDeTrabajo) => {
    setOrdenesTrabajo([...ordenesTrabajo, ot]);
  };

  const eliminarOrdenTrabajo = (id: string) => {
    setOrdenesTrabajo(ordenesTrabajo.filter(ot => ot.id !== id));
  };

  const actualizarOrdenTrabajo = (otActualizada: OrdenDeTrabajo) => {
    setOrdenesTrabajo(ordenesTrabajo.map(ot => ot.id === otActualizada.id ? otActualizada : ot));
  };

  const crearTipoFalla = (tipoFalla: TipoFalla) => {
    setTiposFalla([...tiposFalla, tipoFalla]);
  };

  const eliminarTipoFalla = (id: string) => {
    setTiposFalla(tiposFalla.filter(tf => tf.id !== id));
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
    <AppContext.Provider value={{ reservasTurismo, ordenesTrabajo, conductores, vehiculos, pautas, tareasEstandar, tiposFalla, kitsRepuesto, repuestos, setRepuestos, usuarios, currentUser, setCurrentUser, proveedores, personal, setPersonal, crearReservaTurismo, crearOrdenTrabajo, eliminarOrdenTrabajo, actualizarOrdenTrabajo, crearTipoFalla, eliminarTipoFalla, crearKitRepuesto, eliminarKitRepuesto, crearProveedor, eliminarProveedor }}>
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
