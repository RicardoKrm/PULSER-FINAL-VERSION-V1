import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  Search, Filter, Plus, FileSpreadsheet, AlertTriangle, 
  CheckCircle, Clock, Truck, ChevronRight, Activity, Wrench,
  MoreVertical, Edit3, History, TrendingUp, Archive, Trash2,
  Table as TableIcon, List, Eye, ArrowLeft
} from 'lucide-react';
import { CrearOTModal } from '../../components/flota/CrearOTModal';
import { CrearVehiculoModal } from '../../components/flota/CrearVehiculoModal';
import { Modal } from '../../components/ui/Modal';

export default function PizarraMantenimiento() {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(true);
  const [actionMenuOpen, setActionMenuOpen] = useState<number | null>(null);
  const [modalOTOpen, setModalOTOpen] = useState(false);
  const [vehiculoSeleccionadoOT, setVehiculoSeleccionadoOT] = useState<string | undefined>();
  const [selectedVehicleRow, setSelectedVehicleRow] = useState<number | null>(null);
  const [vistaTabla, setVistaTabla] = useState(false);
  const [fichaTecnicaVehiculo, setFichaTecnicaVehiculo] = useState<any | null>(null);
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

  const [filtroProxMantDesde, setFiltroProxMantDesde] = useState('');
  const [filtroProxMantHasta, setFiltroProxMantHasta] = useState('');
  const [filtroUltMantDesde, setFiltroUltMantDesde] = useState('');
  const [filtroUltMantHasta, setFiltroUltMantHasta] = useState('');

  const [dataFlota, setDataFlota] = useState([
    { id: 1, numeroInterno: '1', patente: 'SXDR14', marca: 'M. BENZ', modelo: 'SPRINTER VS30.2', ano: 2021, chasis: '8AC907645RE232278', motor: '651958W0153260', norma: 'EURO V', aplicacion: 'CARRETERA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 10000, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 153304, ultimoMant: { km: 136100, fecha: '15/07/25', tipo: 'SM1' }, proxMant: { kmFaltante: -7204, kmTarget: 146100, fechaProg: '24/06/26', tipo: 'SM1', kmVencido: 7204, vencidosStr: 'SM1' }, estado: 'VENCIDO' },
    { id: 2, numeroInterno: '2', patente: 'JPHK19', marca: 'HYUNDAI', modelo: 'NEW H1', ano: 2022, chasis: 'KMJWA37KAHU906423', motor: 'D4CBH230950', norma: 'EURO V', aplicacion: 'CARRETERA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 10000, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 212361, ultimoMant: { km: 205000, fecha: '24/02/25', tipo: 'MH1' }, proxMant: { kmFaltante: 2639, kmTarget: 215000, fechaProg: '04/10/26', tipo: 'MH1' }, estado: 'NORMAL' },
    { id: 3, numeroInterno: '3', patente: 'RCKY25', marca: 'M. BENZ', modelo: 'SPRINTER VS30.2', ano: 2023, chasis: 'W1V907657NP308884', motor: '65195835365160', norma: 'EURO V', aplicacion: 'CARRETERA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 10000, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 156752, ultimoMant: { km: 151841, fecha: '25/08/25', tipo: 'SM4' }, proxMant: { kmFaltante: 5089, kmTarget: 161841, fechaProg: '03/06/26', tipo: 'SM4' }, estado: 'NORMAL' },
    { id: 4, numeroInterno: '4', patente: 'SVJC32', marca: 'M. BENZ', modelo: 'SPRINTER VS30.1', ano: 2024, chasis: '8AC907645RE232449', motor: '651958W0153491', norma: 'EURO V', aplicacion: 'CARRETERA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 15000, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 125088, ultimoMant: { km: 115119, fecha: '06/09/25', tipo: 'SM1' }, proxMant: { kmFaltante: 5031, kmTarget: 130119, fechaProg: '03/06/26', tipo: 'SM1' }, estado: 'NORMAL' },
    { id: 5, numeroInterno: '5', patente: 'KHLW39', marca: 'M. BENZ', modelo: 'SPRINTER NCV3', ano: 2020, chasis: 'WDB906635KP571358', motor: '651955475357', norma: 'EURO V', aplicacion: 'CARRETERA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 15000, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 434431, ultimoMant: { km: 433805, fecha: '17/10/25', tipo: 'S L' }, proxMant: { kmFaltante: 14374, kmTarget: 448805, fechaProg: '14/06/26', tipo: 'S L' }, estado: 'NORMAL' },
    { id: 6, numeroInterno: '6', patente: 'TDJD43', marca: 'M. BENZ', modelo: 'SPRINTER VS30.1', ano: 2021, chasis: '8AC907645RE233379', motor: '651958W0154308', norma: 'EURO V', aplicacion: 'CARRETERA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 15000, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 162776, ultimoMant: { km: 150100, fecha: '12/09/25', tipo: 'SM1' }, proxMant: { kmFaltante: 2324, kmTarget: 165100, fechaProg: '31/05/26', tipo: 'SM1' }, estado: 'NORMAL' },
    { id: 7, numeroInterno: '7', patente: 'SBWF44', marca: 'M. BENZ', modelo: 'SPRINTER VS30.1', ano: 2022, chasis: 'W1V907645NP380778', motor: '65195835438210', norma: 'EURO V', aplicacion: 'CARRETERA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 15000, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 265131, ultimoMant: { km: 250000, fecha: '31/07/25', tipo: 'SM1' }, proxMant: { kmFaltante: -131, kmTarget: 265000, fechaProg: '18/05/26', tipo: 'SM1', kmVencido: 131, vencidosStr: 'SM1' }, estado: 'VENCIDO' },
    { id: 8, numeroInterno: '8', patente: 'TCLR44', marca: 'M. BENZ', modelo: 'SPRINTER VS30.1', ano: 2023, chasis: '8AC907645RE246774', motor: '654920W0167180', norma: 'EURO V', aplicacion: 'CARRETERA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 15000, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 132338, ultimoMant: { km: 132000, fecha: '24/10/25', tipo: 'SM2' }, proxMant: { kmFaltante: 14662, kmTarget: 147000, fechaProg: '02/07/26', tipo: 'SM2' }, estado: 'NORMAL' },
    { id: 9, numeroInterno: '9', patente: 'PRYL49', marca: 'HYUNDAI', modelo: 'NEW H1', ano: 2024, chasis: 'KMJWA37KAMU184677', motor: 'D4CBL184633', norma: 'EURO V', aplicacion: 'CARRETERA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 10000, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 153639, ultimoMant: { km: 144974, fecha: '12/07/25', tipo: 'MH1' }, proxMant: { kmFaltante: 1335, kmTarget: 154974, fechaProg: '17/05/26', tipo: 'MH1' }, estado: 'NORMAL' },
    { id: 10, numeroInterno: '10', patente: 'CKHB56', marca: 'HYUNDAI', modelo: 'NEW H1', ano: 2020, chasis: 'KMJWA37HAAU222378', motor: 'D4BH9074521', norma: 'EURO V', aplicacion: 'CARRETERA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 10000, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 454911, ultimoMant: { km: 454650, fecha: '08/09/25', tipo: 'MH1' }, proxMant: { kmFaltante: 9739, kmTarget: 464650, fechaProg: '29/10/26', tipo: 'MH1' }, estado: 'NORMAL' },
    { id: 11, numeroInterno: '11', patente: 'LYRK58', marca: 'M. BENZ', modelo: 'SPRINTER VS30.1', ano: 2021, chasis: 'WDB907645LP119882', motor: '65195835110039', norma: 'EURO V', aplicacion: 'CARRETERA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 15000, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 401177, ultimoMant: { km: 390100, fecha: '11/08/25', tipo: 'SM1' }, proxMant: { kmFaltante: 3923, kmTarget: 405100, fechaProg: '11/09/26', tipo: 'SM1' }, estado: 'NORMAL' },
    { id: 12, numeroInterno: '12', patente: 'TLRV62', marca: 'TOYOTA', modelo: 'HILUX', ano: 2022, chasis: '8AJDB3CD2R1358430', motor: '2GDG490477', norma: 'EURO V', aplicacion: 'URBANA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 10000, tipoIntervalo: 'Horas', factorConversionHoras: 25, kmActual: 32397, ultimoMant: { km: 24000, fecha: '05/08/25', tipo: 'MTH' }, proxMant: { kmFaltante: 1603, kmTarget: 34000, fechaProg: '22/05/26', tipo: 'MTH' }, estado: 'NORMAL' },
    { id: 13, numeroInterno: '13', patente: 'JHRF63', marca: 'M. BENZ', modelo: 'SPRINTER NCV3', ano: 2023, chasis: 'WDB906635HP332316', motor: '6519553760684', norma: 'EURO V', aplicacion: 'CARRETERA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 15000, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 495150, ultimoMant: { km: 480100, fecha: '04/07/25', tipo: 'SM1' }, proxMant: { kmFaltante: -50, kmTarget: 495100, fechaProg: '19/06/26', tipo: 'SM1', kmVencido: 50, vencidosStr: 'SM1' }, estado: 'VENCIDO' },
    { id: 14, numeroInterno: '14', patente: 'TTJJ65', marca: 'M. BENZ', modelo: 'SPRINTER VS30.1', ano: 2024, chasis: '8AC907645SE248461', motor: '654920W0169135', norma: 'EURO V', aplicacion: 'CARRETERA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 15000, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 97135, ultimoMant: { km: 90107, fecha: '03/10/25', tipo: 'SM3' }, proxMant: { kmFaltante: 7972, kmTarget: 105107, fechaProg: '08/06/26', tipo: 'SM3' }, estado: 'NORMAL' },
    { id: 15, numeroInterno: '15', patente: 'RWVS65', marca: 'MAXUS', modelo: 'T60', ano: 2020, chasis: 'LSFAM11A2NA046641', motor: 'M921B095721', norma: 'EURO V', aplicacion: 'URBANA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 15000, tipoIntervalo: 'Horas', factorConversionHoras: 25, kmActual: 75522, ultimoMant: { km: 75109, fecha: '08/10/25', tipo: 'SM4' }, proxMant: { kmFaltante: 14587, kmTarget: 90109, fechaProg: '16/05/26', tipo: 'SM4' }, estado: 'NORMAL' },
    { id: 16, numeroInterno: '16', patente: 'VBWH79', marca: 'DODGE', modelo: 'RAM 700', ano: 2021, chasis: '9BD281F68TYG73955', motor: '552820599193500', norma: 'EURO V', aplicacion: 'URBANA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 10000, tipoIntervalo: 'Horas', factorConversionHoras: 25, kmActual: 5522, ultimoMant: { km: 1, fecha: '31/03/25', tipo: 'MDR' }, proxMant: { kmFaltante: 4479, kmTarget: 10001, fechaProg: '03/07/26', tipo: 'MDR' }, estado: 'NORMAL' },
    { id: 17, numeroInterno: '17', patente: 'JBHF86', marca: 'HYUNDAI', modelo: 'NEW H1', ano: 2022, chasis: 'KMJWA37KAHU837085', motor: 'D4CBG013845', norma: 'EURO V', aplicacion: 'CARRETERA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 10000, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 298305, ultimoMant: { km: 296773, fecha: '09/09/25', tipo: 'MH1' }, proxMant: { kmFaltante: 8468, kmTarget: 306773, fechaProg: '10/08/26', tipo: 'MH1' }, estado: 'NORMAL' },
    { id: 18, numeroInterno: '18', patente: 'KRTC90', marca: 'HYUNDAI', modelo: 'H 350 SOLATI', ano: 2023, chasis: 'KMFAB27RPJK013672', motor: 'D4CBJ464840', norma: 'EURO V', aplicacion: 'CARRETERA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 15000, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 428454, ultimoMant: { km: 427619, fecha: '13/10/25', tipo: 'MH350' }, proxMant: { kmFaltante: 14165, kmTarget: 442619, fechaProg: '23/06/26', tipo: 'MH350' }, estado: 'NORMAL' },
    { id: 19, numeroInterno: '19', patente: 'SZLB99', marca: 'HYUNDAI', modelo: 'NEW H1', ano: 2024, chasis: 'KMJWA37HAKU057677', motor: 'D4BHJ022761', norma: 'EURO V', aplicacion: 'CARRETERA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 10000, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 55109, ultimoMant: { km: 54812, fecha: '22/10/25', tipo: 'MH1' }, proxMant: { kmFaltante: 9703, kmTarget: 64812, fechaProg: '08/07/27', tipo: 'MH1' }, estado: 'NORMAL' },
    { id: 20, numeroInterno: '20', patente: 'VPWC18', marca: 'M. BENZ', modelo: 'SPRINTER VS30.2', ano: 2020, chasis: '8AC907645TE272580', motor: '654920W0193523', norma: 'EURO V', aplicacion: 'CARRETERA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 10000, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 0, ultimoMant: { km: 0, fecha: '09/10/25', tipo: 'SM4' }, proxMant: { kmFaltante: 10000, kmTarget: 10000, fechaProg: '18/06/26', tipo: 'SM4' }, estado: 'NORMAL' },
    { id: 21, numeroInterno: '21', patente: 'VSBL78', marca: 'M. BENZ', modelo: 'SPRINTER VS30.2', ano: 2021, chasis: '8AC907645TE272512', motor: '654920W0193125', norma: 'EURO V', aplicacion: 'CARRETERA', tipoAceite: 'SINTÉTICO', intervaloMantenimiento: 10000, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 0, ultimoMant: { km: 0, fecha: '09/10/25', tipo: 'SM4' }, proxMant: { kmFaltante: 10000, kmTarget: 10000, fechaProg: '01/06/26', tipo: 'SM4' }, estado: 'NORMAL' },
    { id: 22, numeroInterno: '22', patente: 'VVGT88', marca: 'Genérica', modelo: 'Modelo 22', ano: 2022, chasis: '2V3W4X', motor: '22.0', norma: 'EURO VI', aplicacion: 'Mina', tipoAceite: '5W30', intervaloMantenimiento: 10000, tipoIntervalo: 'Horas', factorConversionHoras: 30, kmActual: 11033, ultimoMant: { km: 11000, fecha: '07/05/26', tipo: 'MTH' }, proxMant: { kmFaltante: 8967, kmTarget: 21000, fechaProg: '14/07/26', tipo: 'MTH' }, estado: 'NORMAL' }
  ]);

  const [kpiModal, setKpiModal] = useState<string | null>(null);

  const vehiculosFiltrados = dataFlota.filter(v => {
    if (busqueda && !v.patente.toLowerCase().includes(busqueda.toLowerCase()) && !v.numeroInterno.toLowerCase().includes(busqueda.toLowerCase()) && !v.modelo.toLowerCase().includes(busqueda.toLowerCase())) {
      return false;
    }
    if (filtroModelo && v.modelo !== filtroModelo) return false;
    if (filtroTipoMant && filtroTipoMant !== 'Todos los tipos' && !v.proxMant.tipo.includes(filtroTipoMant)) return false;
    if (soloProximosOVencidos && v.estado === 'NORMAL') return false;
    
    if (filtroProxMantDesde && v.proxMant.fechaProg < filtroProxMantDesde) return false;
    if (filtroProxMantHasta && v.proxMant.fechaProg > filtroProxMantHasta) return false;
    
    if (filtroUltMantDesde && v.ultimoMant.fecha < filtroUltMantDesde) return false;
    if (filtroUltMantHasta && v.ultimoMant.fecha > filtroUltMantHasta) return false;

    return true;
  });

  const kpis = {
    vehiculosFiltrados: vehiculosFiltrados.length,
    porcentajeFlota: Math.round((vehiculosFiltrados.length / (dataFlota.length || 1)) * 100),
    nivelCumplimiento: 85.5,
    costoTotal: 12500000,
    costoKm: 14.5
  };

  const handleArchive = (id: number) => {
    setDataFlota(dataFlota.filter(v => v.id !== id));
    setActionMenuOpen(null);
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
              const fKmActual = vehiculo.ultimoMant.fecha; 
              let cumplimientoText = 'Normal';
              let cumplimientoColor = 'text-slate-700 dark:text-slate-300';
              if (vehiculo.estado === 'VENCIDO') { cumplimientoText = 'Retrasado'; cumplimientoColor = 'text-red-600 font-bold'; }
              if (vehiculo.estado === 'PROXIMO') { cumplimientoText = 'Anticipado'; cumplimientoColor = 'text-emerald-600 font-bold'; }
              if (vehiculo.estado === 'NORMAL') { cumplimientoText = 'Normal'; cumplimientoColor = 'text-slate-700 dark:text-slate-300 font-bold'; }

              return (
                <tr 
                  key={`dense-${vehiculo.id}`} 
                  onClick={() => setSelectedVehicleRow(vehiculo.id)}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${selectedVehicleRow === vehiculo.id ? 'bg-blue-50 dark:bg-slate-800/50' : ''}`}
                >
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 font-bold text-blue-900 dark:text-blue-100 whitespace-nowrap">{vehiculo.numeroInterno}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-500 whitespace-nowrap">{vehiculo.patente}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800">{vehiculo.ultimoMant.km.toLocaleString('es-CL')}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-500 whitespace-nowrap">{vehiculo.ultimoMant.fecha}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 font-medium whitespace-nowrap">{vehiculo.ultimoMant.tipo}</td>
                  <td className={`px-2 py-2 border-r border-slate-200 dark:border-slate-800 ${cumplimientoColor}`}>{cumplimientoText}</td>
                  <td className="px-1 py-1 border-r border-slate-200 dark:border-slate-800">
                    <div className="flex justify-center w-full transform scale-90">
                      {getStatusBadge(vehiculo.estado)}
                    </div>
                  </td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-500">{vehiculo.proxMant.kmVencido ? vehiculo.proxMant.kmVencido.toLocaleString('es-CL') : '--'}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-500 whitespace-nowrap">{vehiculo.proxMant.vencidosStr || '--'}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800">
                    <div>{vehiculo.kmActual.toLocaleString('es-CL')}</div>
                    {vehiculo.tipoIntervalo === 'Horas' && vehiculo.factorConversionHoras && (
                      <div className="text-[10px] text-slate-500 mt-0.5" title="Horas Trabajadas Estimadas">
                        {Math.round(vehiculo.kmActual / vehiculo.factorConversionHoras).toLocaleString('es-CL')} Hrs
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-500 whitespace-nowrap">{fKmActual}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800">
                    <div>{vehiculo.proxMant.kmTarget.toLocaleString('es-CL')}</div>
                    {vehiculo.tipoIntervalo === 'Horas' && vehiculo.factorConversionHoras && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {Math.round(vehiculo.proxMant.kmTarget / vehiculo.factorConversionHoras).toLocaleString('es-CL')} Hrs
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 font-medium whitespace-nowrap">{vehiculo.proxMant.tipo}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800">
                    <div className="flex justify-center">
                      {getStatusIcon(vehiculo.estado)}
                    </div>
                  </td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-500 whitespace-nowrap">{vehiculo.proxMant.fechaProg}</td>
                  <td className="px-2 py-2 relative text-right">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setActionMenuOpen(actionMenuOpen === vehiculo.id ? null : vehiculo.id)}>
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
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center">
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

  const mockOTs = (vehiculo: any) => [
      { id: 'ot1', folio: 'OT-0245', tipo: 'Preventiva', prioridad: 'Media', estado: 'Finalizada', fechaCreacion: '30/04/2026', fechaCierre: '06/05/2026', costo: 401503.37 },
      { id: 'ot2', folio: 'OT-0232', tipo: 'Correctiva', prioridad: 'Media', estado: 'Finalizada', fechaCreacion: '06/04/2026', fechaCierre: '13/04/2026', costo: 751253.0 },
      { id: 'ot3', folio: 'OT-0205', tipo: 'Preventiva', prioridad: 'Media', estado: 'Finalizada', fechaCreacion: '23/02/2026', fechaCierre: '--', costo: 586121.52 },
      { id: 'ot4', folio: 'OT-0186', tipo: 'Correctiva', prioridad: 'Media', estado: 'Finalizada', fechaCreacion: '16/01/2026', fechaCierre: '--', costo: 241000.0 },
      { id: 'ot5', folio: 'OT-0183', tipo: 'Correctiva', prioridad: 'Alta', estado: 'Finalizada', fechaCreacion: '13/01/2026', fechaCierre: '--', costo: 332771.0 },
      { id: 'ot6', folio: 'OT-0165', tipo: 'Preventiva', prioridad: 'Media', estado: 'Finalizada', fechaCreacion: '24/12/2025', fechaCierre: '--', costo: 717895.32 },
      { id: 'ot8', folio: 'OT-0158', tipo: 'Preventiva', prioridad: 'Media', estado: 'Finalizada', fechaCreacion: '20/10/2025', fechaCierre: '--', costo: 220000.0 },
      { id: 'ot9', folio: 'OT-0156', tipo: 'Evaluativa', prioridad: 'Media', estado: 'Finalizada', fechaCreacion: '03/09/2025', fechaCierre: '--', costo: 220000.0 },
      { id: 'ot10', folio: 'OT-0155', tipo: 'Correctiva', prioridad: 'Media', estado: 'Finalizada', fechaCreacion: '22/07/2025', fechaCierre: '--', costo: 154000.0 },
  ];

  if (historialVehiculo) {
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
                    {mockOTs(historialVehiculo).map(ot => (
                      <tr key={ot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors h-16">
                        <td className="px-6 whitespace-nowrap font-medium text-slate-800 dark:text-slate-300">{ot.folio}</td>
                        <td className="px-6 whitespace-nowrap text-slate-600 dark:text-slate-400">{ot.tipo}</td>
                        <td className="px-6 whitespace-nowrap text-slate-600 dark:text-slate-400">{ot.prioridad}</td>
                        <td className="px-6 whitespace-nowrap justify-center p-0 align-middle">
                          <div className="flex justify-center items-center h-full w-full">
                            <span className="inline-flex items-center px-4 py-1 rounded-full text-[11px] font-bold bg-[#10b981] text-white shadow-sm">
                              {ot.estado}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 whitespace-nowrap text-slate-600 dark:text-slate-400">{ot.fechaCreacion}</td>
                        <td className="px-6 whitespace-nowrap text-slate-600 dark:text-slate-400">{ot.fechaCierre}</td>
                        <td className="px-6 whitespace-nowrap text-slate-600 dark:text-slate-400">
                          ${ot.costo.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  onClick={() => setSelectedVehicleRow(vehiculo.id)}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer ${selectedVehicleRow === vehiculo.id ? 'bg-blue-50 dark:bg-slate-800/50' : 'dark:bg-slate-900/50'}`}
                >
                  <td className="px-5 py-4 text-center">
                    <input 
                      type="radio" 
                      name="selectedVehicle"
                      className="w-4 h-4 text-blue-600 rounded-full focus:ring-blue-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                      checked={selectedVehicleRow === vehiculo.id}
                      onChange={() => setSelectedVehicleRow(vehiculo.id)}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      {getStatusIcon(vehiculo.estado)}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{vehiculo.numeroInterno}</span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{vehiculo.patente}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 transition-colors uppercase mt-0.5">{vehiculo.marca} {vehiculo.modelo}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="font-mono text-slate-900 dark:text-slate-100 font-semibold bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded inline-block w-fit">
                        {vehiculo.kmActual.toLocaleString('es-CL')} km
                      </div>
                      {vehiculo.tipoIntervalo === 'Horas' && vehiculo.factorConversionHoras && (
                        <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.round(vehiculo.kmActual / vehiculo.factorConversionHoras).toLocaleString('es-CL')} Hrs.
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-medium">
                        <CheckCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
                        {vehiculo.ultimoMant.km.toLocaleString('es-CL')} km
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {vehiculo.ultimoMant.fecha}
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded w-fit uppercase">
                        {vehiculo.ultimoMant.tipo}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                        <Activity className="w-3.5 h-3.5" />
                        Próx. Mant.: {vehiculo.proxMant.kmTarget.toLocaleString('es-CL')} km
                      </div>
                      <div className="text-xs font-medium text-slate-500">
                        (Faltan: {vehiculo.proxMant.kmFaltante.toLocaleString('es-CL')} km)
                      </div>
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Fecha Próx.: {vehiculo.proxMant.fechaProg}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-900/30 border dark:border-slate-800 border-b dark:border-slate-800lue-200 px-1.5 py-0.5 rounded w-fit uppercase">
                          Tipo: {vehiculo.proxMant.tipo}
                        </span>
                        {vehiculo.proxMant.vencidosStr && (
                          <span className="text-[9px] font-bold text-red-600 bg-red-50 dark:bg-red-900/30 border dark:border-slate-800 border-red-200 px-1 rounded uppercase animate-pulse">
                            Venc: {vehiculo.proxMant.vencidosStr}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {getStatusBadge(vehiculo.estado)}
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
                        className="absolute right-8 top-10 w-56 bg-white dark:bg-slate-900 rounded-md shadow-lg border border-slate-200 dark:border-slate-800 z-50 overflow-hidden"
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
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center">
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
                          <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center">
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
          <p className="text-sm text-slate-600 dark:text-slate-400">Este KPI mide la proporción de vehículos que se encuentran al día con sus pautas de mantenimiento respecto al total de la flota activa.</p>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Vehículos al día (NORMAL)</span>
              <span className="font-bold text-emerald-600">{dataFlota.filter(v => v.estado === 'NORMAL').length}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Vehículos con mantenimiento próximo o vencido</span>
              <span className="font-bold text-red-600">{dataFlota.filter(v => v.estado !== 'NORMAL').length}</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 my-2 pt-2 flex justify-between items-center">
              <span className="font-bold">Total Flota Visualizada</span>
              <span className="font-bold">{vehiculosFiltrados.length}</span>
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
              <span className="font-bold text-slate-700 dark:text-slate-300">$8.500.000</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Mantenimiento Correctivo</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">$4.000.000</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 my-2 pt-2 flex justify-between items-center">
              <span className="font-bold">Total Acumulado</span>
              <span className="font-bold text-orange-600">$12.500.000</span>
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
              <span className="font-bold text-slate-700 dark:text-slate-300">$12.500.000</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">KM Acumulados</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">862.068 km</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 my-2 pt-2 flex justify-between items-center">
              <span className="font-bold">Costo Promedio</span>
              <span className="font-bold text-purple-600">$14.5 / km</span>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Marca / Modelo</span>
                <span className="font-bold">{fichaTecnicaVehiculo.marca} {fichaTecnicaVehiculo.modelo}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Año de Fabricación</span>
                <span className="font-bold">{fichaTecnicaVehiculo.ano || '--'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Patente (PPU)</span>
                <span className="font-bold">{fichaTecnicaVehiculo.patente}</span>
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
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo de Aceite</span>
                <span className="font-bold">{fichaTecnicaVehiculo.tipoAceite || '--'}</span>
              </div>
            </div>

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
    </div>
  );
}
