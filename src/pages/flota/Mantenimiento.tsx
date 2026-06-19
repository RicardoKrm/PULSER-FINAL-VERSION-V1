import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  Search, Filter, Plus, FileSpreadsheet, AlertTriangle, 
  CheckCircle, Clock, Truck, ChevronRight, Activity, Wrench,
  MoreVertical, Edit3, History, TrendingUp, Archive, Trash2,
  Table as TableIcon, List, Eye, ArrowLeft
} from 'lucide-react';
import Swal from 'sweetalert2';
import { CrearOTModal } from '../../components/flota/CrearOTModal';
import { CrearVehiculoModal } from '../../components/flota/CrearVehiculoModal';
import { Modal } from '../../components/ui/Modal';
import { calcularDatosPizarra, FilaPizarraMantenimiento, generarSecuenciaParaPauta, HitoSecuencia } from '../../lib/mantenimientoLogica';
import { useAppContext } from '../../context/AppContext';
import { usePermissions } from '../../hooks/usePermissions';

export default function PizarraMantenimiento() {
  const { currentCompany } = useCompany();
  const { ordenesTrabajo } = useAppContext();
  const { hasPermission } = usePermissions();
  const canCrearOT = hasPermission('Módulo de Mantenimiento:Crear Órdenes');
  const canVerVehiculos = hasPermission('Módulo de Flota:Ver Vehículos');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(true);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | number | null>(null);
  const [modalOTOpen, setModalOTOpen] = useState(false);
  const [vehiculoSeleccionadoOT, setVehiculoSeleccionadoOT] = useState<string | undefined>();
  const [selectedVehicleRow, setSelectedVehicleRow] = useState<string | number | null>(null);
  const [vistaTabla, setVistaTabla] = useState(false);
  const [fichaTecnicaVehiculo, setFichaTecnicaVehiculo] = useState<any | null>(null);
  const [isEditingFicha, setIsEditingFicha] = useState(false);
  const [editFichaData, setEditFichaData] = useState<any>({
    marca: '',
    modelo: '',
    ano: '',
    fechaMatriculacion: '',
    chasis: '',
    motor: '',
    norma: '',
    aplicacion: '',
    tipoAceite: ''
  });

  useEffect(() => {
    if (fichaTecnicaVehiculo) {
      setIsEditingFicha(false);
      setEditFichaData({
        marca: fichaTecnicaVehiculo.marca || '',
        modelo: fichaTecnicaVehiculo.modelo || '',
        ano: fichaTecnicaVehiculo.ano || fichaTecnicaVehiculo.anio || '',
        fechaMatriculacion: fichaTecnicaVehiculo.detalles?.fecha_matriculacion || fichaTecnicaVehiculo.fecha_matriculacion || '',
        chasis: fichaTecnicaVehiculo.chasis || '',
        motor: fichaTecnicaVehiculo.motor || '',
        norma: fichaTecnicaVehiculo.norma || '',
        aplicacion: fichaTecnicaVehiculo.aplicacion || '',
        tipoAceite: fichaTecnicaVehiculo.tipoAceite || ''
      });
    }
  }, [fichaTecnicaVehiculo]);

  const [historialVehiculo, setHistorialVehiculo] = useState<any | null>(null);
  const navigate = useNavigate();
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActionMenuOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Mocks for dropdowns
  const modelos = ['Sprinter 315', 'Transit Custom', 'Rav4'];
  const tiposMantenimiento = ['Todos los tipos', 'Inicial', 'PM-1', 'PM-2', 'PM-3', 'PM-4'];

  const [filtroModelo, setFiltroModelo] = useState('');
  const [filtroTipoMant, setFiltroTipoMant] = useState('');
  const [soloProximosOVencidos, setSoloProximosOVencidos] = useState(false);
  const [modalVehiculoOpen, setModalVehiculoOpen] = useState(false);

  // States for Actualizar KM
  const [modalKMOpen, setModalKMOpen] = useState(false);
  const [vehiculoSeleccionadoKM, setVehiculoSeleccionadoKM] = useState<FilaPizarraMantenimiento | null>(null);
  const [nuevoKM, setNuevoKM] = useState('');
  const [fechaRegistroKM, setFechaRegistroKM] = useState('');

  const [filtroProxMantDesde, setFiltroProxMantDesde] = useState('');
  const [filtroProxMantHasta, setFiltroProxMantHasta] = useState('');
  const [filtroUltMantDesde, setFiltroUltMantDesde] = useState('');
  const [filtroUltMantHasta, setFiltroUltMantHasta] = useState('');

  const [dataFlota, setDataFlota] = useState<FilaPizarraMantenimiento[]>([]);

  const fetchVehiculos = async () => {
    if (!currentCompany?.id) return;
    try {
      const { data: vehiculosData, error: vehiculosError } = await supabase.from('vehiculo').select('*').eq('empresa_id', currentCompany.id);
      const { data: pautasData } = await supabase.from('mantenimiento_pauta').select('*, modelo:mantenimiento_modelo_vehiculo(nombre)').eq('empresa_id', currentCompany.id);

      if (vehiculosError) throw vehiculosError;
      
      console.log("FETCHED VEHICULOS DB:", vehiculosData);
      if (vehiculosData) {
        const vehiculosDb = vehiculosData.map(v => {
          const detalles = v.detalles || {};
            // Parse correct types
            const kmsActuales = typeof v.kilometraje_actual === 'number' ? v.kilometraje_actual : parseFloat(String(v.kilometraje_actual).replace(/[^0-9.-]+/g, '')) || 0;
            
            // Look at root first, then detalles as fallback
            const rawKmUlt = v.km_ultima_mantencion !== undefined ? v.km_ultima_mantencion : (detalles.km_ultima_mantencion !== undefined ? detalles.km_ultima_mantencion : 0);
            const kmUltMant = typeof rawKmUlt === 'number' ? rawKmUlt : parseFloat(String(rawKmUlt).replace(/[^0-9.-]+/g, '')) || 0;
            
            const rawInterval = v.intervalo_km !== undefined ? v.intervalo_km : (detalles.intervalo_km !== undefined ? detalles.intervalo_km : 10000);
            const kmInterv = typeof rawInterval === 'number' ? rawInterval : parseFloat(String(rawInterval).replace(/[^0-9.-]+/g, '')) || 10000;
            
            const pautasSecuenciaStr = v.tipo_ultimo_mant || v.tipo_ult_pauta || detalles.tipo_ultimo_mant || detalles.tipo_ult_pauta || '';
            const fechaUltMant = v.fecha_ultima_mantencion || v.fecha_ult_mantencion || detalles.fecha_ultima_mantencion || null;

            let pautasSecuencia: HitoSecuencia[] = [];

            if (pautasData) {
              const pautasDelVehiculo = pautasData.filter(p => {
                 const normalizeStr = (s: any) => String(s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
                 const vehModelo = normalizeStr(v.modelo);
                 const pModelo = normalizeStr(p.modelo?.nombre);
                 
                 const vehAciete = normalizeStr(v.tipo_aceite);
                 const pAciete = normalizeStr(p.tipo_aceite);

                 const isModelMatch = vehModelo === pModelo;
                 const isOilMatch = !pAciete || (vehAciete && pAciete === vehAciete);
                 
                 return isModelMatch && isOilMatch;
              });

              pautasDelVehiculo.forEach(p => {
                 const secuenciaPauta = generarSecuenciaParaPauta(p as any, kmsActuales);
                 pautasSecuencia = [...pautasSecuencia, ...secuenciaPauta];
              });
              
              // 4. Sort sequence mathematically
              pautasSecuencia.sort((a, b) => a.iteracion_km - b.iteracion_km);
              
              // 5. Remove duplicates by iteracion_km (keeping the first one, might want to be careful with which one, but prompt says "conserva solo uno")
              const uniqueKms = new Set();
              pautasSecuencia = pautasSecuencia.filter(item => {
                   if (!uniqueKms.has(item.iteracion_km)) {
                        uniqueKms.add(item.iteracion_km);
                        return true;
                   }
                   return false;
              });
            }

            return {
              id: v.id,
              numeroInterno: v.numero_interno?.toString() || '',
              patente: v.patente || '',
              kilometrajeActual: kmsActuales,
              fechaActualizacionKm: v.updated_at ? new Date(v.updated_at) : new Date(),
              intervaloMantencionKm: kmInterv,
              kmPromedioDia: v.km_promedio_dia || detalles.kmPromedioDia || 0,
              kmUltimaMantencion: kmUltMant,
              fechaUltimaMantencion: fechaUltMant ? new Date(fechaUltMant) : null,
              tipoUltimaPauta: pautasSecuenciaStr,
              pautasSecuencia,
              
              // Technical specifications mapping
              marca: v.marca || detalles.marca || '',
              modelo: v.modelo || detalles.modelo || '',
              ano: v.anio || v.ano || detalles.ano || detalles.anio || '',
              chasis: v.chasis || detalles.chasis || '',
              motor: v.motor || detalles.motor || '',
              norma: v.norma_euro || v.norma || detalles.norma_euro || detalles.norma || '',
              aplicacion: v.aplicacion || detalles.aplicacion || '',
              tipoAceite: v.tipo_aceite || v.tipoAceite || detalles.tipo_aceite || detalles.tipoAceite || '',
              fecha_matriculacion: v.fecha_matriculacion || detalles.fecha_matriculacion || '',
              detalles,
              intervaloMantenimiento: kmInterv,
              tipoIntervalo: v.tipo_intervalo || 'KM',
              factorConversionHoras: v.factor_conversion_horas || null
            };
          });

          const pizarraData = vehiculosDb.map(v => calcularDatosPizarra(v));
          pizarraData.sort((a,b) => String(a.numeroInterno).localeCompare(String(b.numeroInterno), undefined, {numeric: true}));
          setDataFlota(pizarraData);
          return vehiculosData;
        }
    } catch (err) {
      console.error('Error fetching vehiculos for Pizarra:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchVehiculos();
    
    // Auto-refresh the Pizarra every 1 minute to reflect background GPS updates
    const intervalId = setInterval(() => {
      fetchVehiculos();
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, [currentCompany?.id]);

  const handleGuardarKM = async () => {
    if (!vehiculoSeleccionadoKM || !nuevoKM || !fechaRegistroKM) return;
    
    // get old values
    // Remove dots or commas if user typed thousands separator, then parse int
    const cleanNuevoKM = nuevoKM.replace(/\./g, '').replace(/,/g, '');
    const newKmVal = parseInt(cleanNuevoKM, 10);
    
    if (isNaN(newKmVal)) {
        return;
    }

    const oldKmVal = vehiculoSeleccionadoKM.kilometrajeActual || 0;
    
    // get dates
    const newDate = new Date(fechaRegistroKM);
    const oldDateStr = vehiculoSeleccionadoKM.fechaActualizacionKm;
    const oldDate = oldDateStr instanceof Date ? oldDateStr : new Date(oldDateStr || new Date());
    
    // calc differences
    const diffTime = Math.abs(newDate.getTime() - oldDate.getTime());
    // Evitar que diffDays sea 0 para que siempre actualice el promedio si el KM cambió el mismo día
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    let baseKmPromedio = vehiculoSeleccionadoKM.kmPromedioDia || 0;

    if (newKmVal > oldKmVal) {
        const diffKm = newKmVal - oldKmVal;
        baseKmPromedio = Math.round(diffKm / diffDays);
        if (baseKmPromedio <= 0) baseKmPromedio = 51;
    } else if (baseKmPromedio === 0) {
        baseKmPromedio = 51;
    }

    try {
        const { data, error: selectErr } = await supabase.from('vehiculo').select('detalles').eq('id', vehiculoSeleccionadoKM.id).single();
        if (selectErr) throw selectErr;

        const existingDetalles = data?.detalles || {};
        if (baseKmPromedio > 0) {
            existingDetalles.kmPromedioDia = baseKmPromedio;
        }
        existingDetalles.fecha_actualizacion_km = newDate.toISOString();

        const payload: any = {
            kilometraje_actual: newKmVal,
            km_promedio_dia: baseKmPromedio,
            updated_at: newDate.toISOString(),
            detalles: existingDetalles
        };

        const { error } = await supabase.from('vehiculo').update(payload).eq('id', vehiculoSeleccionadoKM.id);
        if (error) {
            console.error("DB Update Error Payload:", payload);
            throw error;
        }
        
        setModalKMOpen(false);
        fetchVehiculos();
    } catch (e: any) {
        console.error('Error updating KM:', e);
        alert("Error al actualizar KM en la BD: " + (e.message || JSON.stringify(e)));
    }
  };

  const handleSaveFicha = async () => {
    if (!fichaTecnicaVehiculo) return;
    try {
      // Get existing details
      const { data, error: selectErr } = await supabase
        .from('vehiculo')
        .select('detalles')
        .eq('id', fichaTecnicaVehiculo.id)
        .single();
        
      const existingDetalles = data?.detalles || {};
      
      const payload: any = {
        marca: editFichaData.marca,
        modelo: editFichaData.modelo,
        anio: parseInt(editFichaData.ano || '0', 10) || null,
        chasis: editFichaData.chasis,
        motor: editFichaData.motor,
        norma_euro: editFichaData.norma,
        aplicacion: editFichaData.aplicacion,
        tipo_aceite: editFichaData.tipoAceite,
        detalles: {
          ...existingDetalles,
          marca: editFichaData.marca,
          modelo: editFichaData.modelo,
          ano: editFichaData.ano,
          anio: editFichaData.ano,
          chasis: editFichaData.chasis,
          motor: editFichaData.motor,
          norma: editFichaData.norma,
          norma_euro: editFichaData.norma,
          aplicacion: editFichaData.aplicacion,
          tipoAceite: editFichaData.tipoAceite,
          tipo_aceite: editFichaData.tipoAceite,
          fecha_matriculacion: editFichaData.fechaMatriculacion
        }
      };

      const { error } = await supabase
        .from('vehiculo')
        .update(payload)
        .eq('id', fichaTecnicaVehiculo.id);

      if (error) throw error;

      // Update local state
      setFichaTecnicaVehiculo({
        ...fichaTecnicaVehiculo,
        marca: editFichaData.marca,
        modelo: editFichaData.modelo,
        ano: editFichaData.ano,
        anio: editFichaData.ano,
        chasis: editFichaData.chasis,
        motor: editFichaData.motor,
        norma: editFichaData.norma,
        aplicacion: editFichaData.aplicacion,
        tipoAceite: editFichaData.tipoAceite,
        fecha_matriculacion: editFichaData.fechaMatriculacion,
        detalles: payload.detalles
      });
      
      setIsEditingFicha(false);
      // Refresh database records
      fetchVehiculos();
    } catch (e: any) {
      console.error('Error saving technical sheet:', e);
    }
  };

  const [kpiModal, setKpiModal] = useState<string | null>(null);

  const vehiculosFiltrados = dataFlota.filter(v => {
    if (busqueda && !(v.ppu || '').toLowerCase().includes(busqueda.toLowerCase()) && !v.numeroInterno.toLowerCase().includes(busqueda.toLowerCase())) {
      return false;
    }
    if (filtroModelo) {
       // Currently no model is generated but to safely pass:
       if ((v as any).modelo && (v as any).modelo !== filtroModelo) return false;
    }
    if (filtroTipoMant && filtroTipoMant !== 'Todos los tipos' && !(v.tipoProximoMantencion || '').includes(filtroTipoMant)) return false;
    if (soloProximosOVencidos && v.estatus === 'NORMAL') return false;
    
    // String comparisons on dates might be inaccurate but let's simply map them correctly if we can
    // We will bypass actual date comparison for this mockup, or just allow it:
    // ...
    
    return true;
  });

  const kpis = {
    vehiculosFiltrados: vehiculosFiltrados.length,
    porcentajeFlota: dataFlota.length > 0 ? Math.round((vehiculosFiltrados.length / dataFlota.length) * 100) : 0,
    nivelCumplimiento: dataFlota.length > 0 ? Math.round(100 - (dataFlota.filter(v => v.estatus === 'VENCIDO').length / dataFlota.length) * 100) : 100,
    costoTotal: 0,
    costoKm: 0
  };

  const handleArchive = (id: string | number) => {
    setDataFlota(dataFlota.filter(v => v.id !== id));
    setActionMenuOpen(null);
  };

  const handleDeletePermanent = async (id: string | number) => {
    const result = await Swal.fire({
      title: '¿Eliminar vehículo definitivamente?',
      text: "Esta acción no se puede deshacer y podría fallar si el vehículo tiene historial asociado.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase.from('vehiculo').delete().eq('id', id);
        if (error) throw error;
        
        setDataFlota(dataFlota.filter(v => v.id !== id));
        setActionMenuOpen(null);
        
        Swal.fire('Eliminado', 'El vehículo ha sido eliminado.', 'success');
      } catch (err: any) {
        console.error("Error al eliminar vehículo:", err);
        Swal.fire('Error', 'No se pudo eliminar el vehículo. Es posible que tenga registros asociados.', 'error');
      }
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'NORMAL':
        return <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase"><CheckCircle className="w-3 h-3 mr-1" /> NORMALIDAD</div>;
      case 'PROXIMO':
        return <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500 text-white shadow-sm uppercase"><Clock className="w-3 h-3 mr-1" /> MANT. PRÓX</div>;
      case 'VENCIDO':
        return <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white shadow-sm uppercase"><AlertTriangle className="w-3 h-3 mr-1" /> VENCIDO</div>;
      default:
        return <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500 text-white shadow-sm uppercase">{estado}</div>;
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'NORMAL': return <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />;
      case 'PROXIMO': return <div className="h-3 w-3 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse" />;
      case 'VENCIDO': return <div className="h-3 w-3 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-pulse" />;
      default: return null;
    }
  };

  const opcionesFecha: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const fechaTexto = new Date().toLocaleDateString('es-ES', opcionesFecha);
  const fechaHoy = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);

  const renderTablaDensa = () => (
    <Card className="shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] text-center border-collapse">
          <thead className="bg-[#f8f9fa] dark:bg-slate-900 border-b border-b-slate-200 dark:border-b-slate-700 text-slate-600 dark:text-slate-400 font-semibold whitespace-nowrap">
            <tr>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">N° Int. ▲</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">PPU</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">KM Últ. Mant.</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">F. Últ. Mant.</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">Tipo Mant.</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">Cumplimiento</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">Estatus</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">Km Vencido</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">Pauta Vencida</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">KM Actual</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">Fecha KM Actual</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">KM Próx. Mant.</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">Tipo Próx. Mant.</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">Semáf.</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">Fecha Próx. Mant.</th>
              <th className="px-2 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-300 bg-white dark:bg-slate-900">
            {vehiculosFiltrados.map((vehiculo) => {
              let cumplimientoColor = 'text-slate-700 dark:text-slate-300';
              if (vehiculo.cumplimiento === 'RETRASADO') cumplimientoColor = 'text-red-600 font-bold';
              else if (vehiculo.cumplimiento === 'ANTICIPADO') cumplimientoColor = 'text-emerald-600 font-bold';
              else if (vehiculo.cumplimiento === 'NORMAL') cumplimientoColor = 'text-slate-700 dark:text-slate-300 font-bold';

              return (
                <tr 
                  key={`dense-${vehiculo.id}`} 
                  onClick={() => setSelectedVehicleRow(String(vehiculo.id))}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${selectedVehicleRow === String(vehiculo.id) ? 'bg-blue-50 dark:bg-slate-800/50' : ''}`}
                >
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 font-bold text-blue-900 dark:text-blue-100 whitespace-nowrap">{vehiculo.numeroInterno}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-500 whitespace-nowrap">{vehiculo.ppu || '—'}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800">{vehiculo.kmUltimoMantencion ? vehiculo.kmUltimoMantencion.toLocaleString('es-CL') : '—'}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-500 whitespace-nowrap">{vehiculo.fechaUltimoMantencion || '—'}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 font-medium whitespace-nowrap">{vehiculo.tipoUltimoMantencion || 'N/A'}</td>
                  <td className={`px-2 py-2 border-r border-slate-200 dark:border-slate-800 ${cumplimientoColor}`}>{vehiculo.cumplimiento !== 'N/A' ? vehiculo.cumplimiento : '—'}</td>
                  <td className="px-1 py-1 border-r border-slate-200 dark:border-slate-800">
                    <div className="flex justify-center w-full transform scale-90">
                      {getStatusBadge(vehiculo.estatus)}
                    </div>
                  </td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-500">{vehiculo.kmVencido ? vehiculo.kmVencido.toLocaleString('es-CL') : '—'}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-500 whitespace-nowrap">{vehiculo.pautaVencida || '—'}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800">
                    <div>{vehiculo.kmActual ? vehiculo.kmActual.toLocaleString('es-CL') : '—'}</div>
                    {(vehiculo as any).tipo_intervalo === 'Horas' && (vehiculo as any).factor_conversion_horas && (
                      <div className="text-[10px] text-slate-500 mt-0.5" title="Horas Trabajadas Estimadas">
                        {Math.round((vehiculo.kmActual) / (vehiculo as any).factor_conversion_horas).toLocaleString('es-CL')} Hrs
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-500 whitespace-nowrap">{vehiculo.fechaKmActual || '—'}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800">
                    <div>{vehiculo.kmProximoMantencion ? vehiculo.kmProximoMantencion.toLocaleString('es-CL') : '—'}</div>
                    {(vehiculo as any).tipo_intervalo === 'Horas' && (vehiculo as any).factor_conversion_horas && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {Math.round(vehiculo.kmProximoMantencion! / (vehiculo as any).factor_conversion_horas).toLocaleString('es-CL')} Hrs
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 font-medium whitespace-nowrap">{vehiculo.tipoProximoMantencion}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800">
                    <div className="flex justify-center">
                      <div className={`h-3 w-3 rounded-full ${vehiculo.semaforoPeligro10Dias ? 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`} />
                    </div>
                  </td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-500 whitespace-nowrap">{vehiculo.fechaProximaMantencion || '—'}</td>
                  <td className="px-2 py-2 relative text-right">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={(e) => { e.stopPropagation(); setActionMenuOpen(actionMenuOpen === vehiculo.id ? null : vehiculo.id); }}>
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                    {actionMenuOpen === vehiculo.id && (
                      <div 
                        ref={menuRef}
                        className="absolute right-8 top-10 w-56 bg-white dark:bg-slate-900 rounded-md shadow-lg border border-slate-200 dark:border-slate-800 z-[100] overflow-hidden text-left"
                      >
                        <div className="py-1">
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center font-bold"
                            onClick={() => {
                              setVehiculoSeleccionadoOT(vehiculo.id.toString());
                              setModalOTOpen(true);
                              setActionMenuOpen(null);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" /> Crear OT
                          </button>
                          <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center font-medium"
                            onClick={() => {
                              setFichaTecnicaVehiculo(vehiculo);
                              setActionMenuOpen(null);
                            }}
                          >
                            <FileSpreadsheet className="w-4 h-4 mr-2 text-slate-500" /> Ficha Técnica
                          </button>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVehiculoSeleccionadoKM(vehiculo);
                              setNuevoKM(vehiculo.kilometrajeActual?.toString() || '');
                              setFechaRegistroKM(new Date().toISOString().split('T')[0]);
                              setModalKMOpen(true);
                              setActionMenuOpen(null);
                            }}
                          >
                            <Edit3 className="w-4 h-4 mr-2" /> Actualizar KM
                          </button>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center"
                            onClick={() => {
                              setHistorialVehiculo(vehiculo);
                              setActionMenuOpen(null);
                            }}
                          >
                            <History className="w-4 h-4 mr-2" /> Ver Historial
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2" /> Costos y Tendencias
                          </button>
                          <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center font-medium"
                            onClick={() => handleArchive(vehiculo.id)}
                          >
                            <Archive className="w-4 h-4 mr-2" /> Archivar Vehículo
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {vehiculosFiltrados.length === 0 && (
              <tr>
                <td colSpan={16} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                  No se encontraron vehículos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const getRealOTs = (vehiculo: any) => {
    if (!vehiculo) return [];
    return ordenesTrabajo
      .filter(o => String(o.vehiculoId) === String(vehiculo.id))
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
  };

  if (historialVehiculo) {
    const otsVehiculo = getRealOTs(historialVehiculo);
    return (
      <div className="space-y-6">
         <div className="flex justify-between items-start pt-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-1">Historial de Mantenimiento</h1>
              <p className="text-base text-slate-600 dark:text-slate-400">Vehículo: {historialVehiculo.numeroInterno} ({historialVehiculo.patente})</p>
            </div>
            <button onClick={() => setHistorialVehiculo(null)} className="inline-flex items-center justify-center rounded-md border border-transparent bg-slate-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-600 focus:outline-none dark:bg-slate-700 dark:hover:bg-slate-600">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </button>
         </div>
         <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900 rounded-xl">
           <CardContent className="p-0">
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-center">
                  <thead className="bg-white dark:bg-slate-900 border-b border-b-slate-100 dark:border-b-slate-800 text-slate-700 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-widest leading-loose">
                    <tr>
                      <th className="px-6 py-6 whitespace-nowrap">Folio</th>
                      <th className="px-6 py-6 whitespace-nowrap">Tipo</th>
                      <th className="px-6 py-6 whitespace-nowrap">Prioridad</th>
                      <th className="px-6 py-6 whitespace-nowrap">Estado</th>
                      <th className="px-6 py-6 whitespace-nowrap">Fecha Creación</th>
                      <th className="px-6 py-6 whitespace-nowrap">Fecha Cierre</th>
                      <th className="px-6 py-6 whitespace-nowrap">Costo Total</th>
                      <th className="px-6 py-6 whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {otsVehiculo.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-slate-500">No hay órdenes de trabajo en el historial.</td>
                      </tr>
                    )}
                    {otsVehiculo.map(ot => (
                      <tr key={ot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors h-16">
                        <td className="px-6 whitespace-nowrap font-medium text-slate-800 dark:text-slate-300">{ot.folio}</td>
                        <td className="px-6 whitespace-nowrap text-slate-600 dark:text-slate-400">{ot.tipo}</td>
                        <td className="px-6 whitespace-nowrap text-slate-600 dark:text-slate-400">{ot.prioridad}</td>
                        <td className="px-6 whitespace-nowrap justify-center p-0 align-middle">
                          <div className="flex justify-center items-center h-full w-full">
                            <span className={`inline-flex items-center px-4 py-1 rounded-full text-[11px] font-bold text-white shadow-sm ${ot.estado === 'FINALIZADA' ? 'bg-[#10b981]' : ot.estado === 'ABIERTA' || ot.estado === 'PROGRAMADA' ? 'bg-blue-500' : 'bg-amber-500'}`}>
                              {ot.estado.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 whitespace-nowrap text-slate-600 dark:text-slate-400">{new Date(ot.fechaCreacion).toLocaleDateString()}</td>
                        <td className="px-6 whitespace-nowrap text-slate-600 dark:text-slate-400">{ot.estado === 'FINALIZADA' || ot.estado === 'CERRADA_POR_MECANICO' ? new Date(ot.fechaCreacion).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 whitespace-nowrap text-slate-600 dark:text-slate-400">
                          ${((ot.costoInsumos || 0) + (ot.costoManoObraHH || 0) + (ot.costoManoObraTareas || 0)).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 whitespace-nowrap text-center">
                          <div className="flex justify-center">
                            <Button
                              variant="default"
                              size="sm"
                              className="w-[42px] h-[26px] p-0 bg-[#38bdf8] hover:bg-[#0ea5e9] text-white shadow-sm border-none rounded justify-center items-center flex"
                              onClick={() => navigate(`/flota/ordenes-trabajo/${ot.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
           </CardContent>
         </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Pizarra de Mantenimiento</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="default" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 border-blue-200 shadow-sm border dark:border-slate-800 font-medium px-2.5 py-0.5">
              <Clock className="w-3 h-3 mr-1.5" />
              {fechaHoy}
            </Badge>
            <p className="text-sm text-slate-500 dark:text-slate-400">Visión general del estado de la flota y próximos mantenimientos</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            onClick={() => setVistaTabla(!vistaTabla)}
          >
            {vistaTabla ? (
              <><List className="w-4 h-4 mr-2" /> Vista Tarjetas</>
            ) : (
              <><TableIcon className="w-4 h-4 mr-2" /> Vista Tabla</>
            )}
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            onClick={() => {
              setModalVehiculoOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Vehículo
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vehículos Visualizados</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.vehiculosFiltrados}</h3>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">({kpis.porcentajeFlota}%)</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          onClick={() => setKpiModal('cumplimiento')}
        >
          <CardContent className="p-4 flex items-center justify-between relative">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cumplimiento del Cronograma</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{kpis.nivelCumplimiento}%</h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          onClick={() => setKpiModal('costo_total')}
        >
          <CardContent className="p-4 flex items-center justify-between relative">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Costo Total Mant. <span className="text-[10px]">(PREV. + CORR)</span></p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">${kpis.costoTotal.toLocaleString('es-CL')}</h3>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          onClick={() => setKpiModal('costo_promedio')}
        >
          <CardContent className="p-4 flex items-center justify-between relative">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Costo Promedio / KM</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">${kpis.costoKm}</h3>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 group-hover:scale-110 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Buscador */}
      <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por equipo, patente o modelo..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:bg-slate-900 transition-colors"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Button 
                variant={mostrarFiltros ? "default" : "outline"} 
                className={mostrarFiltros ? "bg-blue-600 hover:bg-blue-700 h-9" : "bg-white dark:bg-slate-900 h-9"}
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros Avanzados
              </Button>
            </div>
          </div>

          {mostrarFiltros && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Modelo</label>
                <select 
                  className="w-full bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-b dark:border-slate-800lue-500"
                  value={filtroModelo}
                  onChange={(e) => setFiltroModelo(e.target.value)}
                >
                  <option value="">Todos los modelos</option>
                  {modelos.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tipo de Mantenimiento</label>
                <select 
                  className="w-full bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-b dark:border-slate-800lue-500"
                  value={filtroTipoMant}
                  onChange={(e) => setFiltroTipoMant(e.target.value)}
                >
                  {tiposMantenimiento.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Próx. Mantenimiento Desde</label>
                <input 
                  type="date" 
                  className="w-full bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-b dark:border-slate-800lue-500" 
                  value={filtroProxMantDesde}
                  onChange={(e) => setFiltroProxMantDesde(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Próx. Mantenimiento Hasta</label>
                <input 
                  type="date" 
                  className="w-full bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-b dark:border-slate-800lue-500" 
                  value={filtroProxMantHasta}
                  onChange={(e) => setFiltroProxMantHasta(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Último Mantenimiento Desde</label>
                <input 
                  type="date" 
                  className="w-full bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-b dark:border-slate-800lue-500" 
                  value={filtroUltMantDesde}
                  onChange={(e) => setFiltroUltMantDesde(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Último Mantenimiento Hasta</label>
                <input 
                  type="date" 
                  className="w-full bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-b dark:border-slate-800lue-500" 
                  value={filtroUltMantHasta}
                  onChange={(e) => setFiltroUltMantHasta(e.target.value)}
                />
              </div>
              <div className="space-y-1 md:col-span-2 flex items-end">
                <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/30 border dark:border-slate-800 border-orange-200 rounded-lg w-full">
                  <input 
                    type="checkbox" 
                    id="proximos_alerta" 
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300 dark:border-slate-700 dark:text-slate-100" 
                    checked={soloProximosOVencidos}
                    onChange={(e) => setSoloProximosOVencidos(e.target.checked)}
                  />
                  <label htmlFor="proximos_alerta" className="text-sm font-medium text-orange-800 cursor-pointer w-full h-full block">
                    Mostrar solo vehículos con mantenimientos PRÓXIMOS o VENCIDOS
                  </label>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla Maestro de Flota */}
      {vistaTabla ? (
        renderTablaDensa()
      ) : (
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                <tr>
                <th className="px-5 py-4 w-12 text-center"></th>
                <th className="px-5 py-4 w-12 text-center">STS</th>
                <th className="px-5 py-4">Vehículo</th>
                <th className="px-5 py-4">KM Actual</th>
                <th className="px-5 py-4">Último Mantenimiento</th>
                <th className="px-5 py-4">Próximo Mantenimiento</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {vehiculosFiltrados.map((vehiculo) => (
                <tr 
                  key={vehiculo.id} 
                  onClick={() => setSelectedVehicleRow(String(vehiculo.id))}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer ${selectedVehicleRow === String(vehiculo.id) ? 'bg-blue-50 dark:bg-slate-800/50' : 'dark:bg-slate-900/50'}`}
                >
                  <td className="px-5 py-4 text-center">
                    <input 
                      type="radio" 
                      name="selectedVehicle"
                      className="w-4 h-4 text-blue-600 rounded-full focus:ring-blue-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                      checked={selectedVehicleRow === String(vehiculo.id)}
                      onChange={() => setSelectedVehicleRow(String(vehiculo.id))}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      {getStatusIcon(vehiculo.estatus)}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{vehiculo.numeroInterno}</span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{vehiculo.ppu || '—'}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 transition-colors uppercase mt-0.5">{(vehiculo as any).marca} {(vehiculo as any).modelo}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="font-mono text-slate-900 dark:text-slate-100 font-semibold bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded inline-block w-fit">
                        {vehiculo.kmActual ? vehiculo.kmActual.toLocaleString('es-CL') : '—'} km
                      </div>
                      {(vehiculo as any).tipo_intervalo === 'Horas' && (vehiculo as any).factor_conversion_horas && (
                        <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.round((vehiculo.kmActual) / (vehiculo as any).factor_conversion_horas).toLocaleString('es-CL')} Hrs.
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-medium">
                        <CheckCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        {vehiculo.kmUltimoMantencion ? vehiculo.kmUltimoMantencion.toLocaleString('es-CL') : '—'} km
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {vehiculo.fechaUltimoMantencion || '—'}
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded w-fit uppercase">
                        {vehiculo.tipoUltimoMantencion || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                        <Activity className="w-3.5 h-3.5" />
                        Próx. Mant.: {vehiculo.kmProximoMantencion ? vehiculo.kmProximoMantencion.toLocaleString('es-CL') : '—'} km
                      </div>
                      <div className="text-xs font-medium text-slate-500">
                        (Faltan: {vehiculo.kmProximoMantencion ? (vehiculo.kmProximoMantencion - vehiculo.kmActual).toLocaleString('es-CL') : 0} km)
                      </div>
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Fecha Próx.: {vehiculo.fechaProximaMantencion || '—'}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded w-fit uppercase">
                          Tipo: {vehiculo.tipoProximoMantencion}
                        </span>
                      </div>
                      
                      {/* Mostrar pauta vencida si es VENCIDO */}
                      {vehiculo.estatus === 'VENCIDO' && vehiculo.pautaVencida && (
                        <div className="mt-2 p-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                           <div className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase mb-0.5">
                             Pauta Vencida: {vehiculo.pautaVencida}
                           </div>
                           <div className="text-[10px] font-medium text-red-600 dark:text-red-500">
                             Excedido por: {vehiculo.kmVencido?.toLocaleString('es-CL')} km
                           </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {getStatusBadge(vehiculo.estatus)}
                  </td>
                  <td className="px-5 py-4 text-right relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-500"
                      onClick={() => setActionMenuOpen(actionMenuOpen === vehiculo.id ? null : vehiculo.id)}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                    {actionMenuOpen === vehiculo.id && (
                      <div 
                        ref={menuRef}
                        className="absolute right-8 top-10 w-56 bg-white dark:bg-slate-900 rounded-md shadow-lg border border-slate-200 dark:border-slate-800 z-50 overflow-hidden text-left"
                      >
                        <div className="py-1">
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center font-bold"
                            onClick={() => {
                              setVehiculoSeleccionadoOT(vehiculo.id.toString());
                              setModalOTOpen(true);
                              setActionMenuOpen(null);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" /> Crear OT
                          </button>
                          <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center font-medium"
                            onClick={() => {
                              setFichaTecnicaVehiculo(vehiculo);
                              setActionMenuOpen(null);
                            }}
                          >
                            <FileSpreadsheet className="w-4 h-4 mr-2 text-slate-500" /> Ficha Técnica
                          </button>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVehiculoSeleccionadoKM(vehiculo);
                              setNuevoKM(vehiculo.kilometrajeActual?.toString() || '');
                              setFechaRegistroKM(new Date().toISOString().split('T')[0]);
                              setModalKMOpen(true);
                              setActionMenuOpen(null);
                            }}
                          >
                            <Edit3 className="w-4 h-4 mr-2" /> Actualizar KM
                          </button>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHistorialVehiculo(vehiculo);
                              setActionMenuOpen(null);
                            }}
                          >
                            <History className="w-4 h-4 mr-2" /> Ver Historial
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2" /> Costos y Tendencias
                          </button>
                          <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center font-medium"
                            onClick={() => handleArchive(vehiculo.id)}
                          >
                            <Archive className="w-4 h-4 mr-2" /> Archivar Vehículo
                          </button>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                            onClick={() => handleDeletePermanent(vehiculo.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar Definitivamente
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {vehiculosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                    No se encontraron vehículos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </Card>
      )}
      {modalOTOpen && (
        <CrearOTModal 
          isOpen={modalOTOpen} 
          onClose={() => setModalOTOpen(false)} 
          vehiculoPreseleccionadoId={vehiculoSeleccionadoOT}
        />
      )}
      {modalVehiculoOpen && (
        <CrearVehiculoModal 
          isOpen={modalVehiculoOpen} 
          onClose={() => setModalVehiculoOpen(false)} 
        />
      )}
      <Modal isOpen={kpiModal === 'cumplimiento'} onClose={() => setKpiModal(null)} title="Detalle KPI: Cumplimiento del Cronograma">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Este KPI mide la proporción de vehículos que se encuentran al día o anticipados con sus pautas de mantenimiento respecto al total de la flota activa, castigando solo los mantenimientos vencidos.</p>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-3 text-sm">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-md shadow-sm border border-slate-100 dark:border-slate-700/50">
              <span className="font-medium text-slate-700 dark:text-slate-300">Total Flota Activa</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{dataFlota.length}</span>
            </div>
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-md shadow-sm border border-slate-100 dark:border-slate-700/50">
              <span className="font-medium text-slate-700 dark:text-slate-300">Vehículos Vencidos (Incumplimientos)</span>
              <span className="font-bold text-red-600">{dataFlota.filter(v => v.estatus === 'VENCIDO').length}</span>
            </div>
            <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-md shadow-sm border border-emerald-100 dark:border-emerald-800/30">
              <span className="font-bold text-emerald-800 dark:text-emerald-300">Nivel de Cumplimiento</span>
              <span className="font-extrabold text-2xl text-emerald-600 dark:text-emerald-400">{kpis.nivelCumplimiento}%</span>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={kpiModal === 'costo_total'} onClose={() => setKpiModal(null)} title="Detalle KPI: Costo Total Mantenimiento">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Desglose acumulado de los gastos en órdenes de trabajo que han sido completadas.</p>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Mantenimiento Preventivo</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">$0</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Mantenimiento Correctivo</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">$0</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 my-2 pt-2 flex justify-between items-center">
              <span className="font-bold">Total Acumulado</span>
              <span className="font-bold text-orange-600">$0</span>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={kpiModal === 'costo_promedio'} onClose={() => setKpiModal(null)} title="Detalle KPI: Costo Promedio por KM">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Este valor se calcula al dividir el costo total de los mantenimientos sobre los kilómetros totaes acumulados, indicando qué tan caro es mantener la flota por kilómetro recorrido.</p>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Costo Total Mant.</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">$0</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">KM Acumulados</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">0 km</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 my-2 pt-2 flex justify-between items-center">
              <span className="font-bold">Costo Promedio</span>
              <span className="font-bold text-purple-600">$0 / km</span>
            </div>
          </div>
        </div>
      </Modal>

      {fichaTecnicaVehiculo && (
        <Modal 
          isOpen={!!fichaTecnicaVehiculo} 
          onClose={() => setFichaTecnicaVehiculo(null)} 
          title={`Ficha Técnica - ${fichaTecnicaVehiculo.numeroInterno} (${fichaTecnicaVehiculo.patente})`}
        >
          <div className="space-y-6 text-sm">
            {!isEditingFicha ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Marca / Modelo</span>
                    <span className="font-bold">{fichaTecnicaVehiculo.marca || '--'} {fichaTecnicaVehiculo.modelo || ''}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Año de Fabricación</span>
                    <span className="font-bold">{fichaTecnicaVehiculo.ano || '--'}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Patente (PPU)</span>
                    <span className="font-bold">{fichaTecnicaVehiculo.patente || '--'}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fecha de Matriculación</span>
                    <span className="font-bold">{fichaTecnicaVehiculo.fecha_matriculacion || '--'}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">N° de Chasis (VIN)</span>
                    <span className="font-bold font-mono">{fichaTecnicaVehiculo.chasis || '--'}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Motorización</span>
                    <span className="font-bold">{fichaTecnicaVehiculo.motor || '--'}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Norma de Emisión</span>
                    <span className="font-bold">{fichaTecnicaVehiculo.norma || '--'}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Aplicación Operativa</span>
                    <span className="font-bold">{fichaTecnicaVehiculo.aplicacion || '--'}</span>
                  </div>
                  <div className="col-span-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo de Aceite</span>
                    <span className="font-bold">{fichaTecnicaVehiculo.tipoAceite || '--'}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button 
                    onClick={() => setIsEditingFicha(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" /> Editar Ficha Técnica
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Marca</label>
                    <input 
                      type="text" 
                      value={editFichaData.marca} 
                      onChange={(e) => setEditFichaData({ ...editFichaData, marca: e.target.value })} 
                      className="w-full p-2 border rounded rounded-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Modelo</label>
                    <input 
                      type="text" 
                      value={editFichaData.modelo} 
                      onChange={(e) => setEditFichaData({ ...editFichaData, modelo: e.target.value })} 
                      className="w-full p-2 border rounded rounded-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Año de Fabricación</label>
                    <input 
                      type="number" 
                      value={editFichaData.ano} 
                      onChange={(e) => setEditFichaData({ ...editFichaData, ano: e.target.value })} 
                      className="w-full p-2 border rounded rounded-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fecha de Matriculación</label>
                    <input 
                      type="date" 
                      value={editFichaData.fechaMatriculacion} 
                      onChange={(e) => setEditFichaData({ ...editFichaData, fechaMatriculacion: e.target.value })} 
                      className="w-full p-2 border rounded rounded-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">N° de Chasis (VIN)</label>
                    <input 
                      type="text" 
                      value={editFichaData.chasis} 
                      onChange={(e) => setEditFichaData({ ...editFichaData, chasis: e.target.value })} 
                      className="w-full p-2 border rounded rounded-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Motorización</label>
                    <input 
                      type="text" 
                      value={editFichaData.motor} 
                      onChange={(e) => setEditFichaData({ ...editFichaData, motor: e.target.value })} 
                      className="w-full p-2 border rounded rounded-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Norma de Emisión</label>
                    <input 
                      type="text" 
                      value={editFichaData.norma} 
                      onChange={(e) => setEditFichaData({ ...editFichaData, norma: e.target.value })} 
                      className="w-full p-2 border rounded rounded-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Aplicación Operativa</label>
                    <input 
                      type="text" 
                      value={editFichaData.aplicacion} 
                      onChange={(e) => setEditFichaData({ ...editFichaData, aplicacion: e.target.value })} 
                      className="w-full p-2 border rounded rounded-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo de Aceite</label>
                    <input 
                      type="text" 
                      value={editFichaData.tipoAceite} 
                      onChange={(e) => setEditFichaData({ ...editFichaData, tipoAceite: e.target.value })} 
                      className="w-full p-2 border rounded rounded-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" 
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-700">
                  <Button 
                    onClick={() => setIsEditingFicha(false)}
                    variant="outline"
                    className="border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSaveFicha}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Guardar Cambios
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 p-4 rounded-lg">
              <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Plan de Mantenimiento Preventivo
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase">Intervalo Base</span>
                  <span className="font-bold text-lg">
                    {fichaTecnicaVehiculo.intervaloMantenimiento?.toLocaleString('es-CL') || '--'} {fichaTecnicaVehiculo.tipoIntervalo}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase">Avanzado Actual</span>
                  <span className="font-bold text-lg">
                    {fichaTecnicaVehiculo.kmActual.toLocaleString('es-CL')} KM
                  </span>
                </div>
                {fichaTecnicaVehiculo.tipoIntervalo === 'Horas' && fichaTecnicaVehiculo.factorConversionHoras && (
                  <div className="col-span-2 mt-2 pt-2 border-t border-blue-200 dark:border-blue-800/50">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Factor de Conversión:</span>
                      <span className="font-bold">{fichaTecnicaVehiculo.factorConversionHoras} Km/h (Estimado)</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Total Horas Trabajadas:</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {Math.round(fichaTecnicaVehiculo.kmActual / fichaTecnicaVehiculo.factorConversionHoras).toLocaleString('es-CL')} Hrs.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
      
      {modalKMOpen && vehiculoSeleccionadoKM && (
        <Modal 
          isOpen={modalKMOpen} 
          onClose={() => setModalKMOpen(false)} 
          title={`Actualizar KM para N° ${vehiculoSeleccionadoKM.numeroInterno || vehiculoSeleccionadoKM.patente}`}
          size="sm"
        >
          <div className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nuevo Kilometraje
                </label>
                <input
                  type="text"
                  className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="Ej: 276.167 o 276167"
                  value={nuevoKM}
                  onChange={(e) => setNuevoKM(e.target.value)}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Fecha del Registro
                </label>
                <input
                  type="date"
                  className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  value={fechaRegistroKM}
                  onChange={(e) => setFechaRegistroKM(e.target.value)}
                />
             </div>
             <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" onClick={() => setModalKMOpen(false)}>
                   Cancelar
                </Button>
                <Button onClick={handleGuardarKM}>
                   Guardar
                </Button>
             </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
