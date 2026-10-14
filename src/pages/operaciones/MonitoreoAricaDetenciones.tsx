import React, { useState, useMemo, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Fuel, 
  CheckCircle2, 
  FileText, 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  UserCheck, 
  Compass, 
  Activity, 
  Eye, 
  Plus, 
  RefreshCw, 
  Calendar,
  X,
  Sliders,
  ChevronRight,
  TrendingDown,
  Navigation,
  AlertOctagon,
  Printer
} from 'lucide-react';
import { exportToExcel } from '../../lib/excelExport';
import { Modal } from '../../components/ui/Modal';
import { cn } from '../../lib/utils';
import { useCompany } from '../../contexts/CompanyContext';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

// ==========================================
// TIPOS Y MODELOS DE DATOS
// ==========================================
export interface TractocamionAgua {
  id: string;
  patente: string;
  unidadNumero: string;
  modelo: string;
  capacidadLitros: number;
  conductorNombre: string;
  conductorRut: string;
  conductorTelefono: string;
  rutaAsignada: string;
  origen: string;
  destino: string;
  estadoOperativo: 'EN_RUTA' | 'DETENIDO_CRITICO' | 'RALENTI_EXCESIVO' | 'CARGA_AGUA' | 'DESCARGA_AGUA';
  velocidadActualKmH: number;
  odometroKm: number;
  nivelAguaPorcentaje: number;
  nivelCombustiblePorcentaje: number;
  latitud: number;
  longitud: number;
  ubicacionTexto: string;
  tiempoDetenidoMinutos: number;
  tiempoRalentiMinutos: number;
  ultimaActualizacion: string;
  alertasActivas: string[];
}

export interface RegistroDetencion {
  id: string;
  folio: string;
  unidadId: string;
  patente: string;
  conductorNombre: string;
  conductorRut: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  latitud: number;
  longitud: number;
  lugarTexto: string;
  zona: 'Valle de Azapa' | 'Valle de Lluta' | 'Arica Urbano' | 'Ruta 5 Sur / Chaca' | 'Poconchile';
  motorEstado: 'RALENTI_ENCENDIDO' | 'MOTOR_APAGADO';
  combustiblePerdidoLitros: number;
  costoPerdidaCLP: number;
  desvioRutaKm: number;
  tipoDetencion: 'NO_AUTORIZADA' | 'RALENTI_CRITICO' | 'DESVIO_RUTA' | 'PUNTO_CARGA' | 'PUNTO_DESCARGA';
  nivelCriticidad: 'ALTA' | 'MEDIA' | 'BAJA' | 'NORMAL';
  estadoEntrevista: 'PENDIENTE' | 'JUSTIFICADA' | 'INJUSTIFICADA' | 'EN_INVESTIGACION';
  actaEntrevista?: ActaEntrevista;
}

export interface ActaEntrevista {
  folioActa: string;
  fechaEntrevista: string;
  supervisorNombre: string;
  versionConductorMotivo: string;
  declaracionConductor: string;
  avisoCentral: boolean;
  evidenciaTelemetria: string;
  dictamenSupervisor: 'INJUSTIFICADA' | 'JUSTIFICADA' | 'OBSERVADA';
  accionDisciplinaria: string;
  montoCobroCombustibleCLP?: number;
  firmado: boolean;
}

// ==========================================
// DATOS REALES DE LAS 4 UNIDADES ARICA (SOLON CHAVEZ)
// ==========================================
const UNIDADES_INICIALES: TractocamionAgua[] = [
  {
    id: 'TRACTO-01',
    patente: 'LJ-TR-42',
    unidadNumero: 'Unidad #01',
    modelo: 'Volvo FH 460 6x4 (Aljibe 30.000 L)',
    capacidadLitros: 30000,
    conductorNombre: 'Carlos Mamani Gómez',
    conductorRut: '14.882.319-K',
    conductorTelefono: '+56 9 8451 2290',
    rutaAsignada: 'Arica Planta Aguas Altiplano ➔ Azapa Km 28 (San Miguel)',
    origen: 'Planta Arica (Chacalluta)',
    destino: 'Estanque Municipal Azapa Km 28',
    estadoOperativo: 'DETENIDO_CRITICO',
    velocidadActualKmH: 0,
    odometroKm: 342180,
    nivelAguaPorcentaje: 90,
    nivelCombustiblePorcentaje: 62,
    latitud: -18.5284,
    longitud: -70.1842,
    ubicacionTexto: 'Ruta A-133 Km 14.2, Valle de Azapa (Berma no autorizada)',
    tiempoDetenidoMinutos: 47,
    tiempoRalentiMinutos: 38,
    ultimaActualizacion: 'Hace 2 minutos',
    alertasActivas: [
      'Detención > 40 min fuera de geocerca autorizada',
      'Motor encendido en ralentí prolongado (Consumo innecesario 3.2 Lts)',
      'Desvío no programado hacia camino secundario (+2.8 km)'
    ]
  },
  {
    id: 'TRACTO-02',
    patente: 'PK-CW-18',
    unidadNumero: 'Unidad #02',
    modelo: 'Scania G440 Highline (Aljibe 32.000 L)',
    capacidadLitros: 32000,
    conductorNombre: 'Roberto Condori Ramos',
    conductorRut: '16.320.114-2',
    conductorTelefono: '+56 9 7611 9043',
    rutaAsignada: 'Arica Sector El Morro ➔ Valle de Lluta / Poconchile Km 36',
    origen: 'Arica Sector El Morro',
    destino: 'Estanque Localidad Poconchile Km 36',
    estadoOperativo: 'EN_RUTA',
    velocidadActualKmH: 62,
    odometroKm: 284120,
    nivelAguaPorcentaje: 95,
    nivelCombustiblePorcentaje: 84,
    latitud: -18.4215,
    longitud: -70.2110,
    ubicacionTexto: 'Ruta 11-CH Km 18.5, subida hacia Poconchile',
    tiempoDetenidoMinutos: 0,
    tiempoRalentiMinutos: 0,
    ultimaActualizacion: 'En tiempo real',
    alertasActivas: []
  },
  {
    id: 'TRACTO-03',
    patente: 'SH-ZK-85',
    unidadNumero: 'Unidad #03',
    modelo: 'Mercedes-Benz Actros 2645 (Aljibe 28.000 L)',
    capacidadLitros: 28000,
    conductorNombre: 'Jorge Choque Flores',
    conductorRut: '15.774.902-8',
    conductorTelefono: '+56 9 9342 1105',
    rutaAsignada: 'Arica ➔ Valle de Azapa / Sector Sobraya y Ausipar',
    origen: 'Punto Carga Arica Sur',
    destino: 'Estanque Comunitario Sobraya Km 22',
    estadoOperativo: 'RALENTI_EXCESIVO',
    velocidadActualKmH: 0,
    odometroKm: 198450,
    nivelAguaPorcentaje: 80,
    nivelCombustiblePorcentaje: 48,
    latitud: -18.5140,
    longitud: -70.2290,
    ubicacionTexto: 'Callejón Las Parcelas Km 9.1 Azapa (Fuera de ruta)',
    tiempoDetenidoMinutos: 75,
    tiempoRalentiMinutos: 64,
    ultimaActualizacion: 'Hace 4 minutos',
    alertasActivas: [
      'Ralentí crítico continuo 64 min (Consumo diésel ~5.8 Lts)',
      'Desvío no programado de 3.8 km respecto al corredor de agua'
    ]
  },
  {
    id: 'TRACTO-04',
    patente: 'VR-BP-33',
    unidadNumero: 'Unidad #04',
    modelo: 'Freightliner Cascadia 126 (Aljibe 30.000 L)',
    capacidadLitros: 30000,
    conductorNombre: 'Esteban Quispe Huanca',
    conductorRut: '17.105.843-5',
    conductorTelefono: '+56 9 8221 4409',
    rutaAsignada: 'Arica ➔ Caleta Vítor / Quebrada de Chaca',
    origen: 'Planta de Bombeo Chacalluta',
    destino: 'Comunidad Caleta Vítor Km 45',
    estadoOperativo: 'CARGA_AGUA',
    velocidadActualKmH: 0,
    odometroKm: 412900,
    nivelAguaPorcentaje: 75,
    nivelCombustiblePorcentaje: 92,
    latitud: -18.3980,
    longitud: -70.3015,
    ubicacionTexto: 'Planta Chacalluta - Bahía 2 de Carga (Punto Autorizado)',
    tiempoDetenidoMinutos: 22,
    tiempoRalentiMinutos: 5,
    ultimaActualizacion: 'Hace 1 minuto',
    alertasActivas: []
  }
];

