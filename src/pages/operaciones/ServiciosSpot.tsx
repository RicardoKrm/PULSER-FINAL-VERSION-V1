import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, Truck, Calendar, DollarSign, AlertTriangle, CheckCircle2, Clock, 
  Plus, Search, Filter, ArrowUpRight, FileText, Layers, ShieldCheck, 
  Scale, Activity, Eye, Edit, Trash2, ArrowRight, X, ChevronRight,
  Info, Check, Download, AlertOctagon, Wrench, ShieldAlert
} from 'lucide-react';
import { supabase, logActividad } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const formatCurrency = (val: number) => {
  return `$ ${Math.round(val || 0).toLocaleString('es-CL')}`;
};

export interface ServicioSpot {
  id: string;
  folio: string;
  empresa_id: string;
  cliente_nombre: string;
  cliente_rut?: string;
  tipo_servicio: 'CAMA_BAJA' | 'RENTAL_MAQUINARIA' | 'CARGA_GENERAL';
  estado: 'COTIZACION' | 'APROBADO' | 'EN_TRANSITO' | 'POR_LIQUIDAR' | 'FACTURADO' | 'CANCELADO';
  fecha_solicitud: string;
  fecha_programada: string;
  fecha_termino?: string;
  origen: string;
  destino: string;
  
  // Datos Cama Baja / Traslado
  descripcion_carga?: string;
  peso_toneladas?: number;
  ancho_metros?: number;
  alto_metros?: number;
  largo_metros?: number;
  sobredimension?: boolean;
  requiere_escolta?: boolean;
  tracto_patente?: string;
  rampla_patente?: string;
  conductor_nombre?: string;
  conductor_id?: string;
  vehiculo_id?: string;

  // Datos Rental Maquinaria
  equipo_nombre?: string;
  modalidad_rental?: 'DRY' | 'WET';
  horometro_inicial?: number;
  horometro_final?: number;
  minimo_horas_dia?: number;
  dias_arriendo?: number;
  tarifa_hora_normal?: number;
  tarifa_hora_extra?: number;
  flete_movilizacion?: number;
  flete_desmovilizacion?: number;

  // Datos Tarifarios y Esperas
  flete_base: number;
  falso_flete_retorno?: number;
  tarifa_escolta?: number;
  horas_espera_libres?: number;
  horas_espera_reales?: number;
  tarifa_hora_espera?: number;
  monto_total_estimado: number;
  monto_total_liquidado?: number;

  notas?: string;
  created_at: string;
}

