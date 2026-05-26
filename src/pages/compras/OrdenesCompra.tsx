import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Plus, 
  Search,
  FileText, 
  Clock, 
  Settings,
  AlertCircle,
  MoreVertical,
  Wrench,
  Truck,
  BrainCircuit,
  FileDown,
  History,
  DollarSign,
  ArrowLeft,
  Eye,
  Calendar as CalendarIcon,
  Info,
  PackageCheck,
  MessageSquare,
  List,
  Trash2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';

import { useAppContext } from '../../context/AppContext';

interface PedidoTaller {
  id: string;
  fecha: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  vehiculo: string;
  repuesto: string;
  sugerencia: string;
  cantidad: number;
  motivo: string;
  selected?: boolean;
}

interface OrdenCompra {
  folio: string;
  fecha: string;
  proveedor: string;
  monto: number;
  estado: string;
}

interface HistorialOrden {
  folio: string;
  fecha: string;
  proveedor: string;
  resumen: string;
  estado: string;
  monto: number;
}

interface LineaOC {
  id: number;
  repuesto: string;
  descripcion: string;
  centroCosto: string;
  cantidad: number;
  precioUnitario: number;
}

export default function OrdenesCompra() {
  const navigate = useNavigate();
  const { ordenesTrabajo, vehiculos } = useAppContext();
  const [view, setView] = useState<'panel' | 'historial' | 'detalle'>('panel');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [showNuevaOCModal, setShowNuevaOCModal] = useState(false);
  const [proveedorSeleccionadoTaller, setProveedorSeleccionadoTaller] = useState('KAUFMANN');
  
  const [selectedPedidos, setSelectedPedidos] = useState<string[]>([]);

  const pedidosTaller = React.useMemo(() => {
     let pedidos: PedidoTaller[] = [];
     ordenesTrabajo.forEach(ot => {
         const vehiculo = vehiculos.find(v => v.id === ot.vehiculoId)?.patente || 'Desconocido';
         if (ot.solicitudes) {
             ot.solicitudes.forEach(sol => {
                 if (sol.estado === 'PENDIENTE') {
                     pedidos.push({
                         id: sol.id,
                         fecha: new Date(sol.fecha_solicitud).toLocaleString(),
                         prioridad: ot.prioridad,
                         vehiculo: vehiculo + ' (OT: ' + ot.folio + ')',
                         repuesto: sol.repuesto_nombre,
                         sugerencia: 'Sin sugerencia',
                         cantidad: sol.cantidad,
                         motivo: ot.observacionInicial || ot.diagnosticoEvaluacion || 'Repuesto para OT',
                         selected: selectedPedidos.includes(sol.id)
                     });
                 }
             });
         }
     });
     return pedidos;
  }, [ordenesTrabajo, vehiculos, selectedPedidos]);

  const [ordenesPendientes, setOrdenesPendientes] = useState<OrdenCompra[]>([
    { folio: "#5", fecha: "20/04/2026", proveedor: "KAUFMANN", monto: 0, estado: "PENDIENTE" },
    { folio: "#4", fecha: "20/04/2026", proveedor: "KAUFMANN", monto: 0, estado: "PENDIENTE" }
  ]);

  const [historialOrdenes, setHistorialOrdenes] = useState<HistorialOrden[]>([
    { folio: "#5", fecha: "20/04/2026", proveedor: "KAUFMANN", resumen: "", estado: "PENDIENTE", monto: 0 },
    { folio: "#4", fecha: "20/04/2026", proveedor: "KAUFMANN", resumen: "", estado: "PENDIENTE", monto: 0 },
    { folio: "#3", fecha: "15/04/2026", proveedor: "KAUFMANN", resumen: "", estado: "RECIBIDA", monto: 0 },
    { folio: "#2", fecha: "15/04/2026", proveedor: "KAUFMANN", resumen: "", estado: "RECIBIDA", monto: 0 },
    { folio: "#1", fecha: "15/04/2026", proveedor: "KAUFMANN", resumen: "", estado: "RECIBIDA", monto: 0 },
  ]);

  const [nuevaOCLineas, setNuevaOCLineas] = useState<LineaOC[]>([
    { id: Date.now(), repuesto: '', descripcion: '', centroCosto: '', cantidad: 1, precioUnitario: 0 }
  ]);
  const [nuevaOCProveedor, setNuevaOCProveedor] = useState('');
  const [nuevaOCNotas, setNuevaOCNotas] = useState('');

  const handleAgregarLineaNuevaOC = () => {
    setNuevaOCLineas([...nuevaOCLineas, { id: Date.now(), repuesto: '', descripcion: '', centroCosto: '', cantidad: 1, precioUnitario: 0 }]);
  };

  const handleEliminarLineaNuevaOC = (id: number) => {
    if (nuevaOCLineas.length > 1) {
      setNuevaOCLineas(nuevaOCLineas.filter(l => l.id !== id));
    }
  };

  const handleChangeLineaNuevaOC = (id: number, field: keyof LineaOC, value: any) => {
    setNuevaOCLineas(nuevaOCLineas.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleGuardarNuevaOC = () => {
    if (!nuevaOCProveedor) {
      alert("Por favor, seleccione un proveedor.");
      return;
    }
    const montoTotal = nuevaOCLineas.reduce((acc, l) => acc + (l.cantidad * l.precioUnitario), 0);
    const folioStr = `#${Date.now().toString().slice(-4)}`;
    const nuevoHistorialOC: HistorialOrden = {
      folio: folioStr,
      fecha: new Date().toLocaleDateString('es-CL'),
      proveedor: nuevaOCProveedor,
      resumen: "Compra General",
      estado: "PENDIENTE",
      monto: montoTotal
    };

    setOrdenesPendientes([{ folio: nuevoHistorialOC.folio, fecha: nuevoHistorialOC.fecha, proveedor: nuevoHistorialOC.proveedor, monto: nuevoHistorialOC.monto, estado: nuevoHistorialOC.estado }, ...ordenesPendientes]);
    setHistorialOrdenes([nuevoHistorialOC, ...historialOrdenes]);
    setShowNuevaOCModal(false);
    setNuevaOCLineas([{ id: Date.now(), repuesto: '', descripcion: '', centroCosto: '', cantidad: 1, precioUnitario: 0 }]);
    setNuevaOCProveedor('');
    setNuevaOCNotas('');
    alert(`Órden de compra ${folioStr} generada exitosamente.`);
  };

  const handleGenerarOCTaller = () => {
    const pedidosSeleccionados = pedidosTaller.filter(p => p.selected);
    if (pedidosSeleccionados.length === 0) {
      alert("Por favor, seleccione al menos un pedido de taller para generar la OC.");
      return;
    }
    
    // Simulate generation
    const folioStr = `#${Date.now().toString().slice(-4)}`;
    const nuevoHistorialOC: HistorialOrden = {
      folio: folioStr,
      fecha: new Date().toLocaleDateString('es-CL'),
      proveedor: proveedorSeleccionadoTaller,
      resumen: `OC generada desde ${pedidosSeleccionados.length} pedidos de taller`,
      estado: "PENDIENTE",
      monto: 0
    };

    setOrdenesPendientes([{ folio: nuevoHistorialOC.folio, fecha: nuevoHistorialOC.fecha, proveedor: nuevoHistorialOC.proveedor, monto: nuevoHistorialOC.monto, estado: nuevoHistorialOC.estado }, ...ordenesPendientes]);
    setHistorialOrdenes([nuevoHistorialOC, ...historialOrdenes]);
    setSelectedPedidos([]); // Clear selection instead of filtering out
    alert(`Órden de compra de taller ${folioStr} generada exitosamente. Recuerda ir a la OT para actualizar el estado de las solicitudes.`);
  };

  const togglePedidoTallerSelection = (id: string) => {
    setSelectedPedidos(prev => 
       prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleViewDetail = (folio: string) => {
    setSelectedOrder(folio);
    setView('detalle');
  };

  const handleRecibirMercaderia = () => {
    if (!selectedOrder) return;
    
    // Update state in pending orders
    setOrdenesPendientes(prev => 
      prev.map(oc => oc.folio === selectedOrder ? { ...oc, estado: 'RECIBIDA' } : oc)
    );
    
    // Update state in history
    setHistorialOrdenes(prev => 
      prev.map(oc => oc.folio === selectedOrder ? { ...oc, estado: 'RECIBIDA' } : oc)
    );
    
    alert(`✅ ¡Éxito!\n\nLa mercadería para la Orden ${selectedOrder} ha sido recibida correctamente.\nLos insumos han sido cargados al inventario de la bodega y el stock ha sido actualizado.`);
  };

  if (view === 'detalle') {
    const ordenObj = 
      ordenesPendientes.find(o => o.folio === selectedOrder) || 
      historialOrdenes.find(o => o.folio === selectedOrder);
    
    const isReceived = ordenObj?.estado === 'RECIBIDA';

    const mockItems = [
      { repuesto: "Filtro de Aceite - Hyundai (Original)", cantidad: 2, precioU: 15000, total: 30000 },
      { repuesto: "Correa 8 PK - Alternador", cantidad: 1, precioU: 45000, total: 45000 },
      { repuesto: "Pastillas de Freno - Eje Delantero", cantidad: 1, precioU: 32000, total: 32000 }
    ];
    const totalMonto = mockItems.reduce((acc, curr) => acc + curr.total, 0);

    return (
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Header Detalle */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h1 className="text-[24px] font-black text-slate-800 dark:text-white flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-500" /> Detalle de Orden de Compra {selectedOrder}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-wide mt-1 uppercase">GEStión de compra y recepción de suministros</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setView('historial')}
              className="bg-[#64748b] hover:bg-slate-600 text-white font-bold h-10 px-5 rounded-lg text-sm tracking-wide"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> VOLVER AL PANEL
            </Button>
            <Button 
              onClick={() => window.print()}
              className="bg-[#ef4444] hover:bg-red-600 text-white font-bold h-10 px-5 rounded-lg text-sm tracking-wide"
            >
              <FileDown className="w-4 h-4 mr-2" /> EXPORTAR PDF
            </Button>
          </div>
        </div>

        {/* Información General */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-800">
          <CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 py-4 px-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-wider uppercase">Información General</CardTitle>
            </div>
            {!isReceived ? (
              <Button 
                onClick={handleRecibirMercaderia}
                className="bg-[#10b981] hover:bg-emerald-600 text-white font-bold h-9 px-4 rounded-lg text-xs tracking-wider"
              >
                <PackageCheck className="w-4 h-4 mr-2" /> RECIBIR MERCADERÍA
              </Button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg font-black text-xs">
                <PackageCheck className="w-4 h-4" /> MERCADERÍA RECIBIDA
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              <div className="p-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Proveedor</span>
                <span className="font-black text-blue-600 dark:text-blue-400 text-lg">{ordenObj?.proveedor || "KAUFMANN"}</span>
              </div>
              <div className="p-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fecha Emisión</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 text-lg">{ordenObj?.fecha || "20/04/2026 15:56"}</span>
              </div>
              <div className="p-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Estado Actual</span>
                <span className={`${isReceived ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400'} px-3 py-1 rounded-md text-[10px] font-black tracking-wider inline-flex`}>
                  {ordenObj?.estado || "PENDIENTE"}
                </span>
              </div>
              <div className="p-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Emitida Por</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 text-lg">administrador</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detalle de la compra */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mt-6 bg-white dark:bg-slate-800">
          <CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 py-4 px-6">
            <div className="flex items-center gap-2">
              <List className="w-5 h-5 text-purple-500" />
              <CardTitle className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-wider uppercase">Detalle de la Compra</CardTitle>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Descripción / Repuesto</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cantidad</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Precio Unitario</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Total Línea</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800">
                {mockItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 text-xs">{item.repuesto}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 rounded text-xs font-black">{item.cantidad} UND</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300 text-xs text-right">${item.precioU.toLocaleString('es-CL')}</td>
                    <td className="px-6 py-4 font-black text-slate-800 dark:text-white text-sm text-right">${item.total.toLocaleString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right text-[12px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest border-t border-slate-200 dark:border-slate-700">
                    Inversión Total
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white text-2xl border-t border-slate-200 dark:border-slate-700">
                    ${totalMonto.toLocaleString('es-CL')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Pedidos asociados */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-800">
            <CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 py-4 px-6">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-500" />
                <CardTitle className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-wider uppercase">Pedidos de Taller Asociados</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-slate-50 dark:bg-slate-900">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <h4 className="font-black text-slate-800 dark:text-white text-sm">NONE</h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Solicitado Por: DEMO</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded text-xs font-black">1</span>
                  <span className="text-[10px] font-bold text-slate-400">#OT-0344</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observaciones y Notas */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-800">
            <CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 py-4 px-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-500" />
                <CardTitle className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-wider uppercase">Observaciones y Notas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 italic font-medium">
                O.C. generada automáticamente desde 1 solicitudes de taller.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (view === 'historial') {
    return (
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Header Historial */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h1 className="text-[28px] font-black text-slate-800 dark:text-white flex items-center gap-3">
              <History className="w-8 h-8 text-blue-500" /> Historial de Órdenes
            </h1>
            <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm tracking-wide mt-2 flex items-center gap-2">
              <span className="text-xl">💰</span> Total en Filtro: $ 0
            </p>
          </div>
          <div>
            <Button 
              onClick={() => setView('panel')}
              className="bg-[#1e293b] hover:bg-slate-800 text-white font-bold h-10 px-5 rounded-lg text-sm tracking-wide"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> VOLVER AL PANEL
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden p-6 bg-white dark:bg-slate-800">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Buscador Inteligente</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Folio, Proveedor o Ítem..." 
                  className="w-full h-11 px-4 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Proveedor</label>
              <select className="w-full h-11 px-4 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none focus:border-blue-500">
                <option value="Todos">Todos</option>
              </select>
            </div>
            <div className="w-full md:w-40">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Desde</label>
              <div className="relative">
                <input type="text" placeholder="mm / dd / yyyy" className="w-full h-11 px-4 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none focus:border-blue-500 placeholder:text-slate-400" />
                <CalendarIcon className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
              </div>
            </div>
            <div className="w-full md:w-40">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Hasta</label>
              <div className="relative">
                <input type="text" placeholder="mm / dd / yyyy" className="w-full h-11 px-4 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none focus:border-blue-500 placeholder:text-slate-400" />
                <CalendarIcon className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
              </div>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-800">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center text-sm font-bold text-slate-600 dark:text-slate-400">
            Show 
            <select className="mx-2 h-8 px-2 border border-slate-200 dark:border-slate-700 bg-transparent rounded text-sm outline-none">
              <option value="25">25</option>
            </select>
            entries
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Folio OC</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Fecha Emisión</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Proveedor</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Resumen de Ítems</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Monto Total</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {historialOrdenes.map((orden, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 font-black text-slate-800 dark:text-white text-sm">{orden.folio}</td>
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 text-xs">{orden.fecha}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 text-xs">{orden.proveedor}</td>
                    <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400 text-xs">{orden.resumen}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-md text-[10px] font-black tracking-wider text-white ${orden.estado === 'PENDIENTE' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                        {orden.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white text-sm">${orden.monto}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleViewDetail(orden.folio)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-500 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mostrando 5 órdenes registradas</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" className="h-8 px-3 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">Anterior</Button>
              <Button className="h-8 w-8 p-0 rounded-lg text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white">1</Button>
              <Button variant="outline" className="h-8 px-3 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">Siguiente</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* Header Container */}
      <div className="bg-gradient-to-r from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h1 className="text-[28px] font-black text-slate-800 dark:text-white flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-blue-500" /> Panel de Adquisiciones
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-wide mt-1 uppercase">Gestión central de compras y pedidos de taller</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setView('historial')}
            className="bg-slate-500 hover:bg-slate-600 text-white font-bold h-10 px-5 rounded-lg text-sm tracking-wide"
          >
            <Clock className="w-4 h-4 mr-2" /> HISTORIAL DE GASTOS
          </Button>
          <Button 
            onClick={() => setShowNuevaOCModal(true)}
            className="bg-[#1e293b] hover:bg-slate-800 text-white font-bold h-10 px-5 rounded-lg text-sm tracking-wide"
          >
            <Plus className="w-4 h-4 mr-2" /> NUEVA COMPRA GENERAL
          </Button>
        </div>
      </div>

      {/* SECTION 1: Pedidos pendientes de taller */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-800">
        <CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 py-4 px-6 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-wider uppercase">Pedidos pendientes de taller</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <select 
              className="h-9 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 outline-none w-64 bg-transparent"
              value={proveedorSeleccionadoTaller}
              onChange={(e) => setProveedorSeleccionadoTaller(e.target.value)}
            >
              <option value="">SELECCIONAR PROVEEDOR PARA O.C...</option>
              <option value="KAUFMANN">KAUFMANN</option>
              <option value="SALFA">SALFA</option>
            </select>
            <Button 
              onClick={handleGenerarOCTaller}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-9 px-4 rounded-lg text-xs tracking-wider"
            >
              <Plus className="w-3.5 h-3.5 mr-2" /> GENERAR O.C. DE TALLER
            </Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" onChange={(e) => setPedidosTaller(pedidosTaller.map(p => ({ ...p, selected: e.target.checked })))} /></th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Prioridad</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Vehículo / OT</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Repuesto Solicitado</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Sugerencia</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cant.</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Motivo / Justificación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {pedidosTaller.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-xs font-bold text-slate-500 dark:text-slate-400 italic">No hay pedidos pendientes de taller.</td></tr>
              ) : pedidosTaller.map((pedido, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4"><input type="checkbox" checked={pedido.selected} onChange={() => togglePedidoTallerSelection(pedido.id)} className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" /></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{pedido.fecha.split(' ')[0]}</span>
                      <span className="text-[10px] font-bold text-slate-400">{pedido.fecha.split(' ')[1]} {pedido.fecha.split(' ')[2]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider">
                      {pedido.prioridad}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-500/10 p-1.5 -ml-1.5 rounded-lg transition-colors group"
                      onClick={() => navigate(`/flota/ordenes-trabajo/${pedido.vehiculo.split(' ')[1]}`)}
                    >
                       <span className="font-black text-blue-600 dark:text-blue-400 text-xs group-hover:text-blue-700">{pedido.vehiculo.split(' ')[0]}</span>
                       <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded text-[10px] font-bold group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 group-hover:text-blue-600 dark:group-hover:text-blue-400">{pedido.vehiculo.split(' ')[1]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-bold text-slate-800 dark:text-slate-200 text-xs">{pedido.repuesto}</td>
                  <td className="px-4 py-4 font-bold text-slate-600 dark:text-slate-400 text-xs">{pedido.sugerencia}</td>
                  <td className="px-4 py-4">
                    <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs font-black">x{pedido.cantidad}</span>
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-500 dark:text-slate-400 text-xs italic">{pedido.motivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECTION 2: Órdenes de compra en tránsito / pendientes */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mt-6 bg-white dark:bg-slate-800">
        <CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 py-4 px-6">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-wider uppercase">Órdenes de compra en tránsito / pendientes</CardTitle>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Folio OC</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Proveedor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Monto Estimado</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {ordenesPendientes.map((oc, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-5 font-black text-slate-800 dark:text-white text-sm">{oc.folio}</td>
                  <td className="px-6 py-5 font-bold text-slate-700 dark:text-slate-300 text-xs">{oc.fecha}</td>
                  <td className="px-6 py-5 font-bold text-slate-800 dark:text-slate-200 text-xs">{oc.proveedor}</td>
                  <td className="px-6 py-5 font-black text-slate-800 dark:text-white text-sm">${oc.monto}</td>
                  <td className="px-6 py-5">
                    <span className={`${oc.estado === 'RECIBIDA' ? 'bg-emerald-500' : 'bg-blue-500'} text-white px-3 py-1 rounded-md text-[10px] font-black tracking-wider`}>
                      {oc.estado}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                         onClick={() => handleViewDetail(oc.folio)}
                         className="h-8 px-3 rounded-lg text-[10px] font-black tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-transparent hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                       >
                         GESTIONAR
                       </button>
                       <button 
                         onClick={() => window.print()}
                         className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 transition-colors"
                         title="Exportar PDF"
                       >
                          <FileDown className="w-5 h-5" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECTION 3: Últimas facturas ingresadas */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mt-6 pb-8 bg-white dark:bg-slate-800">
        <CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 py-4 px-6">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-wider uppercase">Últimas facturas ingresadas (Cerebro OCR)</CardTitle>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Nº Factura</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Proveedor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Fecha Emisión</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Monto Total</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Procesado Por</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800">
               <tr>
                 <td colSpan={6} className="px-6 py-8 text-center text-xs font-bold text-slate-500 dark:text-slate-400 italic">
                   No hay facturas procesadas recientemente.
                 </td>
               </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showNuevaOCModal} onClose={() => setShowNuevaOCModal(false)} title="Nueva Orden de Compra General">
        <div className="space-y-6 pt-2">
          <div className="bg-blue-50/50 dark:bg-blue-500/10 p-4 rounded-xl border border-blue-100/50 dark:border-blue-500/20">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Usa este formulario para compras administrativas, insumos de oficina o gastos de taller sin OT.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 dark:text-slate-200">Seleccionar Proveedor</label>
              <select 
                className="w-full h-11 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all bg-white dark:bg-slate-800 shadow-sm"
                value={nuevaOCProveedor}
                onChange={(e) => setNuevaOCProveedor(e.target.value)}
              >
                <option value="">Seleccione un proveedor...</option>
                <option value="KAUFMANN">KAUFMANN</option>
                <option value="SALFA">SALFA</option>
                <option value="LIBRERIA NACIONAL">LIBRERÍA NACIONAL</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 dark:text-slate-200">Notas / Observaciones</label>
              <textarea 
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all shadow-sm bg-transparent placeholder:text-slate-400"
                placeholder="Ej: Insumos mensuales oficina central..."
                rows={1}
                value={nuevaOCNotas}
                onChange={(e) => setNuevaOCNotas(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-blue-500" />
                <span className="font-black text-slate-800 dark:text-white tracking-wide">Ítems de la Compra</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest w-[20%]">Repuesto (Opcional)</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest w-[35%]">Descripción Manual</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest w-[20%]">Centro de Costo</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest w-[10%]">Cant.</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest w-[12%]">Precio Unit.</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest w-[3%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 border-b border-slate-100 dark:border-slate-700">
                  {nuevaOCLineas.map((linea, index) => (
                    <tr key={linea.id} className="bg-white dark:bg-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="p-3 pl-6">
                        <select 
                          className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors bg-white dark:bg-slate-800"
                          value={linea.repuesto}
                          onChange={(e) => handleChangeLineaNuevaOC(linea.id, 'repuesto', e.target.value)}
                        >
                          <option value="">---------</option>
                          <option value="REP-001">Filtro de Aceite</option>
                          <option value="REP-002">Correa 8 PK</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <input 
                          type="text" 
                          placeholder="Si no es repuesto..."
                          className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400 bg-transparent"
                          value={linea.descripcion}
                          onChange={(e) => handleChangeLineaNuevaOC(linea.id, 'descripcion', e.target.value)}
                        />
                      </td>
                      <td className="p-3">
                        <select 
                          className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors bg-white dark:bg-slate-800"
                          value={linea.centroCosto}
                          onChange={(e) => handleChangeLineaNuevaOC(linea.id, 'centroCosto', e.target.value)}
                        >
                          <option value="">---------</option>
                          <option value="Taller">Taller</option>
                          <option value="Administracion">Administración</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <input 
                          type="number" 
                          className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-black text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors text-center bg-transparent"
                          value={linea.cantidad || ''}
                          min={1}
                          onChange={(e) => handleChangeLineaNuevaOC(linea.id, 'cantidad', parseInt(e.target.value))}
                        />
                      </td>
                      <td className="p-3">
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                          <input 
                            type="number" 
                            className="w-full h-10 pl-7 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-black text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors bg-transparent"
                            value={linea.precioUnitario || ''}
                            step="0.01"
                            onChange={(e) => handleChangeLineaNuevaOC(linea.id, 'precioUnitario', parseFloat(e.target.value))}
                          />
                        </div>
                      </td>
                      <td className="p-3 pr-6 text-center">
                        <button 
                          onClick={() => handleEliminarLineaNuevaOC(linea.id)}
                          className="h-8 w-8 flex items-center justify-center rounded border border-transparent text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-100 dark:hover:border-red-500/20 transition-all"
                          title="Eliminar línea"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
              <Button 
                variant="outline" 
                className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/50 h-9 font-bold text-xs rounded-lg shadow-sm transition-all"
                onClick={handleAgregarLineaNuevaOC}
              >
                <Plus className="w-4 h-4 mr-1.5" /> AGREGAR OTRA LÍNEA
              </Button>
              
              <div className="flex items-center gap-4 bg-white dark:bg-slate-800 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Estimado</span>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                   ${nuevaOCLineas.reduce((acc, l) => acc + ((l.cantidad || 0) * (l.precioUnitario || 0)), 0).toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
            <Button 
              variant="outline" 
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white rounded-xl px-6" 
              onClick={() => setShowNuevaOCModal(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl px-6 shadow-sm shadow-blue-500/20 transition-all"
              onClick={handleGuardarNuevaOC}
            >
              Guardar Orden de Compra
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

