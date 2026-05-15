import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Send, 
  MoreVertical,
  DollarSign,
  Package,
  Calendar,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface Order {
  id: string;
  proveedor: string;
  fecha: string;
  total: number;
  estado: 'BORRADOR' | 'ENVIADO' | 'RECEPCIONADO' | 'PAGADO';
  items: number;
}

export default function OrdenesCompra() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch('/api/compras/ordenes')
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      });
  }, []);

  const getStatusStyle = (status: Order['estado']) => {
    switch (status) {
      case 'BORRADOR': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'ENVIADO': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'RECEPCIONADO': return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'PAGADO': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
    }
  };

  const totals = {
    total: orders.reduce((acc, curr) => acc + curr.total, 0),
    count: orders.length,
    pending: orders.filter(o => o.estado !== 'PAGADO').length
  };

  const filteredOrders = orders.filter(o => 
    o.proveedor.toLowerCase().includes(filter.toLowerCase()) || 
    o.id.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            Órdenes de <span className="text-cyan-600">Compra</span>
          </h1>
          <p className="text-slate-500 font-medium">Gestión de adquisiciones, repuestos y suministros.</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700 h-12 px-6 rounded-2xl shadow-lg shadow-cyan-600/20 font-black">
          <Plus className="w-5 h-5 mr-2" /> NUEVA ÓRDEN
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Total OC</span>
          </div>
          <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{totals.count}</div>
          <div className="mt-2 text-xs font-bold text-slate-400">Órdenes activas en sistema</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Pendientes</span>
          </div>
          <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{totals.pending}</div>
          <div className="mt-2 text-xs font-bold text-slate-400">Por recepcionar o pagar</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Valorización</span>
          </div>
          <div className="text-3xl font-black text-slate-800 dark:text-slate-100">
            ${totals.total.toLocaleString('es-CL')}
          </div>
          <div className="mt-2 text-xs font-bold text-slate-400">Monto total comprometido</div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar por OC o Proveedor..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent focus:border-cyan-500 transition-all font-bold text-sm outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="rounded-xl font-bold text-slate-500">
              <Filter className="w-4 h-4 mr-2" /> Filtros
            </Button>
            <Button variant="ghost" className="rounded-xl font-bold text-slate-500">
              <FileText className="w-4 h-4 mr-2" /> Exportar
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID OC</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proveedor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Items</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto Total</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">Cargando órdenes...</td></tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-black text-slate-800 dark:text-slate-100">{order.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{order.proveedor}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">RUT: 76.XXX.XXX-X</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-[13px]">
                      <Calendar className="w-3.5 h-3.5" />
                      {order.fecha}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center justify-center px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-black text-xs text-slate-500">
                      {order.items}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-slate-800 dark:text-slate-100">
                      ${order.total.toLocaleString('es-CL')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusStyle(order.estado)}`}>
                      {order.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button className="p-2 text-slate-400 hover:text-cyan-600 transition-colors rounded-xl hover:bg-white dark:hover:bg-slate-700 shadow-sm opacity-0 group-hover:opacity-100">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
