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
  const [vehiculos] = useState<Vehiculo[]>([]);
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
      const { data: fallasData } = await supabase.from('tipo_falla').select('*').eq('empresa_id', activeCompanyId).limit(10000);
      if (fallasData) {
        setTiposFalla(fallasData.map(f => ({ 
           id: f.id, 
           nombre: f.nombre || f.descripcion, 
           descripcion: f.descripcion,
           modelo_afectado: f.modelo_afectado,
           criticidad: f.criticidad,
           causa: f.causa,
           tfs_predeterminado_horas: Number(f.tfs_predeterminado_horas)
        } as any)));
      }

      // Fetch Pautas
      const { data: pautasData } = await supabase.from('pauta_mantenimiento').select('*').eq('empresa_id', activeCompanyId);
      if (pautasData) {
        setPautas(pautasData.map(p => ({ id: p.id, nombre: p.nombre, kmRecomendado: p.km_aplicacion } as any)));
      }

      // Fetch Repuestos
      const { data: repData } = await supabase.from('repuesto').select('*');
      if (repData) {
        setRepuestos(repData.map(r => ({ ...r, stock_actual: Number(r.stock_actual), costo_unitario: Number(r.costo_unitario) })));
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
