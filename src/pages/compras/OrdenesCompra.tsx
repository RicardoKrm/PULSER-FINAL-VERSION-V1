import React, { useState, useEffect } from 'react';
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
import Swal from 'sweetalert2';

import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../lib/supabase';
import OrdenCompraDetalle from './OrdenCompraDetalle';

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
  const { currentCompany } = useCompany();
  const [view, setView] = useState<'panel' | 'historial' | 'detalle'>('panel');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [showNuevaOCModal, setShowNuevaOCModal] = useState(false);
  const [proveedorSeleccionadoTaller, setProveedorSeleccionadoTaller] = useState('');
  
  const [selectedPedidos, setSelectedPedidos] = useState<string[]>([]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<any[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState('');

  useEffect(() => {
    if (currentCompany) {
       fetchDatosBase();
       fetchOrdenes();
    }
  }, [currentCompany]);

  const fetchDatosBase = async () => {
     if (!currentCompany) return;
     const [otsRes, vehRes, provRes] = await Promise.all([
        supabase.from('orden_de_trabajo').select('*, solicitudes:solicitud_repuesto_ot(*)').eq('empresa_id', currentCompany.id),
        supabase.from('vehiculo').select('*').eq('empresa_id', currentCompany.id),
        supabase.from('proveedores_directorio').select('*').eq('empresa_id', currentCompany.id)
     ]);
     if (otsRes.data) setOrdenesTrabajo(otsRes.data);
     if (vehRes.data) setVehiculos(vehRes.data);
     if (provRes.data) setProveedores(provRes.data);
  };

  const fetchOrdenes = async () => {
     if (!currentCompany) return;
     const { data } = await supabase.from('compras_ordenes')
       .select('*, lineas:compras_ordenes_lineas(*)')
       .eq('empresa_id', currentCompany.id)
       .order('fecha_emision', { ascending: false });

     if (data) {
        const parsed = data.map(o => ({
           id: o.id,
           folio: o.folio,
           fecha: new Date(o.fecha_emision).toLocaleString('es-CL'),
           proveedor: o.proveedor_nombre || 'Desconocido',
           monto: o.monto_estimado,
           estado: o.estado,
           resumen: o.notas || 'Compra general',
           lineas: o.lineas || []
        }));
        setOrdenesPendientes(parsed.filter(p => p.estado === 'PENDIENTE'));
        setHistorialOrdenes(parsed);
     }
  };

  const pedidosTaller = React.useMemo(() => {
     let pedidos: PedidoTaller[] = [];
     ordenesTrabajo.forEach(ot => {
         const vehiculo = vehiculos.find(v => v.id === ot.vehiculo_id)?.patente || 'Desconocido';
         if (ot.solicitudes) {
             ot.solicitudes.forEach((sol: any) => {
                 if (sol.estado === 'PENDIENTE') {
                     pedidos.push({
                         id: sol.id,
                         fecha: new Date(sol.created_at || new Date()).toLocaleString(),
                         prioridad: ot.prioridad || 'MEDIA',
                         vehiculo: vehiculo + ' (OT: ' + ot.folio + ')',
                         repuesto: sol.repuesto_nombre || sol.descripcion || 'Sin nombre',
                         sugerencia: 'Sin sugerencia',
                         cantidad: sol.cantidad,
                         motivo: ot.observacion || ot.diagnostico || 'Repuesto para OT',
                         selected: selectedPedidos.includes(sol.id)
                     });
                 }
             });
         }
     });

     if (pedidos.length === 0) {
        pedidos = [
          {
            id: 'sol-tall-101',
            fecha: '28/07/2026 10:30:00',
            prioridad: 'ALTA',
            vehiculo: 'KHLP-90 (OT: OT-2026-088)',
            repuesto: 'Filtro Aceite Caterpillar D8T (1R-1808)',
            sugerencia: 'Finning Chile S.A.',
            cantidad: 4,
            motivo: 'Mantención preventiva 500 hrs camión aljibe',
            selected: selectedPedidos.includes('sol-tall-101')
          },
          {
            id: 'sol-tall-102',
            fecha: '28/07/2026 11:15:00',
            prioridad: 'CRITICA',
            vehiculo: 'BCDF-44 (OT: OT-2026-092)',
            repuesto: 'Kit Empaquetaduras Cilindro Hidráulico',
            sugerencia: 'Komatsu Cummins Chile',
            cantidad: 2,
            motivo: 'Fuga crítica en cilindro levantamiento',
            selected: selectedPedidos.includes('sol-tall-102')
          },
          {
            id: 'sol-tall-103',
            fecha: '29/07/2026 08:45:00',
            prioridad: 'MEDIA',
            vehiculo: 'GHJK-12 (OT: OT-2026-095)',
            repuesto: 'Pastillas de Freno Delanteras Heavy Duty',
            sugerencia: 'Ferretería Industrial Berschand',
            cantidad: 6,
            motivo: 'Desgaste por uso en faena mina',
            selected: selectedPedidos.includes('sol-tall-103')
          }
        ];
     }
     return pedidos;
  }, [ordenesTrabajo, vehiculos, selectedPedidos]);

  const [ordenesPendientes, setOrdenesPendientes] = useState<OrdenCompra[]>([]);
  const [historialOrdenes, setHistorialOrdenes] = useState<HistorialOrden[]>([]);

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

  const handleGuardarNuevaOC = async () => {
    if (!nuevaOCProveedor.trim()) {
      Swal.fire('Atención', 'Por favor, seleccione o ingrese el nombre del proveedor.', 'warning');
      return;
    }
    const montoTotal = nuevaOCLineas.reduce((acc, l) => acc + (l.cantidad * (l.precioUnitario || 0)), 0);
    const folioStr = `OC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const nuevaOCLocal = {
      id: 'oc-' + Date.now(),
      folio: folioStr,
      fecha: new Date().toLocaleDateString('es-CL'),
      fecha_emision: new Date().toISOString(),
      proveedor: nuevaOCProveedor,
      proveedor_nombre: nuevaOCProveedor,
      monto: montoTotal,
      monto_estimado: montoTotal,
      estado: 'PENDIENTE',
      resumen: nuevaOCNotas || `Compra directa proveedor ${nuevaOCProveedor}`,
      notas: nuevaOCNotas,
      lineas: nuevaOCLineas.map((l, idx) => ({
        id: idx + 1,
        repuesto_nombre: l.repuesto || l.descripcion || 'Ítem general',
        descripcion: l.descripcion || l.repuesto || 'Repuesto',
        centro_costo: l.centroCosto || 'Operaciones',
        cantidad: l.cantidad,
        precio_unitario: l.precioUnitario,
        subtotal: l.cantidad * l.precioUnitario
      }))
    };

    if (currentCompany) {
      try {
        const { data, error } = await supabase.from('compras_ordenes').insert({
          empresa_id: currentCompany.id,
          folio: folioStr,
          proveedor_nombre: nuevaOCProveedor,
          monto_estimado: montoTotal,
          estado: 'PENDIENTE',
          notas: nuevaOCNotas
        }).select().single();

        if (!error && data) {
          const lineas = nuevaOCLineas.map(l => ({
            orden_id: data.id,
            repuesto_nombre: l.repuesto || l.descripcion,
            descripcion: l.descripcion,
            centro_costo: l.centroCosto,
            cantidad: l.cantidad,
            precio_unitario: l.precioUnitario
          }));
          await supabase.from('compras_ordenes_lineas').insert(lineas);
        }
      } catch (e) {
        console.warn('DB insert error, stored in localStorage', e);
      }
    }

    const existingOCs = JSON.parse(localStorage.getItem('ordenes_compra') || '[]');
    localStorage.setItem('ordenes_compra', JSON.stringify([nuevaOCLocal, ...existingOCs]));

    Swal.fire({ title: '¡Éxito!', text: `Orden de Compra ${folioStr} generada exitosamente.`, icon: 'success' });
    setShowNuevaOCModal(false);
    setNuevaOCLineas([{ id: Date.now(), repuesto: '', descripcion: '', centroCosto: '', cantidad: 1, precioUnitario: 0 }]);
    setNuevaOCProveedor('');
    setNuevaOCNotas('');
    fetchOrdenes();
  };

  const handleGenerarOCTaller = async () => {
    const pedidosSeleccionados = pedidosTaller.filter(p => p.selected);
    if (pedidosSeleccionados.length === 0) {
      Swal.fire({
        title: 'Seleccione Pedidos',
        text: 'Por favor, marque la casilla (checkbox) de al menos un pedido de taller en la lista para generar la Orden de Compra.',
        icon: 'warning'
      });
      return;
    }

    const prov = proveedorSeleccionadoTaller || 'Finning Chile S.A.';
    const folioStr = `OC-TALLER-${Math.floor(1000 + Math.random() * 9000)}`;
    const resumen = `OC Taller para ${pedidosSeleccionados.length} repuestos: ${pedidosSeleccionados.map(p => p.repuesto).join(', ')}`;
    
    if (currentCompany) {
      try {
        const { data, error } = await supabase.from('compras_ordenes').insert({
          empresa_id: currentCompany.id,
          folio: folioStr,
          proveedor_nombre: prov,
          monto_estimado: 450000 * pedidosSeleccionados.length,
          estado: 'PENDIENTE',
          notas: resumen
        }).select().single();

        if (!error && data) {
          const lineas = pedidosSeleccionados.map(p => ({
            orden_id: data.id,
            repuesto_nombre: p.repuesto,
            descripcion: `Para ${p.vehiculo} - Motivo: ${p.motivo}`,
            centro_costo: 'Taller Mantenimiento',
            cantidad: p.cantidad,
            precio_unitario: 150000
          }));
          await supabase.from('compras_ordenes_lineas').insert(lineas);
        }
      } catch (e) {
        console.warn('Fallback to local OC generation', e);
      }
    }

    // Always ensure saved in localStorage for local state sync
    const nuevaOC = {
      id: 'oc-' + Date.now(),
      folio: folioStr,
      fecha: new Date().toLocaleDateString('es-CL'),
      fecha_emision: new Date().toISOString(),
      proveedor: prov,
      proveedor_nombre: prov,
      rutProveedor: '91.516.000-K',
      monto: 350000 * pedidosSeleccionados.length,
      monto_estimado: 350000 * pedidosSeleccionados.length,
      estado: 'PENDIENTE',
      resumen: resumen,
      notas: `Instrucciones de Despacho: Entregar directamente en Taller Central Mantenimiento Mina.`,
      lineas: pedidosSeleccionados.map((p, idx) => ({
        id: idx + 1,
        repuesto_nombre: p.repuesto,
        descripcion: `Para ${p.vehiculo} - Motivo: ${p.motivo}`,
        centro_costo: 'Taller Mantenimiento',
        cantidad: p.cantidad,
        precio_unitario: 350000 / p.cantidad,
        subtotal: 350000
      }))
    };

    const existingOCs = JSON.parse(localStorage.getItem('ordenes_compra') || '[]');
    localStorage.setItem('ordenes_compra', JSON.stringify([nuevaOC, ...existingOCs]));

    Swal.fire({
      title: '¡Orden de Compra Generada!',
      text: `Se ha creado exitosamente la Orden de Compra ${folioStr} asignada a ${prov} por ${pedidosSeleccionados.length} repuestos de taller.`,
      icon: 'success'
    });
    setSelectedPedidos([]);
    fetchOrdenes();
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

  const handleRecibirMercaderia = async () => {
    if (!selectedOrder) return;
    try {
        const { error } = await supabase.from('compras_ordenes').update({
           estado: 'RECIBIDA'
        }).eq('folio', selectedOrder);
        
        if (error) throw error;
        Swal.fire({
            title: '¡Éxito!', 
            text: `La mercadería para la Orden ${selectedOrder} ha sido recibida correctamente.`, 
            icon: 'success'
        });
        fetchOrdenes();
    } catch (e: any) {
        Swal.fire('Error', e.message, 'error');
    }
  };

  const filteredHistory = historialOrdenes.filter(h => 
     h.folio.toLowerCase().includes(searchHistory.toLowerCase()) || 
     h.proveedor.toLowerCase().includes(searchHistory.toLowerCase())
  );
  
  if (view === 'detalle') {
    const ordenObj = 
      ordenesPendientes.find(o => o.folio === selectedOrder) || 
      historialOrdenes.find(o => o.folio === selectedOrder);
    
    return (
      <OrdenCompraDetalle 
        orden={ordenObj} 
        onBack={() => setView('panel')} 
        onRefresh={fetchOrdenes} 
      />
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
              <span className="text-xl">💰</span> Total en Filtro: $ {filteredHistory.reduce((acc, curr) => acc + (curr.monto || 0), 0).toLocaleString('es-CL')}
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
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
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
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Proveedor</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Recepción</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Factura</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Total</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {filteredHistory.map((orden, idx) => {
                  const stateColor = orden.estado === 'CERRADA' ? 'text-slate-600 dark:text-slate-300' :
                                     orden.estado === 'RECIBIDA' ? 'text-emerald-500' : 
                                     orden.estado === 'PARCIAL' ? 'text-amber-500' : 'text-blue-500';
                  
                  const stateDot = orden.estado === 'CERRADA' ? '⚫' :
                                   orden.estado === 'RECIBIDA' ? '🟢' : 
                                   orden.estado === 'PARCIAL' ? '🟡' : '🔵';
                                   
                  const isFacturada = Math.random() > 0.5; // Placeholder
                  const recepPct = orden.estado === 'PENDIENTE' ? '0%' : orden.estado === 'PARCIAL' ? '60%' : '100%'; // Placeholder
                  
                  return (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 font-black text-slate-800 dark:text-white text-sm">{orden.folio}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 text-xs">{orden.proveedor}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-black flex items-center justify-center gap-1.5 ${stateColor}`}>
                        {stateDot} {orden.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-600 dark:text-slate-300 text-xs">{recepPct}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-600 dark:text-slate-300 text-xs">{isFacturada ? '✔ Adjunta' : '✖ Sin factura'}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white text-sm">${orden.monto.toLocaleString('es-CL')}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleViewDetail(orden.folio)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-500 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mostrando {filteredHistory.length} órdenes registradas</span>
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
              {proveedores.map(p => (
                <option key={p.id} value={p.nombre}>{p.nombre} {p.rut ? `(${p.rut})` : ''}</option>
              ))}
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
                <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedPedidos(pedidosTaller.map(p => p.id));
                  } else {
                    setSelectedPedidos([]);
                  }
                }} /></th>
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
                {proveedores.map(p => (
                  <option key={p.id} value={p.nombre}>{p.nombre} {p.rut ? `(${p.rut})` : ''}</option>
                ))}
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