export default function ServiciosSpot() {
  const { activeCompanyId, currentCompany } = useCompany();
  const { profile } = useAuth();
  
  const [servicios, setServicios] = useState<ServicioSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

  // Catálogos base
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);

  // Modales
  const [showModalCrear, setShowModalCrear] = useState(false);
  const [showModalLiquidacion, setShowModalLiquidacion] = useState(false);
  const [showModalDetalle, setShowModalDetalle] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState<ServicioSpot | null>(null);

  // Tab del formulario de creación
  const [tabFormulario, setTabFormulario] = useState<'CAMA_BAJA' | 'RENTAL' | 'GENERAL'>('CAMA_BAJA');

  // Form State
  const initialFormState = {
    cliente_nombre: '',
    cliente_rut: '',
    origen: '',
    destino: '',
    fecha_programada: new Date().toISOString().slice(0, 10),
    fecha_termino: new Date().toISOString().slice(0, 10),
    
    // Cama Baja
    descripcion_carga: '',
    peso_toneladas: 25,
    ancho_metros: 2.5,
    alto_metros: 3.8,
    largo_metros: 12.0,
    sobredimension: false,
    requiere_escolta: false,
    tracto_id: '',
    rampla_id: '',
    conductor_id: '',
    flete_base: 1800000,
    falso_flete_retorno: 900000,
    tarifa_escolta: 0,
    horas_espera_libres: 2,
    tarifa_hora_espera: 45000,

    // Rental Maquinaria
    equipo_id: '',
    modalidad_rental: 'WET' as 'DRY' | 'WET',
    operador_id: '',
    dias_arriendo: 3,
    minimo_horas_dia: 8,
    tarifa_hora_normal: 55000,
    tarifa_hora_extra: 65000,
    flete_movilizacion: 350000,
    flete_desmovilizacion: 350000,
    horometro_inicial: 2450,

    notas: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // Form Liquidación
  const [liqHorasEsperaReales, setLiqHorasEsperaReales] = useState(0);
  const [liqHorometroFinal, setLiqHorometroFinal] = useState(0);

  // Cargar datos
  const loadData = async () => {
    if (!activeCompanyId) return;
    setLoading(true);
    try {
      // 1. Obtener vehículos (tractos, ramplas, camas bajas, maquinarias)
      let qVeh = supabase.from('vehiculo').select('id, patente, marca, modelo, tipo, estado, kilometraje_actual');
      if (activeCompanyId !== 'GLOBAL') qVeh = qVeh.eq('empresa_id', activeCompanyId);
      const { data: vehData } = await qVeh;
      if (vehData) setVehiculos(vehData);

      // 2. Obtener colaboradores (conductores y operadores)
      let qCol = supabase.from('colaborador').select('id, nombre, rut, rol, estado, licencia');
      if (activeCompanyId !== 'GLOBAL') qCol = qCol.eq('empresa_id', activeCompanyId);
      const { data: colData } = await qCol;
      if (colData) setColaboradores(colData);

      // 3. Obtener clientes
      let qCli = supabase.from('empresa_cliente').select('id, nombre');
      const { data: cliData } = await qCli;
      if (cliData) setClientes(cliData);

      // 4. Obtener servicios spot desde operacion_servicio
      let qServ = supabase.from('operacion_servicio').select(`
        *,
        conductor:colaborador(nombre),
        vehiculo:vehiculo(patente, marca, modelo, tipo)
      `).order('created_at', { ascending: false });

      if (activeCompanyId !== 'GLOBAL') qServ = qServ.eq('empresa_id', activeCompanyId);
      const { data: servData } = await qServ;

      if (servData) {
        // Filtrar y mapear servicios Spot
        const mapped: ServicioSpot[] = servData.map((s: any) => {
          let meta: any = {};
          try {
            if (s.subtipo && s.subtipo.startsWith('{')) {
              meta = JSON.parse(s.subtipo);
            }
          } catch (_) {}

          const tipoSrv = meta.tipo_servicio || (s.tipo_carga?.toUpperCase().includes('CAMA') ? 'CAMA_BAJA' : s.tipo_carga?.toUpperCase().includes('RENTAL') ? 'RENTAL_MAQUINARIA' : 'CARGA_GENERAL');

          return {
            id: s.id,
            folio: s.codigo || `SPOT-${s.id.slice(0, 6).toUpperCase()}`,
            empresa_id: s.empresa_id,
            cliente_nombre: meta.cliente_nombre || s.origen?.split('-')[0] || 'Cliente Spot',
            cliente_rut: meta.cliente_rut || '',
            tipo_servicio: tipoSrv,
            estado: (meta.estado_spot || (s.estado === 'Confirmado' ? 'EN_TRANSITO' : s.estado === 'Finalizado' ? 'FACTURADO' : 'APROBADO')) as any,
            fecha_solicitud: s.created_at,
            fecha_programada: s.fecha_servicio ? s.fecha_servicio.slice(0, 10) : new Date().toISOString().slice(0, 10),
            fecha_termino: meta.fecha_termino || s.fecha_servicio?.slice(0, 10),
            origen: s.origen,
            destino: s.destino,
            
            descripcion_carga: meta.descripcion_carga || 'Maquinaria pesada en traslado',
            peso_toneladas: meta.peso_toneladas || 28,
            ancho_metros: meta.ancho_metros || 2.6,
            alto_metros: meta.alto_metros || 4.1,
            largo_metros: meta.largo_metros || 13.5,
            sobredimension: meta.sobredimension || false,
            requiere_escolta: meta.requiere_escolta || false,
            tracto_patente: s.vehiculo?.patente || meta.tracto_patente || 'S/A',
            rampla_patente: meta.rampla_patente || 'CB-01',
            conductor_nombre: s.conductor?.nombre || meta.conductor_nombre || 'Por Asignar',
            conductor_id: s.conductor_id,
            vehiculo_id: s.vehiculo_id,

            equipo_nombre: meta.equipo_nombre || 'Grúa Horquilla 5 Ton',
            modalidad_rental: meta.modalidad_rental || 'WET',
            horometro_inicial: meta.horometro_inicial || 1200,
            horometro_final: meta.horometro_final,
            minimo_horas_dia: meta.minimo_horas_dia || 8,
            dias_arriendo: meta.dias_arriendo || 3,
            tarifa_hora_normal: meta.tarifa_hora_normal || 55000,
            tarifa_hora_extra: meta.tarifa_hora_extra || 65000,
            flete_movilizacion: meta.flete_movilizacion || 350000,
            flete_desmovilizacion: meta.flete_desmovilizacion || 350000,

            flete_base: Number(s.ingreso_esperado) || meta.flete_base || 1800000,
            falso_flete_retorno: meta.falso_flete_retorno || 0,
            tarifa_escolta: meta.tarifa_escolta || 0,
            horas_espera_libres: meta.horas_espera_libres || 2,
            horas_espera_reales: meta.horas_espera_reales || 0,
            tarifa_hora_espera: meta.tarifa_hora_espera || 45000,
            monto_total_estimado: Number(s.ingreso_esperado) || meta.monto_total_estimado || 1800000,
            monto_total_liquidado: meta.monto_total_liquidado || Number(s.ingreso_esperado),
            
            notas: s.notas || meta.notas || '',
            created_at: s.created_at
          };
        });

        // Si no existen servicios con metadata spot aún en esta empresa, inyectamos ejemplos demostrativos si es Demo Gaval
        const isGaval = (currentCompany?.name || (currentCompany as any)?.nombre || '').toLowerCase().includes('gaval');
        if (mapped.length === 0 && isGaval) {
          const demos: ServicioSpot[] = [
            {
              id: 'spot-demo-01',
              folio: 'SPOT-26-081',
              empresa_id: activeCompanyId,
              cliente_nombre: 'Minera Centinela (Antofagasta Minerals)',
              cliente_rut: '76.123.456-7',
              tipo_servicio: 'CAMA_BAJA',
              estado: 'EN_TRANSITO',
              fecha_solicitud: '2026-10-10',
              fecha_programada: '2026-10-11',
              origen: 'Taller Base Antofagasta',
              destino: 'Faena Centinela — Sector Esperanza',
              descripcion_carga: 'Excavadora Hidráulica CAT 336 (38 Ton)',
              peso_toneladas: 38,
              ancho_metros: 3.2,
              alto_metros: 4.35,
              largo_metros: 14.5,
              sobredimension: true,
              requiere_escolta: true,
              tracto_patente: 'JY-88-21',
              rampla_patente: 'RAMP-CB-03',
              conductor_nombre: 'Manuel Soto (Pase Minero Activo)',
              flete_base: 2200000,
              falso_flete_retorno: 1100000,
              tarifa_escolta: 350000,
              horas_espera_libres: 2,
              horas_espera_reales: 0,
              tarifa_hora_espera: 50000,
              monto_total_estimado: 3650000,
              notas: 'Traslado con convoy y camioneta escolta autorizada por Vialidad MOP.',
              created_at: '2026-10-10T12:00:00Z'
            },
            {
              id: 'spot-demo-02',
              folio: 'SPOT-26-082',
              empresa_id: activeCompanyId,
              cliente_nombre: 'BHP Billiton — Minera Escondida',
              cliente_rut: '88.987.654-3',
              tipo_servicio: 'RENTAL_MAQUINARIA',
              estado: 'EN_TRANSITO',
              fecha_solicitud: '2026-10-09',
              fecha_programada: '2026-10-09',
              fecha_termino: '2026-10-14',
              origen: 'Patio Equipos Gaval',
              destino: 'Planta Concentradora Laguna Seca',
              equipo_nombre: 'Camión Aljibe 20.000L Mercedes Actros',
              modalidad_rental: 'WET',
              horometro_inicial: 4120,
              minimo_horas_dia: 8,
              dias_arriendo: 5,
              tarifa_hora_normal: 58000,
              tarifa_hora_extra: 68000,
              flete_movilizacion: 420000,
              flete_desmovilizacion: 420000,
              flete_base: 2320000,
              monto_total_estimado: 3160000,
              conductor_nombre: 'Carlos Vergara (Operador Certificado)',
              tracto_patente: 'CW-77-12',
              notas: 'Arriendo de apoyo por parada de planta. Horas mínimas garantizadas 8 hrs/turno.',
              created_at: '2026-10-09T08:30:00Z'
            },
            {
              id: 'spot-demo-03',
              folio: 'SPOT-26-083',
              empresa_id: activeCompanyId,
              cliente_nombre: 'Komatsu Chile S.A.',
              cliente_rut: '96.543.210-K',
              tipo_servicio: 'CAMA_BAJA',
              estado: 'POR_LIQUIDAR',
              fecha_solicitud: '2026-10-08',
              fecha_programada: '2026-10-08',
              origen: 'Faena Spence',
              destino: 'Centro de Reparaciones La Negra',
              descripcion_carga: 'Bulldozer D8T en pana para desarme mayor',
              peso_toneladas: 42,
              ancho_metros: 3.1,
              alto_metros: 4.1,
              sobredimension: true,
              requiere_escolta: true,
              tracto_patente: 'LK-99-44',
              rampla_patente: 'RAMP-CB-01',
              conductor_nombre: 'Esteban Araya',
              flete_base: 1950000,
              falso_flete_retorno: 950000,
              tarifa_escolta: 300000,
              horas_espera_libres: 2,
              horas_espera_reales: 5,
              tarifa_hora_espera: 48000,
              monto_total_estimado: 3200000,
              monto_total_liquidado: 3344000,
              notas: 'Unidad estuvo 3 horas extra esperando liberación de garita en faena.',
              created_at: '2026-10-08T14:15:00Z'
            },
            {
              id: 'spot-demo-04',
              folio: 'SPOT-26-084',
              empresa_id: activeCompanyId,
              cliente_nombre: 'Consorcio Vial Norte',
              cliente_rut: '77.222.333-1',
              tipo_servicio: 'CARGA_GENERAL',
              estado: 'COTIZACION',
              fecha_solicitud: '2026-10-12',
              fecha_programada: '2026-10-14',
              origen: 'Bodega Central Mejillones',
              destino: 'Campamento Ruta B-400',
              descripcion_carga: 'Traslado de 2 Contenedores Pañol 20ft',
              peso_toneladas: 14,
              sobredimension: false,
              flete_base: 850000,
              monto_total_estimado: 850000,
              notas: 'Cotización en evaluación por jefe de compras cliente.',
              created_at: '2026-10-12T09:00:00Z'
            }
          ];
          setServicios(demos);
        } else {
          setServicios(mapped);
        }
      }
    } catch (err) {
      console.error('Error cargando servicios spot:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompanyId]);

  // Al cambiar dimensiones, detectar sobredimensión automáticamente
  useEffect(() => {
    const isOver = formData.ancho_metros > 2.6 || formData.alto_metros > 4.2 || formData.peso_toneladas > 40;
    setFormData(prev => ({
      ...prev,
      sobredimension: isOver,
      requiere_escolta: isOver,
      tarifa_escolta: isOver ? (prev.tarifa_escolta || 350000) : 0
    }));
  }, [formData.ancho_metros, formData.alto_metros, formData.peso_toneladas]);

  // Calcular total cotizado Cama Baja
  const totalCamaBaja = useMemo(() => {
    const base = Number(formData.flete_base) || 0;
    const falso = Number(formData.falso_flete_retorno) || 0;
    const escolta = formData.requiere_escolta ? (Number(formData.tarifa_escolta) || 0) : 0;
    return base + falso + escolta;
  }, [formData.flete_base, formData.falso_flete_retorno, formData.requiere_escolta, formData.tarifa_escolta]);

  // Calcular total estimado Rental
  const totalRental = useMemo(() => {
    const dias = Number(formData.dias_arriendo) || 1;
    const horasMinDia = Number(formData.minimo_horas_dia) || 8;
    const tarifaH = Number(formData.tarifa_hora_normal) || 0;
    const mov = Number(formData.flete_movilizacion) || 0;
    const desmov = Number(formData.flete_desmovilizacion) || 0;
    return (dias * horasMinDia * tarifaH) + mov + desmov;
  }, [formData.dias_arriendo, formData.minimo_horas_dia, formData.tarifa_hora_normal, formData.flete_movilizacion, formData.flete_desmovilizacion]);

  // Métricas ejecutivas
  const stats = useMemo(() => {
    const totalFacturacion = servicios
      .filter(s => s.estado !== 'CANCELADO' && s.estado !== 'COTIZACION')
      .reduce((acc, s) => acc + (s.monto_total_liquidado || s.monto_total_estimado || 0), 0);

    const activasCamaBaja = servicios.filter(s => s.tipo_servicio === 'CAMA_BAJA' && (s.estado === 'EN_TRANSITO' || s.estado === 'APROBADO')).length;
    const activasRental = servicios.filter(s => s.tipo_servicio === 'RENTAL_MAQUINARIA' && (s.estado === 'EN_TRANSITO' || s.estado === 'APROBADO')).length;
    const porLiquidar = servicios.filter(s => s.estado === 'POR_LIQUIDAR').length;
    const totalCotizaciones = servicios.filter(s => s.estado === 'COTIZACION').length;

    return { totalFacturacion, activasCamaBaja, activasRental, porLiquidar, totalCotizaciones };
  }, [servicios]);

  // Filtrado de servicios
  const serviciosFiltrados = useMemo(() => {
    return servicios.filter(s => {
      const matchSearch = 
        s.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.origen.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.descripcion_carga || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.tracto_patente || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchTipo = filtroTipo === 'TODOS' || s.tipo_servicio === filtroTipo;
      const matchEstado = filtroEstado === 'TODOS' || s.estado === filtroEstado;

      return matchSearch && matchTipo && matchEstado;
    });
  }, [servicios, searchTerm, filtroTipo, filtroEstado]);

  // Guardar nuevo servicio Spot
  const handleGuardarServicio = async () => {
    if (!formData.cliente_nombre.trim() || !formData.origen.trim() || !formData.destino.trim()) {
      Swal.fire('Campos requeridos', 'Por favor ingresa el cliente, origen y destino del servicio.', 'warning');
      return;
    }

    try {
      const folioGen = `SPOT-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(Math.random() * 900 + 100)}`;
      const tractoObj = vehiculos.find(v => v.id === formData.tracto_id || v.id === formData.equipo_id);
      const choferObj = colaboradores.find(c => c.id === formData.conductor_id || c.id === formData.operador_id);

      const metadataSpot = {
        tipo_servicio: tabFormulario === 'CAMA_BAJA' ? 'CAMA_BAJA' : tabFormulario === 'RENTAL' ? 'RENTAL_MAQUINARIA' : 'CARGA_GENERAL',
        cliente_nombre: formData.cliente_nombre,
        cliente_rut: formData.cliente_rut,
        estado_spot: 'APROBADO',
        descripcion_carga: tabFormulario === 'RENTAL' ? `Arriendo de ${tractoObj?.modelo || 'Maquinaria'}` : formData.descripcion_carga,
        peso_toneladas: formData.peso_toneladas,
        ancho_metros: formData.ancho_metros,
        alto_metros: formData.alto_metros,
        largo_metros: formData.largo_metros,
        sobredimension: formData.sobredimension,
        requiere_escolta: formData.requiere_escolta,
        tracto_patente: tractoObj?.patente || 'S/A',
        conductor_nombre: choferObj?.nombre || 'Por Asignar',
        flete_base: tabFormulario === 'CAMA_BAJA' ? formData.flete_base : totalRental,
        falso_flete_retorno: formData.falso_flete_retorno,
        tarifa_escolta: formData.tarifa_escolta,
        horas_espera_libres: formData.horas_espera_libres,
        tarifa_hora_espera: formData.tarifa_hora_espera,
        modalidad_rental: formData.modalidad_rental,
        dias_arriendo: formData.dias_arriendo,
        minimo_horas_dia: formData.minimo_horas_dia,
        tarifa_hora_normal: formData.tarifa_hora_normal,
        monto_total_estimado: tabFormulario === 'CAMA_BAJA' ? totalCamaBaja : totalRental,
        notas: formData.notas
      };

      const payload = {
        empresa_id: activeCompanyId,
        codigo: folioGen,
        tipo_carga: tabFormulario === 'CAMA_BAJA' ? 'Cama Baja' : tabFormulario === 'RENTAL' ? 'Rental Maquinaria' : 'Carga General',
        subtipo: JSON.stringify(metadataSpot),
        origen: formData.origen,
        destino: formData.destino,
        fecha_servicio: new Date(formData.fecha_programada).toISOString(),
        conductor_id: choferObj?.id || null,
        vehiculo_id: tractoObj?.id || null,
        estado: 'Confirmado',
        ingreso_esperado: metadataSpot.monto_total_estimado,
        costo_estimado: Math.round(metadataSpot.monto_total_estimado * 0.45) // Estimación 45% costo diésel/chofer
      };

      const { data: newRow, error } = await supabase.from('operacion_servicio').insert([payload]).select().single();
      if (error) throw error;

      // Sincronizar en programación para que aparezca en el timeline de la empresa
      try {
        await supabase.from('operacion_programacion').insert([{
          empresa_id: activeCompanyId,
          tipo: payload.tipo_carga,
          origen: payload.origen,
          destino: payload.destino,
          fecha: formData.fecha_programada,
          hora: 8,
          duracion: 4,
          conductor_id: payload.conductor_id,
          vehiculo_id: payload.vehiculo_id,
          estado: 'Asignado',
          notas: newRow?.id || folioGen
        }]);
      } catch (_) {}

      Swal.fire({
        icon: 'success',
        title: 'Servicio SPOT Creado',
        text: `Folio ${folioGen} generado exitosamente y programado en flota.`,
        timer: 2000,
        showConfirmButton: false
      });

      setShowModalCrear(false);
      setFormData(initialFormState);
      loadData();

    } catch (err: any) {
      console.error('Error guardando servicio spot:', err);
      Swal.fire('Error', 'No se pudo crear el servicio spot: ' + err.message, 'error');
    }
  };

  // Abrir modal de liquidación
  const handleAbrirLiquidacion = (s: ServicioSpot) => {
    setSelectedServicio(s);
    setLiqHorasEsperaReales(s.horas_espera_reales || s.horas_espera_libres || 2);
    setLiqHorometroFinal(s.horometro_final || ((s.horometro_inicial || 1000) + ((s.dias_arriendo || 1) * 8)));
    setShowModalLiquidacion(true);
  };

  // Guardar Liquidación Final
  const handleGuardarLiquidacion = async () => {
    if (!selectedServicio) return;

    let montoFinal = selectedServicio.monto_total_estimado;

    if (selectedServicio.tipo_servicio === 'CAMA_BAJA') {
      const horasLibres = selectedServicio.horas_espera_libres || 2;
      const horasExceso = Math.max(0, liqHorasEsperaReales - horasLibres);
      const cobroEspera = horasExceso * (selectedServicio.tarifa_hora_espera || 45000);
      montoFinal = selectedServicio.flete_base + (selectedServicio.falso_flete_retorno || 0) + (selectedServicio.tarifa_escolta || 0) + cobroEspera;
    } else if (selectedServicio.tipo_servicio === 'RENTAL_MAQUINARIA') {
      const horoIni = selectedServicio.horometro_inicial || 0;
      const horasTrabajadas = Math.max(0, liqHorometroFinal - horoIni);
      const horasMinimasGarantizadas = (selectedServicio.dias_arriendo || 1) * (selectedServicio.minimo_horas_dia || 8);
      const horasNormales = Math.min(horasTrabajadas, horasMinimasGarantizadas);
      const horasExtras = Math.max(0, horasTrabajadas - horasMinimasGarantizadas);
      
      const cobroHoras = (Math.max(horasNormales, horasMinimasGarantizadas) * (selectedServicio.tarifa_hora_normal || 55000)) + 
                         (horasExtras * (selectedServicio.tarifa_hora_extra || 65000));
      montoFinal = cobroHoras + (selectedServicio.flete_movilizacion || 0) + (selectedServicio.flete_desmovilizacion || 0);
    }

    try {
      // Actualizar en memoria y DB
      const updatedList = servicios.map(item => {
        if (item.id === selectedServicio.id) {
          return {
            ...item,
            estado: 'FACTURADO' as any,
            horas_espera_reales: liqHorasEsperaReales,
            horometro_final: liqHorometroFinal,
            monto_total_liquidado: montoFinal
          };
        }
        return item;
      });
      setServicios(updatedList);

      // Si existe en base de datos real, actualizarlo
      if (!selectedServicio.id.startsWith('spot-demo')) {
        await supabase.from('operacion_servicio').update({
          estado: 'Finalizado',
          ingreso_esperado: montoFinal
        }).eq('id', selectedServicio.id);
      }

      Swal.fire({
        icon: 'success',
        title: 'Servicio Liquidado',
        text: `Monto final liquidado: ${formatCurrency(montoFinal)}. Listo para emisión de factura.`,
        confirmButtonText: 'Aceptar'
      });

      setShowModalLiquidacion(false);
    } catch (e: any) {
      Swal.fire('Error', 'No se pudo liquidar el servicio', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* 1. Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <Zap className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
              Servicios SPOT & Rental de Maquinaria
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestión comercial y operativa de fletes en Cama Baja, cargas sobredimensionadas, alquiler por horómetro y falso flete.
          </p>
        </div>

        <button
          onClick={() => setShowModalCrear(true)}
          className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          Nueva Cotización / Despacho SPOT
        </button>
      </div>

      {/* 2. KPIs Ejecutivos SPOT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase text-slate-400">Facturación SPOT (Mes)</span>
            <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><DollarSign className="w-4 h-4" /></span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-2">
            {formatCurrency(stats.totalFacturacion)}
          </p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Alta rentabilidad marginal
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase text-slate-400">Camas Bajas en Ruta</span>
            <span className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Truck className="w-4 h-4" /></span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-2">
            {stats.activasCamaBaja} <span className="text-sm font-semibold text-slate-400">servicios activos</span>
          </p>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 mt-1">
            <Scale className="w-3.5 h-3.5" /> Sobredimensión monitoreada
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase text-slate-400">Equipos en Rental</span>
            <span className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><Wrench className="w-4 h-4" /></span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-2">
            {stats.activasRental} <span className="text-sm font-semibold text-slate-400">en faena minera</span>
          </p>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-1">
            <Clock className="w-3.5 h-3.5" /> Mínimo horómetro garantizado
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase text-slate-400">Pendientes Liquidación</span>
            <span className="p-2 bg-rose-500/10 text-rose-500 rounded-lg"><AlertOctagon className="w-4 h-4" /></span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-2">
            {stats.porLiquidar} <span className="text-sm font-semibold text-slate-400">por conciliar</span>
          </p>
          <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 mt-1">
            <Clock className="w-3.5 h-3.5" /> Conciliar esperas y horómetro
          </span>
        </div>
      </div>

      {/* 3. Filtros y Búsqueda */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Barra de Búsqueda */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por folio, cliente, ruta o patente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Filtros por Tipo y Estado */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="TODOS">Todas las Líneas Spot</option>
            <option value="CAMA_BAJA">🚛 Cama Baja / Ramplas</option>
            <option value="RENTAL_MAQUINARIA">🚜 Rental de Maquinaria</option>
            <option value="CARGA_GENERAL">📦 Carga General & Auxilio</option>
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="COTIZACION">📋 En Cotización</option>
            <option value="APROBADO">✅ Aprobado / Por Despachar</option>
            <option value="EN_TRANSITO">🚀 En Tránsito / En Faena</option>
            <option value="POR_LIQUIDAR">⏳ Por Liquidar</option>
            <option value="FACTURADO">💵 Facturado</option>
          </select>
        </div>
      </div>

      {/* 4. Listado de Servicios SPOT */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-400 font-medium">Cargando servicios spot...</div>
        ) : serviciosFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <Zap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 dark:text-slate-200">No hay servicios spot registrados con los filtros seleccionados.</p>
            <p className="text-xs text-slate-400 mt-1">Crea tu primera cotización spot haciendo clic en "+ Nueva Solicitud / Cotización SPOT".</p>
          </div>
        ) : (
          serviciosFiltrados.map((s) => (
            <div
              key={s.id}
              className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm hover:border-amber-400 dark:hover:border-amber-500 transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Columna Izquierda: Folio, Tipo, Cliente y Ruta */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {s.folio}
                    </span>

                    {/* Badge Tipo de Negocio Spot */}
                    {s.tipo_servicio === 'CAMA_BAJA' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        <Truck className="w-3 h-3" /> Cama Baja Heavy Duty
                      </span>
                    )}
                    {s.tipo_servicio === 'RENTAL_MAQUINARIA' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        <Wrench className="w-3 h-3" /> Rental de Maquinaria ({s.modalidad_rental})
                      </span>
                    )}
                    {s.tipo_servicio === 'CARGA_GENERAL' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        <Layers className="w-3 h-3" /> Carga General
                      </span>
                    )}

                    {/* Badge Sobredimensión / Escolta */}
                    {s.sobredimension && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                        <ShieldAlert className="w-3 h-3" /> Sobredimensión MOP
                      </span>
                    )}

                    {/* Badge Estado */}
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      s.estado === 'EN_TRANSITO' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                      s.estado === 'POR_LIQUIDAR' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 animate-pulse' :
                      s.estado === 'FACTURADO' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                      s.estado === 'COTIZACION' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {s.estado === 'EN_TRANSITO' ? '🚀 EN TRÁNSITO / FAENA' :
                       s.estado === 'POR_LIQUIDAR' ? '⏳ POR LIQUIDAR' :
                       s.estado === 'FACTURADO' ? '💵 FACTURADO' :
                       s.estado === 'COTIZACION' ? '📋 EN COTIZACIÓN' : '✅ APROBADO'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {s.cliente_nombre}
                  </h3>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {s.origen}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span> {s.destino}
                    </span>
                    <span className="font-medium">| Fecha: {s.fecha_programada}</span>
                  </div>

                  {/* Detalle Técnico de la Carga o Equipo */}
                  <div className="bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                    {s.tipo_servicio === 'CAMA_BAJA' ? (
                      <>
                        <span><strong>Carga:</strong> {s.descripcion_carga}</span>
                        <span><strong>Peso:</strong> {s.peso_toneladas} Ton</span>
                        <span><strong>Dimensiones:</strong> {s.largo_metros}m x {s.ancho_metros}m x {s.alto_metros}m</span>
                        <span><strong>Tracto / Rampla:</strong> {s.tracto_patente} / {s.rampla_patente}</span>
                        <span><strong>Conductor:</strong> {s.conductor_nombre}</span>
                      </>
                    ) : s.tipo_servicio === 'RENTAL_MAQUINARIA' ? (
                      <>
                        <span><strong>Equipo:</strong> {s.equipo_nombre}</span>
                        <span><strong>Turnos:</strong> {s.dias_arriendo} días ({s.minimo_horas_dia} hrs/día mínimas)</span>
                        <span><strong>Horómetro Inicial:</strong> {s.horometro_inicial} hrs</span>
                        <span><strong>Operador:</strong> {s.conductor_nombre}</span>
                      </>
                    ) : (
                      <span><strong>Detalle:</strong> {s.descripcion_carga}</span>
                    )}
                  </div>
                </div>

                {/* Columna Derecha: Tarifa, Liquidación y Acciones */}
                <div className="flex flex-col lg:items-end justify-between gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-700">
                  <div className="text-right">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">
                      {s.estado === 'FACTURADO' ? 'Total Liquidado' : 'Monto Estimado SPOT'}
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {formatCurrency(s.monto_total_liquidado || s.monto_total_estimado)}
                    </span>
                    {s.falso_flete_retorno ? (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 block font-semibold">
                        Incluye {formatCurrency(s.falso_flete_retorno)} falso flete
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botón Liquidación si está por liquidar o en tránsito */}
                    {(s.estado === 'POR_LIQUIDAR' || s.estado === 'EN_TRANSITO') && (
                      <button
                        onClick={() => handleAbrirLiquidacion(s)}
                        className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-lg shadow-sm transition-all"
                      >
                        ⚡ Liquidar Cierre
                      </button>
                    )}

                    <button
                      onClick={() => { setSelectedServicio(s); setShowModalDetalle(true); }}
                      className="text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg transition-all"
                    >
                      Ver Ficha
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. Modal: Nueva Cotización / Despacho SPOT */}
      {showModalCrear && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-6 my-8">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Nueva Operación SPOT & Rental
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Calculador tarifario con falso flete de retorno, mínimo garantizado de horómetro y control de sobrepeso.
                </p>
              </div>
              <button 
                onClick={() => setShowModalCrear(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Modalidad SPOT (Tabs) */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setTabFormulario('CAMA_BAJA')}
                className={`py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                  tabFormulario === 'CAMA_BAJA' 
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Truck className="w-4 h-4" /> Traslado Cama Baja
              </button>
              <button
                type="button"
                onClick={() => setTabFormulario('RENTAL')}
                className={`py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                  tabFormulario === 'RENTAL' 
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Wrench className="w-4 h-4" /> Arriendo Maquinaria
              </button>
              <button
                type="button"
                onClick={() => setTabFormulario('GENERAL')}
                className={`py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                  tabFormulario === 'GENERAL' 
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" /> Carga General / Auxilio
              </button>
            </div>

            {/* Formulario Dinámico */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
              
              {/* Bloque Común: Cliente y Ruta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cliente Razón Social *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Minera Centinela, BHP, Komatsu..."
                    value={formData.cliente_nombre}
                    onChange={(e) => setFormData({ ...formData, cliente_nombre: e.target.value })}
                    className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha Programada Presentación *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_programada}
                    onChange={(e) => setFormData({ ...formData, fecha_programada: e.target.value })}
                    className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Origen (Punto Carga / Salida) *</label>
                  <input
                    type="text"
                    placeholder="Ej. Antofagasta Taller Central"
                    value={formData.origen}
                    onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                    className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Destino (Faena / Descarga) *</label>
                  <input
                    type="text"
                    placeholder="Ej. Faena Centinela — Esperanza"
                    value={formData.destino}
                    onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                    className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* BLOQUE ESPECÍFICO: TRASLADO EN CAMA BAJA */}
              {tabFormulario === 'CAMA_BAJA' && (
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 rounded-2xl space-y-4">
                  <h4 className="text-xs font-black uppercase text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <Truck className="w-4 h-4" /> Parámetros Técnicos de Carga Pesada
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1">Descripción del Equipo a Trasladar</label>
                      <input
                        type="text"
                        placeholder="Ej. Excavadora CAT 336, Bulldozer D8T..."
                        value={formData.descripcion_carga}
                        onChange={(e) => setFormData({ ...formData, descripcion_carga: e.target.value })}
                        className="w-full text-sm p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Peso Estimado (Toneladas)</label>
                      <input
                        type="number"
                        value={formData.peso_toneladas}
                        onChange={(e) => setFormData({ ...formData, peso_toneladas: Number(e.target.value) })}
                        className="w-full text-sm p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">Ancho (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.ancho_metros}
                        onChange={(e) => setFormData({ ...formData, ancho_metros: Number(e.target.value) })}
                        className="w-full text-sm p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Alto (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.alto_metros}
                        onChange={(e) => setFormData({ ...formData, alto_metros: Number(e.target.value) })}
                        className="w-full text-sm p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Largo (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.largo_metros}
                        onChange={(e) => setFormData({ ...formData, largo_metros: Number(e.target.value) })}
                        className="w-full text-sm p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Alerta de Sobredimensión Automática */}
                  {formData.sobredimension && (
                    <div className="p-3 bg-purple-100 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 rounded-xl text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-purple-600" />
                        <strong>Carga Sobredimensionada detectada:</strong> Excede gálibo estándar MOP (Ancho &gt; 2.6m o Alto &gt; 4.2m).
                      </span>
                      <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.requiere_escolta}
                          onChange={(e) => setFormData({ ...formData, requiere_escolta: e.target.checked })}
                          className="w-4 h-4 rounded text-purple-600"
                        />
                        Incluir Escolta Vial
                      </label>
                    </div>
                  )}

                  {/* Asignación de Recursos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1">Tractocamión / Unidad</label>
                      <select
                        value={formData.tracto_id}
                        onChange={(e) => setFormData({ ...formData, tracto_id: e.target.value })}
                        className="w-full text-sm p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                      >
                        <option value="">-- Seleccionar Tracto Disponible --</option>
                        {vehiculos.filter(v => v.estado !== 'INACTIVO').map(v => (
                          <option key={v.id} value={v.id}>{v.patente} - {v.marca} {v.modelo} ({v.tipo || 'Camión'})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Chofer A5 Certificado</label>
                      <select
                        value={formData.conductor_id}
                        onChange={(e) => setFormData({ ...formData, conductor_id: e.target.value })}
                        className="w-full text-sm p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                      >
                        <option value="">-- Seleccionar Chofer --</option>
                        {colaboradores.filter(c => (c.rol || '').toLowerCase().includes('conduc') || (c.rol || '').toLowerCase().includes('chofer')).map(c => (
                          <option key={c.id} value={c.id}>{c.nombre} (Lic: {c.licencia || 'A5'})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Estructura Tarifaria Spot */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <h5 className="text-xs font-bold text-slate-800 dark:text-white uppercase">Estructura Tarifaria SPOT</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Flete Ida ($)</label>
                        <input
                          type="number"
                          value={formData.flete_base}
                          onChange={(e) => setFormData({ ...formData, flete_base: Number(e.target.value) })}
                          className="w-full text-sm p-2 border rounded-lg dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Falso Flete Retorno ($)</label>
                        <input
                          type="number"
                          value={formData.falso_flete_retorno}
                          onChange={(e) => setFormData({ ...formData, falso_flete_retorno: Number(e.target.value) })}
                          className="w-full text-sm p-2 border rounded-lg dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Costo Escolta MOP ($)</label>
                        <input
                          type="number"
                          value={formData.tarifa_escolta}
                          disabled={!formData.requiere_escolta}
                          onChange={(e) => setFormData({ ...formData, tarifa_escolta: Number(e.target.value) })}
                          className="w-full text-sm p-2 border rounded-lg dark:bg-slate-800 disabled:opacity-40"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t text-sm font-extrabold text-blue-600 dark:text-blue-400">
                      <span>Total Cotización Cama Baja:</span>
                      <span className="text-base">{formatCurrency(totalCamaBaja)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* BLOQUE ESPECÍFICO: ARRIENDO DE MAQUINARIA (RENTAL) */}
              {tabFormulario === 'RENTAL' && (
                <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-2xl space-y-4">
                  <h4 className="text-xs font-black uppercase text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4" /> Parámetros de Rental por Horómetro
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1">Equipo a Arrendar</label>
                      <select
                        value={formData.equipo_id}
                        onChange={(e) => setFormData({ ...formData, equipo_id: e.target.value })}
                        className="w-full text-sm p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                      >
                        <option value="">-- Seleccionar Equipo de Flota --</option>
                        {vehiculos.map(v => (
                          <option key={v.id} value={v.id}>{v.patente} - {v.marca} {v.modelo} ({v.tipo || 'Maquinaria'})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Modalidad de Arriendo</label>
                      <select
                        value={formData.modalidad_rental}
                        onChange={(e) => setFormData({ ...formData, modalidad_rental: e.target.value as any })}
                        className="w-full text-sm p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                      >
                        <option value="WET">Wet Rental (Con Operador y Mantenimiento)</option>
                        <option value="DRY">Dry Rental (Solo Equipo / Cliente pone operador)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">Días de Arriendo</label>
                      <input
                        type="number"
                        value={formData.dias_arriendo}
                        onChange={(e) => setFormData({ ...formData, dias_arriendo: Number(e.target.value) })}
                        className="w-full text-sm p-2 bg-white dark:bg-slate-900 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Mínimo Hrs/Día Garantizadas</label>
                      <input
                        type="number"
                        value={formData.minimo_horas_dia}
                        onChange={(e) => setFormData({ ...formData, minimo_horas_dia: Number(e.target.value) })}
                        className="w-full text-sm p-2 bg-white dark:bg-slate-900 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Tarifa Normal ($/hr)</label>
                      <input
                        type="number"
                        value={formData.tarifa_hora_normal}
                        onChange={(e) => setFormData({ ...formData, tarifa_hora_normal: Number(e.target.value) })}
                        className="w-full text-sm p-2 bg-white dark:bg-slate-900 border rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">Flete Movilización (Ida) ($)</label>
                      <input
                        type="number"
                        value={formData.flete_movilizacion}
                        onChange={(e) => setFormData({ ...formData, flete_movilizacion: Number(e.target.value) })}
                        className="w-full text-sm p-2 bg-white dark:bg-slate-900 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Flete Desmovilización (Vuelta) ($)</label>
                      <input
                        type="number"
                        value={formData.flete_desmovilizacion}
                        onChange={(e) => setFormData({ ...formData, flete_desmovilizacion: Number(e.target.value) })}
                        className="w-full text-sm p-2 bg-white dark:bg-slate-900 border rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t text-sm font-extrabold text-amber-600 dark:text-amber-400">
                    <span>Total Estimado Rental:</span>
                    <span className="text-base">{formatCurrency(totalRental)}</span>
                  </div>
                </div>
              )}

              {/* BLOQUE ESPECÍFICO: CARGA GENERAL */}
              {tabFormulario === 'GENERAL' && (
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-4">
                  <h4 className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> Carga General / Flete Express
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1">Descripción de Carga</label>
                      <input
                        type="text"
                        placeholder="Ej. Estructuras, repuestos, pañoles..."
                        value={formData.descripcion_carga}
                        onChange={(e) => setFormData({ ...formData, descripcion_carga: e.target.value })}
                        className="w-full text-sm p-2.5 bg-white dark:bg-slate-900 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Tarifa Flete Cerrado ($)</label>
                      <input
                        type="number"
                        value={formData.flete_base}
                        onChange={(e) => setFormData({ ...formData, flete_base: Number(e.target.value) })}
                        className="w-full text-sm p-2.5 bg-white dark:bg-slate-900 border rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notas y Observaciones */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Notas / Condiciones Especiales</label>
                <textarea
                  rows={2}
                  placeholder="Detalles de acceso a faena, protocolos de seguridad, EPP requerido..."
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

            </div>

            {/* Footer Modal */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowModalCrear(false)}
                className="px-4 py-2.5 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarServicio}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20"
              >
                Guardar y Programar SPOT
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. Modal: Liquidación de Cierre SPOT */}
      {showModalLiquidacion && selectedServicio && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  ⚡ Liquidación de Cierre SPOT
                </h3>
                <p className="text-xs text-slate-400">Folio: {selectedServicio.folio} — {selectedServicio.cliente_nombre}</p>
              </div>
              <button onClick={() => setShowModalLiquidacion(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedServicio.tipo_servicio === 'CAMA_BAJA' ? (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                  <p><strong>Flete Base + Falso Flete:</strong> {formatCurrency(selectedServicio.flete_base + (selectedServicio.falso_flete_retorno || 0))}</p>
                  <p><strong>Horas de Espera Libres Pactadas:</strong> {selectedServicio.horas_espera_libres || 2} horas</p>
                  <p><strong>Tarifa Hora de Espera (Demurrage):</strong> {formatCurrency(selectedServicio.tarifa_hora_espera || 45000)} / hr</p>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Horas Totales Reales en Faena / Espera</label>
                  <input
                    type="number"
                    step="0.5"
                    value={liqHorasEsperaReales}
                    onChange={(e) => setLiqHorasEsperaReales(Number(e.target.value))}
                    className="w-full text-base font-bold p-3 border rounded-xl dark:bg-slate-800"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Horas a facturar por espera: {Math.max(0, liqHorasEsperaReales - (selectedServicio.horas_espera_libres || 2))} hrs
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p><strong>Horómetro Inicial:</strong> {selectedServicio.horometro_inicial} hrs</p>
                  <p><strong>Mínimo Garantizado:</strong> {(selectedServicio.dias_arriendo || 1) * (selectedServicio.minimo_horas_dia || 8)} hrs</p>
                  <p><strong>Tarifa Hora Normal:</strong> {formatCurrency(selectedServicio.tarifa_hora_normal || 55000)} / hr</p>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Horómetro Final de Retiro</label>
                  <input
                    type="number"
                    step="0.5"
                    value={liqHorometroFinal}
                    onChange={(e) => setLiqHorometroFinal(Number(e.target.value))}
                    className="w-full text-base font-bold p-3 border rounded-xl dark:bg-slate-800"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Horas trabajadas: {Math.max(0, liqHorometroFinal - (selectedServicio.horometro_inicial || 0))} hrs
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button 
                onClick={() => setShowModalLiquidacion(false)} 
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Cancelar
              </button>
              <button 
                onClick={handleGuardarLiquidacion} 
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20"
              >
                Confirmar y Liquidar Servicio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: Ficha Detalle */}
      {showModalDetalle && selectedServicio && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-amber-500">{selectedServicio.folio}</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedServicio.cliente_nombre}</h3>
              </div>
              <button onClick={() => setShowModalDetalle(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <p><strong>Ruta:</strong> {selectedServicio.origen} ➔ {selectedServicio.destino}</p>
              <p><strong>Fecha Programada:</strong> {selectedServicio.fecha_programada}</p>
              <p><strong>Conductor / Operador:</strong> {selectedServicio.conductor_nombre}</p>
              <p><strong>Unidad / Rampla:</strong> {selectedServicio.tracto_patente} {selectedServicio.rampla_patente ? `/ ${selectedServicio.rampla_patente}` : ''}</p>
              <p><strong>Monto Estimado:</strong> {formatCurrency(selectedServicio.monto_total_estimado)}</p>
              {selectedServicio.monto_total_liquidado && (
                <p><strong>Monto Final Liquidado:</strong> <span className="text-emerald-500 font-bold">{formatCurrency(selectedServicio.monto_total_liquidado)}</span></p>
              )}
              {selectedServicio.notas && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <strong>Observaciones:</strong> {selectedServicio.notas}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button 
                onClick={() => setShowModalDetalle(false)} 
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