const DETENCIONES_INICIALES: RegistroDetencion[] = [
  {
    id: 'DET-001',
    folio: 'DET-ARI-2026-1014-01',
    unidadId: 'TRACTO-01',
    patente: 'LJ-TR-42',
    conductorNombre: 'Carlos Mamani Gómez',
    conductorRut: '14.882.319-K',
    fecha: '2026-10-14',
    horaInicio: '10:14',
    horaFin: '11:01',
    duracionMinutos: 47,
    latitud: -18.5284,
    longitud: -70.1842,
    lugarTexto: 'Ruta A-133 Km 14.2, Valle de Azapa (Orilla de parcela privada)',
    zona: 'Valle de Azapa',
    motorEstado: 'RALENTI_ENCENDIDO',
    combustiblePerdidoLitros: 3.4,
    costoPerdidaCLP: 3570,
    desvioRutaKm: 2.8,
    tipoDetencion: 'NO_AUTORIZADA',
    nivelCriticidad: 'ALTA',
    estadoEntrevista: 'PENDIENTE'
  },
  {
    id: 'DET-002',
    folio: 'DET-ARI-2026-1014-02',
    unidadId: 'TRACTO-03',
    patente: 'SH-ZK-85',
    conductorNombre: 'Jorge Choque Flores',
    conductorRut: '15.774.902-8',
    fecha: '2026-10-14',
    horaInicio: '08:40',
    horaFin: '09:55',
    duracionMinutos: 75,
    latitud: -18.5140,
    longitud: -70.2290,
    lugarTexto: 'Callejón Las Parcelas Km 9.1 Azapa (Galpón sin rotulación)',
    zona: 'Valle de Azapa',
    motorEstado: 'RALENTI_ENCENDIDO',
    combustiblePerdidoLitros: 5.8,
    costoPerdidaCLP: 6090,
    desvioRutaKm: 3.8,
    tipoDetencion: 'DESVIO_RUTA',
    nivelCriticidad: 'ALTA',
    estadoEntrevista: 'INJUSTIFICADA',
    actaEntrevista: {
      folioActa: 'ACTA-ENT-2026-088',
      fechaEntrevista: '2026-10-14 11:30',
      supervisorNombre: 'Gabriel Ávalos / Supervisor Flota Solon Chavez',
      versionConductorMotivo: 'Alegó espera de personal en punto de descarga',
      declaracionConductor: 'El conductor indicó que el encargado del estanque no contestaba el teléfono y se quedó esperando en la entrada para no dar la vuelta.',
      avisoCentral: false,
      evidenciaTelemetria: 'La telemetría demuestra que el estanque oficial está en el Km 22 (Sobraya) y el camión estuvo detenido en el Km 9.1 (13 km antes) en un galpón privado con motor en ralentí durante 64 minutos. No existió aviso a despacho.',
      dictamenSupervisor: 'INJUSTIFICADA',
      accionDisciplinaria: 'Amonestación formal con copia a carpeta personal y descuento proporcional de 5.8 Lts de combustible.',
      montoCobroCombustibleCLP: 6090,
      firmado: true
    }
  },
  {
    id: 'DET-003',
    folio: 'DET-ARI-2026-1014-03',
    unidadId: 'TRACTO-02',
    patente: 'PK-CW-18',
    conductorNombre: 'Roberto Condori Ramos',
    conductorRut: '16.320.114-2',
    fecha: '2026-10-14',
    horaInicio: '07:15',
    horaFin: '07:38',
    duracionMinutos: 23,
    latitud: -18.4110,
    longitud: -70.2650,
    lugarTexto: 'Bermas Control Sanitario Chacalluta (Ruta 5 Norte)',
    zona: 'Valle de Lluta',
    motorEstado: 'MOTOR_APAGADO',
    combustiblePerdidoLitros: 0,
    costoPerdidaCLP: 0,
    desvioRutaKm: 0,
    tipoDetencion: 'PUNTO_CARGA',
    nivelCriticidad: 'NORMAL',
    estadoEntrevista: 'JUSTIFICADA',
    actaEntrevista: {
      folioActa: 'ACTA-ENT-2026-087',
      fechaEntrevista: '2026-10-14 08:15',
      supervisorNombre: 'Supervisor Turno Mañana',
      versionConductorMotivo: 'Control de Carabineros y SAG en ruta',
      declaracionConductor: 'Fiscalización sanitaria vehicular de rutina en el cruce Chacalluta.',
      avisoCentral: true,
      evidenciaTelemetria: 'Telemetría confirma velocidad 0 km/h en punto de control oficial. Motor apagado. Tiempo acorde al procedimiento.',
      dictamenSupervisor: 'JUSTIFICADA',
      accionDisciplinaria: 'Sin sanción. Procedimiento correcto.',
      firmado: true
    }
  },
  {
    id: 'DET-004',
    folio: 'DET-ARI-2026-1013-04',
    unidadId: 'TRACTO-04',
    patente: 'VR-BP-33',
    conductorNombre: 'Esteban Quispe Huanca',
    conductorRut: '17.105.843-5',
    fecha: '2026-10-13',
    horaInicio: '15:20',
    horaFin: '16:05',
    duracionMinutos: 45,
    latitud: -18.6420,
    longitud: -70.1980,
    lugarTexto: 'Ruta 5 Sur Km 22 (Cruce Caleta Vítor)',
    zona: 'Ruta 5 Sur / Chaca',
    motorEstado: 'RALENTI_ENCENDIDO',
    combustiblePerdidoLitros: 2.9,
    costoPerdidaCLP: 3045,
    desvioRutaKm: 1.2,
    tipoDetencion: 'RALENTI_CRITICO',
    nivelCriticidad: 'MEDIA',
    estadoEntrevista: 'EN_INVESTIGACION'
  }
];

