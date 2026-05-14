import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  Search, Filter, Plus, FileSpreadsheet, AlertTriangle, 
  CheckCircle, Clock, Truck, ChevronRight, Activity, Wrench,
  MoreVertical, Edit3, History, TrendingUp, Archive, Trash2,
  Table as TableIcon, List
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
    { id: 1, numeroInterno: '1', patente: 'SXDR14', marca: 'Genérica', modelo: 'Modelo 1', ano: 2021, chasis: '1A2B3C', motor: '1.0', norma: 'EURO V', aplicacion: 'Mina', tipoAceite: '15W40', intervaloMantenimiento: 14676, tipoIntervalo: 'Horas', factorConversionHoras: 25, kmActual: 197700, ultimoMant: { km: 195324, fecha: '06/05/26', tipo: 'SM1' }, proxMant: { kmFaltante: 12300, kmTarget: 210000, fechaProg: '24/06/26', tipo: 'SM1' }, estado: 'NORMAL' },
    { id: 2, numeroInterno: '2', patente: 'JPHK19', marca: 'Genérica', modelo: 'Modelo 2', ano: 2022, chasis: '2B3C4D', motor: '2.0', norma: 'EURO VI', aplicacion: 'Mina', tipoAceite: '5W30', intervaloMantenimiento: 11974, tipoIntervalo: 'Horas', factorConversionHoras: 30, kmActual: 222979, ultimoMant: { km: 218026, fecha: '02/02/26', tipo: 'MH1' }, proxMant: { kmFaltante: 7021, kmTarget: 230000, fechaProg: '04/10/26', tipo: 'MH1' }, estado: 'NORMAL' },
    { id: 3, numeroInterno: '3', patente: 'RCKY25', marca: 'Genérica', modelo: 'Modelo 3', ano: 2023, chasis: '3C4D5E', motor: '3.0', norma: 'EURO V', aplicacion: 'Mina', tipoAceite: '15W40', intervaloMantenimiento: 9215, tipoIntervalo: 'Horas', factorConversionHoras: 35, kmActual: 176312, ultimoMant: { km: 170785, fecha: '14/04/26', tipo: 'SM1' }, proxMant: { kmFaltante: 3688, kmTarget: 180000, fechaProg: '03/06/26', tipo: 'SM3' }, estado: 'NORMAL' },
    { id: 4, numeroInterno: '4', patente: 'SVJC32', marca: 'Genérica', modelo: 'Modelo 4', ano: 2024, chasis: '4D5E6F', motor: '4.0', norma: 'EURO VI', aplicacion: 'Mina', tipoAceite: '5W30', intervaloMantenimiento: 9975, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 155078, ultimoMant: { km: 150025, fecha: '02/04/26', tipo: 'SM4' }, proxMant: { kmFaltante: 4922, kmTarget: 160000, fechaProg: '03/06/26', tipo: 'SM1' }, estado: 'NORMAL' },
    { id: 5, numeroInterno: '5', patente: 'KHLW39', marca: 'Genérica', modelo: 'Modelo 5', ano: 2020, chasis: '5E6F7G', motor: '5.0', norma: 'EURO V', aplicacion: 'Mina', tipoAceite: '15W40', intervaloMantenimiento: 14799, tipoIntervalo: 'Horas', factorConversionHoras: 25, kmActual: 473771, ultimoMant: { km: 465201, fecha: '01/04/26', tipo: 'SM2' }, proxMant: { kmFaltante: 6229, kmTarget: 480000, fechaProg: '14/06/26', tipo: 'SM2' }, estado: 'NORMAL' },
    { id: 6, numeroInterno: '6', patente: 'TDJD43', marca: 'Genérica', modelo: 'Modelo 6', ano: 2021, chasis: '6F7G8H', motor: '6.0', norma: 'EURO VI', aplicacion: 'Mina', tipoAceite: '5W30', intervaloMantenimiento: 14151, tipoIntervalo: 'Horas', factorConversionHoras: 30, kmActual: 219563, ultimoMant: { km: 210849, fecha: '17/04/26', tipo: 'SM1' }, proxMant: { kmFaltante: 5437, kmTarget: 225000, fechaProg: '31/05/26', tipo: 'SM4' }, estado: 'NORMAL' },
    { id: 7, numeroInterno: '7', patente: 'SBWF44', marca: 'Genérica', modelo: 'Modelo 7', ano: 2022, chasis: '7G8H9I', motor: '7.0', norma: 'EURO V', aplicacion: 'Mina', tipoAceite: '15W40', intervaloMantenimiento: 13730, tipoIntervalo: 'Horas', factorConversionHoras: 35, kmActual: 297740, ultimoMant: { km: 286270, fecha: '24/02/26', tipo: 'SM1' }, proxMant: { kmFaltante: 2260, kmTarget: 300000, fechaProg: '18/05/26', tipo: 'SM1' }, estado: 'PROXIMO' },
    { id: 8, numeroInterno: '8', patente: 'TCLR44', marca: 'Genérica', modelo: 'Modelo 8', ano: 2023, chasis: '8H9I0J', motor: '8.0', norma: 'EURO VI', aplicacion: 'Mina', tipoAceite: '5W30', intervaloMantenimiento: 14968, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 180620, ultimoMant: { km: 180032, fecha: '12/05/26', tipo: 'SM3' }, proxMant: { kmFaltante: 14380, kmTarget: 195000, fechaProg: '02/07/26', tipo: 'SM1' }, estado: 'NORMAL' },
    { id: 9, numeroInterno: '9', patente: 'PRYL49', marca: 'Genérica', modelo: 'Modelo 9', ano: 2024, chasis: '9I0J1K', motor: '9.0', norma: 'EURO V', aplicacion: 'Mina', tipoAceite: '15W40', intervaloMantenimiento: 10531, tipoIntervalo: 'Horas', factorConversionHoras: 25, kmActual: 189307, ultimoMant: { km: 179469, fecha: '25/03/26', tipo: 'MNH1' }, proxMant: { kmFaltante: 693, kmTarget: 190000, fechaProg: '17/05/26', tipo: 'MH1' }, estado: 'PROXIMO' },
    { id: 10, numeroInterno: '10', patente: 'CKHB56', marca: 'Genérica', modelo: 'Modelo 10', ano: 2020, chasis: '0J1K2L', motor: '10.0', norma: 'EURO VI', aplicacion: 'Mina', tipoAceite: '5W30', intervaloMantenimiento: 5350, tipoIntervalo: 'Horas', factorConversionHoras: 30, kmActual: 457836, ultimoMant: { km: 454650, fecha: '08/09/25', tipo: 'MH1' }, proxMant: { kmFaltante: 2164, kmTarget: 460000, fechaProg: '29/10/26', tipo: 'MH1' }, estado: 'NORMAL' },
    { id: 11, numeroInterno: '11', patente: 'LYRK58', marca: 'Genérica', modelo: 'Modelo 11', ano: 2021, chasis: '1K2L3M', motor: '11.0', norma: 'EURO V', aplicacion: 'Mina', tipoAceite: '15W40', intervaloMantenimiento: 14968, tipoIntervalo: 'Horas', factorConversionHoras: 35, kmActual: 450626, ultimoMant: { km: 450032, fecha: '11/05/26', tipo: 'SM3' }, proxMant: { kmFaltante: 14374, kmTarget: 465000, fechaProg: '11/09/26', tipo: 'SM1' }, estado: 'NORMAL' },
    { id: 12, numeroInterno: '12', patente: 'TLRV62', marca: 'Genérica', modelo: 'Modelo 12', ano: 2022, chasis: '2L3M4N', motor: '12.0', norma: 'EURO VI', aplicacion: 'Mina', tipoAceite: '5W30', intervaloMantenimiento: 4611, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 45389, ultimoMant: { km: 45389, fecha: '27/02/26', tipo: 'MTH' }, proxMant: { kmFaltante: 4611, kmTarget: 50000, fechaProg: '22/05/26', tipo: 'MTH' }, estado: 'NORMAL' },
    { id: 13, numeroInterno: '13', patente: 'JHRF63', marca: 'Genérica', modelo: 'Modelo 13', ano: 2023, chasis: '3M4N5O', motor: '13.0', norma: 'EURO V', aplicacion: 'Mina', tipoAceite: '15W40', intervaloMantenimiento: 15625, tipoIntervalo: 'Horas', factorConversionHoras: 25, kmActual: 533582, ultimoMant: { km: 524375, fecha: '24/03/26', tipo: 'SM3' }, proxMant: { kmFaltante: 6418, kmTarget: 540000, fechaProg: '19/06/26', tipo: 'SM3' }, estado: 'NORMAL' },
    { id: 14, numeroInterno: '14', patente: 'TTJJ65', marca: 'Genérica', modelo: 'Modelo 14', ano: 2024, chasis: '4N5O6P', motor: '14.0', norma: 'EURO VI', aplicacion: 'Mina', tipoAceite: '5W30', intervaloMantenimiento: 10000, tipoIntervalo: 'Horas', factorConversionHoras: 30, kmActual: 135536, ultimoMant: { km: 130000, fecha: '13/04/26', tipo: 'SM1' }, proxMant: { kmFaltante: 4464, kmTarget: 140000, fechaProg: '08/06/26', tipo: 'SM1' }, estado: 'NORMAL' },
    { id: 15, numeroInterno: '15', patente: 'RWVS65', marca: 'Genérica', modelo: 'Modelo 15', ano: 2020, chasis: '5O6P7Q', motor: '15.0', norma: 'EURO V', aplicacion: 'Mina', tipoAceite: '15W40', intervaloMantenimiento: 14891, tipoIntervalo: 'Horas', factorConversionHoras: 35, kmActual: 82848, ultimoMant: { km: 75109, fecha: '08/10/25', tipo: 'N/A' }, proxMant: { kmFaltante: 7152, kmTarget: 90000, fechaProg: '16/05/26', tipo: 'SM5' }, estado: 'NORMAL' },
    { id: 16, numeroInterno: '16', patente: 'VBWH79', marca: 'Genérica', modelo: 'Modelo 16', ano: 2021, chasis: '6P7Q8R', motor: '16.0', norma: 'EURO VI', aplicacion: 'Mina', tipoAceite: '5W30', intervaloMantenimiento: 9864, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 13034, ultimoMant: { km: 10136, fecha: '17/02/26', tipo: 'MDR' }, proxMant: { kmFaltante: 6966, kmTarget: 20000, fechaProg: '03/07/26', tipo: 'MDR' }, estado: 'NORMAL' },
    { id: 17, numeroInterno: '17', patente: 'JBHF86', marca: 'Genérica', modelo: 'Modelo 17', ano: 2022, chasis: '7Q8R9S', motor: '17.0', norma: 'EURO V', aplicacion: 'Mina', tipoAceite: '15W40', intervaloMantenimiento: 13227, tipoIntervalo: 'Horas', factorConversionHoras: 25, kmActual: 306534, ultimoMant: { km: 296773, fecha: '09/09/25', tipo: 'MH1' }, proxMant: { kmFaltante: 3466, kmTarget: 310000, fechaProg: '10/08/26', tipo: 'MH1' }, estado: 'NORMAL' },
    { id: 18, numeroInterno: '18', patente: 'KRTC90', marca: 'Genérica', modelo: 'Modelo 18', ano: 2023, chasis: '8R9S0T', motor: '18.0', norma: 'EURO VI', aplicacion: 'Mina', tipoAceite: '5W30', intervaloMantenimiento: 14220, tipoIntervalo: 'Horas', factorConversionHoras: 30, kmActual: 456542, ultimoMant: { km: 450780, fecha: '17/04/26', tipo: 'MH350' }, proxMant: { kmFaltante: 8458, kmTarget: 465000, fechaProg: '23/06/26', tipo: 'MH350' }, estado: 'NORMAL' },
    { id: 19, numeroInterno: '19', patente: 'SZLB99', marca: 'Genérica', modelo: 'Modelo 19', ano: 2024, chasis: '9S0T1U', motor: '19.0', norma: 'EURO V', aplicacion: 'Mina', tipoAceite: '15W40', intervaloMantenimiento: 4892, tipoIntervalo: 'Horas', factorConversionHoras: 35, kmActual: 65444, ultimoMant: { km: 65108, fecha: '13/04/26', tipo: 'MH1' }, proxMant: { kmFaltante: 4556, kmTarget: 70000, fechaProg: '08/07/27', tipo: 'MH1' }, estado: 'NORMAL' },
    { id: 20, numeroInterno: '20', patente: 'VPWC18', marca: 'Genérica', modelo: 'Modelo 20', ano: 2020, chasis: '0T1U2V', motor: '20.0', norma: 'EURO VI', aplicacion: 'Mina', tipoAceite: '5W30', intervaloMantenimiento: 14761, tipoIntervalo: 'Horas', factorConversionHoras: 40, kmActual: 25177, ultimoMant: { km: 15239, fecha: '02/03/26', tipo: 'SM1' }, proxMant: { kmFaltante: 4823, kmTarget: 300000, fechaProg: '18/06/26', tipo: 'SM1' }, estado: 'NORMAL' },
    { id: 21, numeroInterno: '21', patente: 'VSBL78', marca: 'Genérica', modelo: 'Modelo 21', ano: 2021, chasis: '1U2V3W', motor: '21.0', norma: 'EURO V', aplicacion: 'Mina', tipoAceite: '15W40', intervaloMantenimiento: 18894, tipoIntervalo: 'Horas', factorConversionHoras: 25, kmActual: 32871, ultimoMant: { km: 21106, fecha: '14/04/26', tipo: 'SM1' }, proxMant: { kmFaltante: 7129, kmTarget: 40000, fechaProg: '01/06/26', tipo: 'SM1' }, estado: 'NORMAL' },
    { id: 22, numeroInterno: '22', patente: 'VVGT88', marca: 'Genérica', modelo: 'Modelo 22', ano: 2022, chasis: '2V3W4X', motor: '22.0', norma: 'EURO VI', aplicacion: 'Mina', tipoAceite: '5W30', intervaloMantenimiento: 10000, tipoIntervalo: 'Horas', factorConversionHoras: 30, kmActual: 11033, ultimoMant: { km: 11000, fecha: '07/05/26', tipo: 'MTH' }, proxMant: { kmFaltante: 8967, kmTarget: 10000, fechaProg: '14/07/26', tipo: 'MTH' }, estado: 'NORMAL' }
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
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center">
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
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center">
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