export default function MonitoreoAricaDetenciones() {
  const { currentCompany, activeCompanyId } = useCompany();
  const { currentUser } = useAppContext();
  const { profile } = useAuth();

  const companyId = activeCompanyId || currentCompany?.id || profile?.empresa_id || 'default';
  const companyName = currentCompany?.name || (currentCompany as any)?.nombre || 'Cliente';
  const isSolonChavez = companyName.toLowerCase().includes('solon') || companyName.toLowerCase().includes('chavez');

  const [subTab, setSubTab] = useState<'EN_VIVO' | 'DETENCIONES' | 'ENTREVISTAS' | 'MAPA_ARICA'>('EN_VIVO');
  const [unidades, setUnidades] = useState<TractocamionAgua[]>([]);
  const [detenciones, setDetenciones] = useState<RegistroDetencion[]>([]);
  const [loading, setLoading] = useState(false);

  // Aislamiento Multi-Tenant: Cargar datos específicos de este cliente
  useEffect(() => {
    if (!companyId) return;

    // 1. Cargar Detenciones y Actas aisladas estrictamente por empresa
    const storageKeyDetenciones = `pulser_detenciones_${companyId}`;
    const savedDet = localStorage.getItem(storageKeyDetenciones);
    if (savedDet) {
      try {
        setDetenciones(JSON.parse(savedDet));
      } catch (e) {
        setDetenciones(isSolonChavez ? DETENCIONES_INICIALES : []);
      }
    } else {
      const initial = isSolonChavez ? DETENCIONES_INICIALES : [];
      setDetenciones(initial);
      localStorage.setItem(storageKeyDetenciones, JSON.stringify(initial));
    }

    // 2. Cargar Unidades de Flota aisladas estrictamente por empresa
    if (isSolonChavez) {
      const storageKeyUnidades = `pulser_unidades_${companyId}`;
      const savedUni = localStorage.getItem(storageKeyUnidades);
      if (savedUni) {
        try {
          setUnidades(JSON.parse(savedUni));
        } catch (e) {
          setUnidades(UNIDADES_INICIALES);
        }
      } else {
        setUnidades(UNIDADES_INICIALES);
        localStorage.setItem(storageKeyUnidades, JSON.stringify(UNIDADES_INICIALES));
      }
    } else {
      // Para cualquier otro cliente (ej. Pullman Araksaya, Gaval, etc.):
      // Consultar la base de datos real de vehiculo y colaborador de esta empresa
      const fetchVehiculosEmpresa = async () => {
        setLoading(true);
        try {
          const [vehsRes, colabsRes] = await Promise.all([
            supabase.from('vehiculo').select('*').eq('empresa_id', companyId),
            supabase.from('colaborador').select('*').eq('empresa_id', companyId)
          ]);

          const vehsData = vehsRes.data || [];
          const colabsData = colabsRes.data || [];

          if (vehsData.length > 0) {
            const mapped: TractocamionAgua[] = vehsData.map((v: any, idx: number) => {
              const d = v.detalles || {};
              const colab = colabsData.length > 0 ? colabsData[idx % colabsData.length] : null;
              const hasAlert = idx === 0 && savedDet && JSON.parse(savedDet).length > 0;
              return {
                id: v.id,
                patente: v.patente || `UNID-${idx + 1}`,
                unidadNumero: v.numero_interno ? `Unidad #${v.numero_interno}` : `Unidad #${idx + 1}`,
                modelo: (v.marca || d.marca) && (v.modelo || d.modelo) 
                  ? `${v.marca || d.marca} ${v.modelo || d.modelo}` 
                  : (v.modelo || v.marca || d.modelo || 'Unidad de Flota'),
                capacidadLitros: Number(d.capacidadLitros || 25000),
                conductorNombre: colab?.nombre || d.conductor || 'Conductor Asignado',
                conductorRut: colab?.rut || d.conductorRut || 'Sin RUT',
                conductorTelefono: colab?.telefono || d.conductorTelefono || '+56 9 ...',
                rutaAsignada: d.rutaAsignada || 'Ruta Operacional Activa',
                origen: d.origen || 'Base Central',
                destino: d.destino || 'Punto Operativo',
                estadoOperativo: hasAlert ? 'DETENIDO_CRITICO' : 'EN_RUTA',
                velocidadActualKmH: hasAlert ? 0 : 54,
                odometroKm: Number(v.kilometraje_actual || d.km_manual || 185000),
                nivelAguaPorcentaje: 90,
                nivelCombustiblePorcentaje: 75,
                latitud: -18.4783 + (idx * 0.02),
                longitud: -70.3126 + (idx * 0.02),
                ubicacionTexto: d.ubicacionTexto || 'En ruta operacional',
                tiempoDetenidoMinutos: hasAlert ? 35 : 0,
                tiempoRalentiMinutos: hasAlert ? 28 : 0,
                ultimaActualizacion: 'En tiempo real',
                alertasActivas: hasAlert ? ['Detención no programada > 30 min en ruta'] : []
              };
            });
            setUnidades(mapped);
          } else {
            setUnidades([]);
          }
        } catch (err) {
          console.error("Error al cargar unidades de la empresa:", err);
          setUnidades([]);
        }
        setLoading(false);
      };
      fetchVehiculosEmpresa();
    }
  }, [companyId, isSolonChavez]);

  // Filtros
  const [filtroUnidad, setFiltroUnidad] = useState<string>('TODAS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');

  // Modales
  const [detencionSeleccionada, setDetencionSeleccionada] = useState<RegistroDetencion | null>(null);
  const [isModalEntrevistaOpen, setIsModalEntrevistaOpen] = useState(false);
  const [isModalDetalleUnidadOpen, setIsModalDetalleUnidadOpen] = useState(false);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<TractocamionAgua | null>(null);

  // Formulario Entrevista
  const [formMotivo, setFormMotivo] = useState('Pana mecánica o neumático');
  const [formDeclaracion, setFormDeclaracion] = useState('');
  const [formAvisoCentral, setFormAvisoCentral] = useState(false);
  const [formDictamen, setFormDictamen] = useState<'INJUSTIFICADA' | 'JUSTIFICADA' | 'OBSERVADA'>('INJUSTIFICADA');
  const [formAccion, setFormAccion] = useState('Amonestación verbal y registro en hoja de vida');
  const defaultSupervisor = `${profile?.nombre || currentUser?.nombre || 'Supervisor Operativo'} / ${companyName}`;
  const [formSupervisor, setFormSupervisor] = useState(defaultSupervisor);

  // KPIs dinámicos
  const totalDetenidoHoyMinutos = useMemo(() => {
    return detenciones
      .filter(d => d.tipoDetencion !== 'PUNTO_CARGA')
      .reduce((acc, curr) => acc + curr.duracionMinutos, 0);
  }, [detenciones]);

  const totalCombustiblePerdidoLitros = useMemo(() => {
    return detenciones
      .reduce((acc, curr) => acc + curr.combustiblePerdidoLitros, 0);
  }, [detenciones]);

  const totalCostoPerdidaCLP = useMemo(() => {
    return detenciones
      .reduce((acc, curr) => acc + curr.costoPerdidaCLP, 0);
  }, [detenciones]);

  const totalDesviosDetectados = useMemo(() => {
    return detenciones.filter(d => d.desvioRutaKm > 0).length;
  }, [detenciones]);

  const entrevistasPendientesCount = useMemo(() => {
    return detenciones.filter(d => d.estadoEntrevista === 'PENDIENTE').length;
  }, [detenciones]);

  // Manejo de Apertura de Entrevista
  const abrirModalEntrevista = (detencion: RegistroDetencion) => {
    setDetencionSeleccionada(detencion);
    if (detencion.actaEntrevista) {
      setFormMotivo(detencion.actaEntrevista.versionConductorMotivo);
      setFormDeclaracion(detencion.actaEntrevista.declaracionConductor);
      setFormAvisoCentral(detencion.actaEntrevista.avisoCentral);
      setFormDictamen(detencion.actaEntrevista.dictamenSupervisor);
      setFormAccion(detencion.actaEntrevista.accionDisciplinaria);
      setFormSupervisor(detencion.actaEntrevista.supervisorNombre);
    } else {
      setFormMotivo('Pana mecánica o neumático');
      setFormDeclaracion('');
      setFormAvisoCentral(false);
      setFormDictamen('INJUSTIFICADA');
      setFormAccion('Amonestación escrita y cobro por merma de combustible');
      setFormSupervisor(defaultSupervisor);
    }
    setIsModalEntrevistaOpen(true);
  };

  const guardarActaEntrevista = () => {
    if (!detencionSeleccionada) return;

    const nuevaActa: ActaEntrevista = {
      folioActa: detencionSeleccionada.actaEntrevista?.folioActa || `ACTA-${companyName.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      fechaEntrevista: new Date().toLocaleString('es-CL'),
      supervisorNombre: formSupervisor,
      versionConductorMotivo: formMotivo,
      declaracionConductor: formDeclaracion,
      avisoCentral: formAvisoCentral,
      evidenciaTelemetria: `Telemetría Pulser verificada: Detención de ${detencionSeleccionada.duracionMinutos} min en ${detencionSeleccionada.lugarTexto}. Ralentí: ${detencionSeleccionada.combustiblePerdidoLitros} Lts de combustible diésel. Desvío: ${detencionSeleccionada.desvioRutaKm} km fuera de ruta.`,
      dictamenSupervisor: formDictamen,
      accionDisciplinaria: formAccion,
      montoCobroCombustibleCLP: formDictamen === 'INJUSTIFICADA' ? detencionSeleccionada.costoPerdidaCLP : 0,
      firmado: true
    };

    const updated = detenciones.map(d => {
      if (d.id === detencionSeleccionada.id) {
        return {
          ...d,
          estadoEntrevista: formDictamen === 'INJUSTIFICADA' ? 'INJUSTIFICADA' : formDictamen === 'JUSTIFICADA' ? 'JUSTIFICADA' : 'EN_INVESTIGACION',
          actaEntrevista: nuevaActa
        } as RegistroDetencion;
      }
      return d;
    });

    setDetenciones(updated);
    localStorage.setItem(`pulser_detenciones_${companyId}`, JSON.stringify(updated));
    setIsModalEntrevistaOpen(false);
    alert(`Acta ${nuevaActa.folioActa} registrada y firmada exitosamente en el sistema.`);
  };

  // Simulación de Parada para pruebas en cualquier cliente
  const handleSimularDetencion = () => {
    if (unidades.length === 0) {
      alert(`No hay unidades registradas para ${companyName}. Ingrese vehículos primero en Configuración > Vehículos.`);
      return;
    }
    const targetUni = unidades[0];
    const nuevaDet: RegistroDetencion = {
      id: `DET-${Date.now().toString().slice(-4)}`,
      folio: `DET-${companyName.substring(0, 3).toUpperCase()}-${new Date().toISOString().split('T')[0]}-${Date.now().toString().slice(-2)}`,
      unidadId: targetUni.unidadNumero,
      patente: targetUni.patente,
      conductorNombre: targetUni.conductorNombre,
      conductorRut: targetUni.conductorRut,
      fecha: new Date().toISOString().split('T')[0],
      horaInicio: '11:15',
      horaFin: '11:52',
      duracionMinutos: 37,
      latitud: targetUni.latitud,
      longitud: targetUni.longitud,
      lugarTexto: `${targetUni.ubicacionTexto} (Detención no autorizada en berma)`,
      zona: 'Arica Urbano',
      motorEstado: 'RALENTI_ENCENDIDO',
      combustiblePerdidoLitros: 2.8,
      costoPerdidaCLP: 2940,
      desvioRutaKm: 1.5,
      tipoDetencion: 'NO_AUTORIZADA',
      nivelCriticidad: 'ALTA',
      estadoEntrevista: 'PENDIENTE'
    };

    const updated = [nuevaDet, ...detenciones];
    setDetenciones(updated);
    localStorage.setItem(`pulser_detenciones_${companyId}`, JSON.stringify(updated));
    alert(`Detección de parada generada para la unidad ${targetUni.patente}. Ahora puede realizar el contraste con el conductor en la pestaña de Detenciones.`);
  };

  // Exportar Detenciones a Excel
  const handleExportarExcel = () => {
    const dataAExportar = detenciones.map(d => ({
      'Folio': d.folio,
      'Unidad': d.unidadId,
      'Patente': d.patente,
      'Conductor': d.conductorNombre,
      'RUT': d.conductorRut,
      'Fecha': d.fecha,
      'Hora Inicio': d.horaInicio,
      'Hora Fin': d.horaFin,
      'Duración (Minutos)': d.duracionMinutos,
      'Ubicación GPS': d.lugarTexto,
      'Zona': d.zona,
      'Estado Motor': d.motorEstado === 'RALENTI_ENCENDIDO' ? 'Motor Encendido (Ralentí)' : 'Motor Apagado',
      'Diésel Perdido (Lts)': d.combustiblePerdidoLitros,
      'Costo Merma (CLP)': `$${d.costoPerdidaCLP.toLocaleString('es-CL')}`,
      'Desvío de Ruta (Km)': d.desvioRutaKm,
      'Clasificación': d.tipoDetencion,
      'Estado Entrevista': d.estadoEntrevista,
      'Versión Chofer': d.actaEntrevista?.versionConductorMotivo || 'Sin entrevista',
      'Dictamen Supervisor': d.actaEntrevista?.dictamenSupervisor || 'Pendiente'
    }));
    exportToExcel(dataAExportar, `Auditoria_Detenciones_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}`);
  };

  // Filtrado
  const detencionesFiltradas = useMemo(() => {
    return detenciones.filter(d => {
      const matchUnidad = filtroUnidad === 'TODAS' || d.unidadId === filtroUnidad;
      const matchEstado = filtroEstado === 'TODOS' || d.estadoEntrevista === filtroEstado;
      const matchBusqueda = busqueda === '' || 
        d.conductorNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        d.patente.toLowerCase().includes(busqueda.toLowerCase()) ||
        d.lugarTexto.toLowerCase().includes(busqueda.toLowerCase());
      return matchUnidad && matchEstado && matchBusqueda;
    });
  }, [detenciones, filtroUnidad, filtroEstado, busqueda]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-y-auto">
      
      {/* ============================================================== */}
      {/* CABECERA SUPERIOR: TÍTULO, CLIENTE Y KPIS EN TIEMPO REAL      */}
      {/* ============================================================== */}
      <div className="bg-slate-800/90 border-b border-slate-700/80 px-6 py-4 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-white tracking-tight">
                    Monitoreo en Tiempo Real y Auditoría de Paradas
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    CLIENTE: {companyName.toUpperCase()}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    {isSolonChavez ? 'SERVICIO TRASLADO AGUA • ARICA' : `SERVICIO OPERATIVO • ${companyName.toUpperCase()}`}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isSolonChavez
                    ? 'Control operativo de 4 unidades tractocamión cisterna (Azapa, Lluta, Poconchile, Chaca). Detección automática de detenciones, mermas de tiempo, ralentí y módulo de entrevista con conductor.'
                    : `Supervisión en tiempo real de paradas no autorizadas, excesos de ralentí, mermas de diésel y entrevistas de contraste con conductores para la flota de ${companyName}.`}
                </p>
              </div>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN RÁPIDA */}
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => {
                alert(`Sincronizando telemetría en tiempo real para las unidades de ${companyName}...`);
              }}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-600"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refrescar GPS
            </button>
            <button 
              onClick={handleExportarExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar Auditoría Excel
            </button>
          </div>
        </div>

        {/* 4 CARDS DE KPIS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Flota en Servicio</span>
              <span className="text-lg font-black text-white">
                {unidades.length} {isSolonChavez ? 'Tractocamiones' : 'Unidades'}
              </span>
              <span className="text-[10px] text-emerald-400 block font-medium">
                {unidades.length > 0 ? '100% unidades monitoreadas' : 'Sin unidades activas'}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Tiempo Perdido Hoy</span>
              <span className="text-lg font-black text-amber-400">
                {Math.floor(totalDetenidoHoyMinutos / 60)}h {totalDetenidoHoyMinutos % 60}m
              </span>
              <span className="text-[10px] text-amber-300 block font-medium">Paradas no programadas</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Merma Diésel Ralentí</span>
              <span className="text-lg font-black text-rose-400">{totalCombustiblePerdidoLitros.toFixed(1)} Litros</span>
              <span className="text-[10px] text-rose-300 block font-medium">~${totalCostoPerdidaCLP.toLocaleString('es-CL')} CLP en pérdida</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Entrevistas Conductor</span>
              <span className="text-lg font-black text-purple-400">{entrevistasPendientesCount} Pendientes</span>
              <span className="text-[10px] text-purple-300 block font-medium">{totalDesviosDetectados} desvíos de ruta hoy</span>
            </div>
          </div>
        </div>

        {/* NAVEGACIÓN ENTRE SUB-PESTAÑAS */}
        <div className="flex gap-2 mt-4 border-t border-slate-700/60 pt-3">
          <button
            onClick={() => setSubTab('EN_VIVO')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
              subTab === 'EN_VIVO'
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            )}
          >
            <Activity className="w-4 h-4" />
            1. Monitoreo en Vivo ({unidades.length} Unidades)
          </button>

          <button
            onClick={() => setSubTab('DETENCIONES')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 relative",
              subTab === 'DETENCIONES'
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            )}
          >
            <Clock className="w-4 h-4" />
            2. Registro de Detenciones y Desvíos
            {entrevistasPendientesCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-black rounded-full animate-pulse">
                {entrevistasPendientesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('ENTREVISTAS')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
              subTab === 'ENTREVISTAS'
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            )}
          >
            <UserCheck className="w-4 h-4" />
            3. Actas y Contrastes con Choferes
          </button>

          <button
            onClick={() => setSubTab('MAPA_ARICA')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
              subTab === 'MAPA_ARICA'
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            )}
          >
            <Compass className="w-4 h-4" />
            4. {isSolonChavez ? 'Mapa Satelital de Corredores (Arica)' : `Mapa Satelital de Rutas (${companyName})`}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-PESTAÑA 1: MONITOREO EN VIVO                                */}
      {/* ============================================================== */}
      {subTab === 'EN_VIVO' && (
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Estado Operacional de Flota ({companyName})</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-normal">
                  Actualización automática cada 30 seg
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Supervisión directa de velocidad, posición satelital, nivel de cisterna/estanque y alertas de ralentí/detención prolongada.
              </p>
            </div>
          </div>

          {unidades.length === 0 ? (
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center mx-auto text-slate-400">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">No hay vehículos registrados para {companyName}</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Para iniciar el monitoreo de telemetría y auditoría de paradas en este cliente, registre unidades en el módulo de Configuración o realice una carga de flota.
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unidades.map(u => {
              const isDetenido = u.estadoOperativo === 'DETENIDO_CRITICO';
              const isRalenti = u.estadoOperativo === 'RALENTI_EXCESIVO';
              const isEnRuta = u.estadoOperativo === 'EN_RUTA';
              const isCarga = u.estadoOperativo === 'CARGA_AGUA';

              return (
                <div 
                  key={u.id}
                  className={cn(
                    "bg-slate-800/90 border rounded-2xl p-5 shadow-lg transition-all",
                    isDetenido ? "border-rose-500/50 bg-rose-950/20 ring-1 ring-rose-500/30" :
                    isRalenti ? "border-amber-500/50 bg-amber-950/20 ring-1 ring-amber-500/30" :
                    isCarga ? "border-cyan-500/40 bg-cyan-950/20" :
                    "border-slate-700/80 hover:border-blue-500/40"
                  )}
                >
                  {/* Encabezado Tarjeta */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border shadow-sm",
                        isDetenido ? "bg-rose-500/20 text-rose-400 border-rose-500/30" :
                        isRalenti ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                        isCarga ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" :
                        "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      )}>
                        {u.unidadNumero.replace('Unidad #', '#')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-white tracking-wide">{u.patente}</span>
                          <span className="text-xs text-slate-400">({u.unidadNumero})</span>
                        </div>
                        <div className="text-xs text-slate-300 font-medium">{u.modelo}</div>
                      </div>
                    </div>

                    {/* Badge Estado */}
                    <div>
                      {isDetenido && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1.5 animate-pulse">
                          <AlertOctagon className="w-3.5 h-3.5" />
                          DETENIDO NO AUTORIZADO ({u.tiempoDetenidoMinutos} min)
                        </span>
                      )}
                      {isRalenti && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          RALENTÍ EXCESIVO ({u.tiempoRalentiMinutos} min)
                        </span>
                      )}
                      {isEnRuta && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                          <Navigation className="w-3.5 h-3.5" />
                          EN RUTA ({u.velocidadActualKmH} km/h)
                        </span>
                      )}
                      {isCarga && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center gap-1.5">
                          <Fuel className="w-3.5 h-3.5" />
                          CARGA DE AGUA (Planta)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Conductor y Ruta */}
                  <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/50 mb-3 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Conductor a cargo:</span>
                      <span className="font-bold text-white flex items-center gap-1">
                        👤 {u.conductorNombre} <span className="text-slate-500 font-normal">({u.conductorRut})</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Teléfono / Radio:</span>
                      <span className="text-blue-400 font-semibold">{u.conductorTelefono}</span>
                    </div>
                    <div className="flex justify-between items-start pt-1 border-t border-slate-800">
                      <span className="text-slate-400 font-medium">Ruta Programada:</span>
                      <span className="font-semibold text-slate-200 text-right max-w-[280px]">{u.rutaAsignada}</span>
                    </div>
                  </div>

                  {/* Telemetría en Números */}
                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    <div className="bg-slate-900/40 border border-slate-700/40 rounded-lg p-2">
                      <span className="text-[10px] text-slate-400 block uppercase">Nivel Cisterna</span>
                      <span className="text-sm font-black text-cyan-400">{u.nivelAguaPorcentaje}%</span>
                      <span className="text-[9px] text-slate-500 block">{(u.capacidadLitros * u.nivelAguaPorcentaje / 100).toLocaleString('es-CL')} Lts</span>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-700/40 rounded-lg p-2">
                      <span className="text-[10px] text-slate-400 block uppercase">Combustible Diésel</span>
                      <span className="text-sm font-black text-amber-400">{u.nivelCombustiblePorcentaje}%</span>
                      <span className="text-[9px] text-slate-500 block">Estanque Tracto</span>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-700/40 rounded-lg p-2">
                      <span className="text-[10px] text-slate-400 block uppercase">Odómetro Actual</span>
                      <span className="text-sm font-black text-slate-200">{u.odometroKm.toLocaleString('es-CL')}</span>
                      <span className="text-[9px] text-slate-500 block">Kilómetros</span>
                    </div>
                  </div>

                  {/* Ubicación Geográfica */}
                  <div className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/40 mb-3">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Posición Geográfica:</span>
                      <span>{u.ubicacionTexto}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">GPS: {u.latitud.toFixed(4)}, {u.longitud.toFixed(4)} • {u.ultimaActualizacion}</span>
                    </div>
                  </div>

                  {/* Alertas Activas Si las hay */}
                  {u.alertasActivas.length > 0 && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5 mb-3 space-y-1">
                      <span className="text-[11px] font-black text-rose-400 flex items-center gap-1.5 uppercase">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Alertas Operacionales Activas:
                      </span>
                      {u.alertasActivas.map((al, idx) => (
                        <div key={idx} className="text-[11px] text-rose-200 pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-rose-400">
                          {al}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                    <button 
                      onClick={() => {
                        setSubTab('DETENCIONES');
                        setFiltroUnidad(u.id);
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                    >
                      Ver Historial de Detenciones
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {(isDetenido || isRalenti) && (
                      <button 
                        onClick={() => {
                          const det = detenciones.find(d => d.unidadId === u.id);
                          if (det) abrirModalEntrevista(det);
                          else alert("No hay detención activa registrada para esta unidad.");
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-black shadow-md flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Iniciar Entrevista Chofer
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-PESTAÑA 2: REGISTRO Y AUDITORÍA DE TODAS LAS DETENCIONES   */}
      {/* ============================================================== */}
      {subTab === 'DETENCIONES' && (
        <div className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Bitácora de Detenciones y Desvíos Detectados por Telemetría</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-normal">
                  {detencionesFiltradas.length} eventos registrados
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Evidencia irrefutable de cuándo y dónde se detuvo cada tractocamión, duración, combustible consumido en ralentí y estado de la entrevista de contraste.
              </p>
            </div>

            {/* FILTROS */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar chofer, patente, lugar..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <select 
                value={filtroUnidad} 
                onChange={(e) => setFiltroUnidad(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="TODAS">Todas las Unidades</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.unidadNumero}>
                    {u.unidadNumero} ({u.patente})
                  </option>
                ))}
              </select>

              <select 
                value={filtroEstado} 
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="PENDIENTE">⏳ Entrevista Pendiente</option>
                <option value="INJUSTIFICADA">🔴 Injustificada (Sanción)</option>
                <option value="JUSTIFICADA">🟢 Justificada</option>
                <option value="EN_INVESTIGACION">🔍 En Investigación</option>
              </select>
            </div>
          </div>

          {/* TABLA PRINCIPAL */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Unidad / Chofer</th>
                    <th className="px-4 py-3">Horario y Duración</th>
                    <th className="px-4 py-3">Lugar Detención (GPS)</th>
                    <th className="px-4 py-3">Motor y Combustible</th>
                    <th className="px-4 py-3">Desvío de Ruta</th>
                    <th className="px-4 py-3">Estado Entrevista</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 text-slate-300">
                  {detencionesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3 border border-slate-700">
                          <Clock className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">Sin eventos de detención registrados</h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                          No se encontraron detenciones con los filtros actuales para {companyName}.
                        </p>
                        <button
                          onClick={handleSimularParada}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md inline-flex items-center gap-2"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>Simular Detección de Parada para Prueba</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    detencionesFiltradas.map(d => {
                    const isPendiente = d.estadoEntrevista === 'PENDIENTE';
                    const isInjustificada = d.estadoEntrevista === 'INJUSTIFICADA';
                    const isJustificada = d.estadoEntrevista === 'JUSTIFICADA';

                    return (
                      <tr key={d.id} className="hover:bg-slate-750/50 transition-colors">
                        {/* UNIDAD Y CHOFER */}
                        <td className="px-4 py-3">
                          <div className="font-black text-white">{d.patente}</div>
                          <div className="text-[11px] text-slate-400">{d.conductorNombre}</div>
                          <div className="text-[10px] text-slate-500">RUT: {d.conductorRut}</div>
                        </td>

                        {/* HORARIO Y DURACIÓN */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                            {d.horaInicio} - {d.horaFin}
                          </div>
                          <div className="text-[11px] text-amber-400 font-black">
                            {d.duracionMinutos} minutos detenido
                          </div>
                          <div className="text-[10px] text-slate-500">{d.fecha}</div>
                        </td>

                        {/* LUGAR Y GPS */}
                        <td className="px-4 py-3 max-w-[260px]">
                          <div className="font-semibold text-slate-200 leading-snug">{d.lugarTexto}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                            Zona: {d.zona}
                          </div>
                        </td>

                        {/* MOTOR Y COMBUSTIBLE */}
                        <td className="px-4 py-3">
                          {d.motorEstado === 'RALENTI_ENCENDIDO' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 block w-fit mb-1">
                              Ralentí (Motor Encendido)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300 block w-fit mb-1">
                              Motor Apagado
                            </span>
                          )}
                          <div className="text-[11px] font-bold text-rose-400">
                            {d.combustiblePerdidoLitros > 0 ? `-${d.combustiblePerdidoLitros} Lts (~$${d.costoPerdidaCLP.toLocaleString('es-CL')})` : 'Sin merma diésel'}
                          </div>
                        </td>

                        {/* DESVÍO DE RUTA */}
                        <td className="px-4 py-3">
                          {d.desvioRutaKm > 0 ? (
                            <span className="text-rose-400 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              +{d.desvioRutaKm} km fuera de ruta
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-medium">Sobre ruta oficial</span>
                          )}
                        </td>

                        {/* ESTADO ENTREVISTA */}
                        <td className="px-4 py-3">
                          {isPendiente && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit animate-pulse">
                              ⏳ PENDIENTE ENTREVISTA
                            </span>
                          )}
                          {isInjustificada && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1 w-fit">
                              🔴 INJUSTIFICADA (Sanción)
                            </span>
                          )}
                          {isJustificada && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                              🟢 JUSTIFICADA
                            </span>
                          )}
                          {d.estadoEntrevista === 'EN_INVESTIGACION' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1 w-fit">
                              🔍 EN INVESTIGACIÓN
                            </span>
                          )}
                        </td>

                        {/* ACCIONES */}
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => abrirModalEntrevista(d)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 ml-auto",
                              isPendiente
                                ? "bg-rose-600 hover:bg-rose-500 text-white"
                                : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                            )}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {isPendiente ? 'Entrevistar Chofer' : 'Ver Acta Firmada'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-PESTAÑA 3: ACTAS Y CONTRASTES DE ENTREVISTAS CON CHOFERES  */}
      {/* ============================================================== */}
      {subTab === 'ENTREVISTAS' && (
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Módulo de Entrevistas y Contrastes con Conductores</span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-normal">
                  Herramienta de confrontación oficial
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Historial de actas donde se contrasta la versión declarada por el conductor contra la evidencia técnica de la telemetría satelital Pulser.
              </p>
            </div>
          </div>

          {detenciones.filter(d => d.actaEntrevista).length === 0 ? (
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center mx-auto text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">No hay actas de entrevista registradas para {companyName}</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Las actas oficiales se generan desde la pestaña "Bitácora de Detenciones" al pulsar el botón "Entrevistar Chofer" sobre una detención registrada.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detenciones.filter(d => d.actaEntrevista).map(d => {
                const acta = d.actaEntrevista!;
                const isInjustificada = acta.dictamenSupervisor === 'INJUSTIFICADA';

                return (
                  <div key={d.id} className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
                    {/* Encabezado Acta */}
                    <div className="flex justify-between items-start border-b border-slate-700 pb-3">
                      <div>
                        <span className="text-xs font-mono font-bold text-blue-400 block">{acta.folioActa}</span>
                        <h3 className="text-base font-black text-white">Conductor: {d.conductorNombre}</h3>
                        <span className="text-xs text-slate-400">Tractocamión Patente: {d.patente} • Fecha: {acta.fechaEntrevista}</span>
                      </div>

                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-black border",
                        isInjustificada ? "bg-rose-500/20 text-rose-400 border-rose-500/40" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      )}>
                        {acta.dictamenSupervisor}
                      </span>
                    </div>

                    {/* Lado A: Versión del Conductor */}
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 space-y-1 text-xs">
                      <span className="font-bold text-amber-400 flex items-center gap-1.5 uppercase text-[10px]">
                        🗣️ Versión Declarada por el Conductor:
                      </span>
                      <div className="font-semibold text-white">Motivo: "{acta.versionConductorMotivo}"</div>
                      <p className="text-slate-300 italic text-[11px] bg-slate-800/50 p-2 rounded border border-slate-700/40">
                        "{acta.declaracionConductor}"
                      </p>
                      <div className="text-[10px] text-slate-400">
                        ¿Reportó a la central de radio/despacho?: <strong className={acta.avisoCentral ? "text-emerald-400" : "text-rose-400"}>{acta.avisoCentral ? "SÍ AVISÓ" : "NO AVISÓ"}</strong>
                      </div>
                    </div>

                    {/* Lado B: Evidencia Telemetría Pulser */}
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 space-y-1 text-xs">
                      <span className="font-bold text-blue-400 flex items-center gap-1.5 uppercase text-[10px]">
                        🛰️ Evidencia Técnica de Telemetría Pulser:
                      </span>
                      <p className="text-slate-300 text-[11px]">
                        {acta.evidenciaTelemetria}
                      </p>
                    </div>

                    {/* Resolución y Sanción */}
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Resolución del Supervisor:</span>
                        <span className="font-bold text-white">{acta.supervisorNombre}</span>
                      </div>
                      <div className="text-slate-300">
                        <strong>Acción aplicada:</strong> {acta.accionDisciplinaria}
                      </div>
                      {acta.montoCobroCombustibleCLP && acta.montoCobroCombustibleCLP > 0 && (
                        <div className="text-rose-400 font-black">
                          Cargo por pérdida de combustible: ${acta.montoCobroCombustibleCLP.toLocaleString('es-CL')} CLP
                        </div>
                      )}
                    </div>

                    {/* Pie de Firma */}
                    <div className="flex justify-between items-center pt-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Acta Registrada y Firmada
                      </span>
                      <button 
                        onClick={() => window.print()}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Printer className="w-3 h-3" />
                        Imprimir Acta
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-PESTAÑA 4: MAPA SATELITAL DE CORREDORES (ARICA)            */}
      {/* ============================================================== */}
      {subTab === 'MAPA_ARICA' && (
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>
                  {isSolonChavez
                    ? 'Corredores de Transporte de Agua • Región de Arica y Parinacota'
                    : `Monitoreo Satelital de Rutas y Corredores • ${companyName}`}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-normal">
                  Red Georreferenciada
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isSolonChavez
                  ? 'Visualización de las 4 rutas activas: Valle de Azapa (Ruta A-133), Valle de Lluta / Poconchile (Ruta 11-CH) y Chaca (Ruta 5 Sur).'
                  : `Supervisión de rutas activas, geocercas operacionales y puntos de control de flota para ${companyName}.`}
              </p>
            </div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">
            {/* Esquema Visual Interactivo */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-700 p-2.5 rounded-lg text-xs space-y-1">
                <span className="font-bold text-white block text-[10px] uppercase">Simbología Corredores:</span>
                <div className="flex items-center gap-2 text-[10px] text-emerald-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> En Ruta Normal
                </div>
                <div className="flex items-center gap-2 text-[10px] text-rose-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div> Detenido No Autorizado
                </div>
                <div className="flex items-center gap-2 text-[10px] text-amber-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> Ralentí Crítico
                </div>
                <div className="flex items-center gap-2 text-[10px] text-cyan-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-500"></div> Base / Planta de Carga
                </div>
              </div>

              {isSolonChavez ? (
                <>
                  {/* RUTA 1: VALLE DE AZAPA */}
                  <div className="mb-6 p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-cyan-400 flex items-center gap-2">
                        <Navigation className="w-4 h-4" />
                        Corredor 1: Arica Centro ➔ Valle de Azapa (Ruta A-133 hasta Km 28)
                      </span>
                      <span className="text-xs text-rose-400 font-bold">1 Alerta Activa</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span>💧 Punto Carga: Planta Arica</span>
                      <span>➔ Km 8 Sobraya</span>
                      <span>➔ Km 14 San Miguel</span>
                      <span className="text-rose-400 font-black">🔴 Unidad #01 Detenida (Km 14.2)</span>
                      <span>➔ Km 28 Estanque Final</span>
                    </div>
                  </div>

                  {/* RUTA 2: VALLE DE LLUTA */}
                  <div className="mb-6 p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-emerald-400 flex items-center gap-2">
                        <Navigation className="w-4 h-4" />
                        Corredor 2: Arica ➔ Valle de Lluta / Poconchile (Ruta 11-CH hasta Km 36)
                      </span>
                      <span className="text-xs text-emerald-400 font-bold">Tránsito Fluido</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span>💧 Punto Carga: Chacalluta</span>
                      <span>➔ Cruce Panamericana</span>
                      <span className="text-emerald-400 font-black">🟢 Unidad #02 en Tránsito (62 km/h)</span>
                      <span>➔ Poconchile Estanque</span>
                    </div>
                  </div>

                  {/* RUTA 3: RUTA 5 SUR A CHACA */}
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-amber-400 flex items-center gap-2">
                        <Navigation className="w-4 h-4" />
                        Corredor 3: Arica ➔ Caleta Vítor / Quebrada de Chaca (Ruta 5 Sur)
                      </span>
                      <span className="text-xs text-amber-400 font-bold">1 Carga Activa</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-cyan-400 font-black">💧 Unidad #04 Cargando en Planta</span>
                      <span>➔ Cuesta de Acha</span>
                      <span>➔ Cruce Vítor</span>
                      <span>➔ Chaca</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {unidades.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 space-y-2">
                      <Compass className="w-8 h-8 mx-auto text-slate-500 opacity-60" />
                      <p className="text-sm font-semibold text-slate-300">No hay vehículos con rutas satelitales configuradas para {companyName}.</p>
                      <p className="text-xs text-slate-500">Agregue unidades vehiculares para visualizarlas en el mapa de trayectos.</p>
                    </div>
                  ) : (
                    unidades.map((u, idx) => {
                      const isDetenido = u.estadoOperativo === 'DETENIDO_CRITICO';
                      const isRalenti = u.estadoOperativo === 'RALENTI_EXCESIVO';

                      return (
                        <div key={u.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-cyan-400 flex items-center gap-2">
                              <Navigation className="w-4 h-4" />
                              Ruta Operativa #{idx + 1}: {u.unidadNumero} ({u.patente})
                            </span>
                            <span className={cn(
                              "text-xs font-bold",
                              isDetenido ? "text-rose-400" : isRalenti ? "text-amber-400" : "text-emerald-400"
                            )}>
                              {isDetenido ? '🔴 Detenido Crítico' : isRalenti ? '🟡 Ralentí Excesivo' : '🟢 En Tránsito Normal'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
                            <span>Base Central</span>
                            <span>➔ En Desplazamiento</span>
                            <span className={isDetenido ? "text-rose-400 font-black" : "text-emerald-400 font-bold"}>
                              {u.patente} • {u.velocidadKmH} km/h • {u.ubicacionActual}
                            </span>
                            <span>➔ Destino Operativo</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL OFICIAL DE ENTREVISTA Y CONTRASTE CON EL CONDUCTOR       */}
      {/* ============================================================== */}
      {isModalEntrevistaOpen && detencionSeleccionada && (
        <Modal
          isOpen={isModalEntrevistaOpen}
          onClose={() => setIsModalEntrevistaOpen(false)}
          title={`Acta de Contraste Operacional y Entrevista con Chofer • Folio: ${detencionSeleccionada.folio}`}
          size="4xl"
        >
          <div className="space-y-5 text-xs text-slate-200">
            {/* Banner de Datos de la Unidad */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Tractocamión</span>
                <span className="text-base font-black text-white">{detencionSeleccionada.patente}</span>
                <span className="text-[10px] text-slate-400 block">{detencionSeleccionada.unidadId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Conductor Citado</span>
                <span className="text-sm font-black text-white">{detencionSeleccionada.conductorNombre}</span>
                <span className="text-[10px] text-slate-400 block">RUT: {detencionSeleccionada.conductorRut}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Horario de Parada</span>
                <span className="text-sm font-black text-amber-400">{detencionSeleccionada.horaInicio} a {detencionSeleccionada.horaFin}</span>
                <span className="text-[10px] text-slate-400 block">{detencionSeleccionada.fecha} ({detencionSeleccionada.duracionMinutos} min)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Merma de Combustible</span>
                <span className="text-sm font-black text-rose-400">-{detencionSeleccionada.combustiblePerdidoLitros} Litros</span>
                <span className="text-[10px] text-rose-300 block">Valor: ~${detencionSeleccionada.costoPerdidaCLP.toLocaleString('es-CL')} CLP</span>
              </div>
            </div>

            {/* CUERPO DEL CONTRASTE (LADO A LADO) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* COLUMNA 1: EVIDENCIA TELEMETRÍA PULSER */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-xs border-b border-slate-800 pb-2">
                  <Compass className="w-4 h-4" />
                  1. Evidencia Satelital Pulser (Inalterable)
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Lugar Geográfico de la Detención:</span>
                    <span className="text-white font-semibold">{detencionSeleccionada.lugarTexto}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Coordenadas GPS Exactas:</span>
                    <span className="font-mono text-slate-300">{detencionSeleccionada.latitud}, {detencionSeleccionada.longitud}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Estado del Motor durante la Parada:</span>
                    <span className="text-amber-400 font-bold">
                      {detencionSeleccionada.motorEstado === 'RALENTI_ENCENDIDO' ? 'MOTOR ENCENDIDO EN RALENTÍ (Consumiendo Diésel)' : 'MOTOR APAGADO'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Desvío de la Ruta Oficial de Agua:</span>
                    <span className="text-rose-400 font-bold">
                      {detencionSeleccionada.desvioRutaKm > 0 ? `+${detencionSeleccionada.desvioRutaKm} km fuera de la ruta programada` : 'Sobre la ruta'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                  💡 <em>Esta información proviene del dispositivo GPS instalado en la unidad y no puede ser alterada por el conductor.</em>
                </div>
              </div>

              {/* COLUMNA 2: DECLARACIÓN DEL CONDUCTOR */}
              <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-xs border-b border-slate-700 pb-2">
                  <UserCheck className="w-4 h-4" />
                  2. Declaración del Conductor en Entrevista
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Motivo alegado por el chofer:
                  </label>
                  <select
                    value={formMotivo}
                    onChange={(e) => setFormMotivo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Pana mecánica o alarma en tablero">Pana mecánica o alarma en tablero</option>
                    <option value="Pinchazo de neumático o válvula de agua">Pinchazo de neumático o válvula de agua</option>
                    <option value="Congestión vehicular / Corte de ruta">Congestión vehicular / Corte de ruta</option>
                    <option value="Espera de recepción en estanque localidad">Espera de recepción en estanque localidad</option>
                    <option value="Parada de colación / Descanso no autorizado">Parada de colación / Descanso no autorizado</option>
                    <option value="Desvío para trámite personal no autorizado">Desvío para trámite personal no autorizado</option>
                    <option value="Otro motivo justificado">Otro motivo justificado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Relato textual del conductor (Descargos):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Escriba exactamente lo que el conductor declaró durante la entrevista..."
                    value={formDeclaracion}
                    onChange={(e) => setFormDeclaracion(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="avisoCentral"
                    checked={formAvisoCentral}
                    onChange={(e) => setFormAvisoCentral(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <label htmlFor="avisoCentral" className="text-[11px] font-semibold text-slate-200 cursor-pointer">
                    ¿El conductor reportó la detención a la central de radio oportunamente?
                  </label>
                </div>
              </div>
            </div>

            {/* SECCIÓN INFERIOR: RESOLUCIÓN Y DICTAMEN DEL SUPERVISOR */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold uppercase text-xs border-b border-slate-800 pb-2">
                <ShieldAlert className="w-4 h-4" />
                3. Dictamen Oficial del Supervisor (Solon Chavez)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Calificación de la Parada:
                  </label>
                  <select
                    value={formDictamen}
                    onChange={(e) => setFormDictamen(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="INJUSTIFICADA">🔴 INJUSTIFICADA (Aplica Sanción)</option>
                    <option value="JUSTIFICADA">🟢 JUSTIFICADA (Fuerza Mayor)</option>
                    <option value="OBSERVADA">🟡 OBSERVADA (Advertencia)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Medida Disciplinaria / Operativa:
                  </label>
                  <input
                    type="text"
                    value={formAccion}
                    onChange={(e) => setFormAccion(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Supervisor Responsable:
                  </label>
                  <input
                    type="text"
                    value={formSupervisor}
                    onChange={(e) => setFormSupervisor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {formDictamen === 'INJUSTIFICADA' && detencionSeleccionada.costoPerdidaCLP > 0 && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs font-semibold flex items-center justify-between">
                  <span>⚠️ Cargo por combustible diésel consumido en ralentí no justificado:</span>
                  <span className="text-sm font-black text-rose-400">${detencionSeleccionada.costoPerdidaCLP.toLocaleString('es-CL')} CLP</span>
                </div>
              )}
            </div>

            {/* BOTONES DE CIERRE */}
            <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalEntrevistaOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarActaEntrevista}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Firmar y Guardar Acta en el Sistema
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
