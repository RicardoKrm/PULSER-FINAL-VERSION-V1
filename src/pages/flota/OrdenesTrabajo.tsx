import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Plus, Search, Filter, DollarSign, FileDown, Trash } from 'lucide-react';

export default function GestionOrdenesTrabajo() {
  const { ordenesTrabajo, vehiculos, eliminarOrdenTrabajo } = useAppContext();
  const navigate = useNavigate();

  const [filtroVehiculo, setFiltroVehiculo] = useState('Todos');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  const otsFiltradas = ordenesTrabajo.filter(ot => {
    const vehiculo = vehiculos.find(v => v.id === ot.vehiculoId);
    const matchVehiculo = filtroVehiculo === 'Todos' || (vehiculo && vehiculo.patente === filtroVehiculo);
    const matchTipo = filtroTipo === 'Todos' || ot.tipo === filtroTipo;
    const matchEstado = filtroEstado === 'Todos' || ot.estado === filtroEstado;
    
    // Date filtering logic
    const fechaOT = new Date(ot.fechaCreacion);
    const matchDesde = !filtroDesde || fechaOT >= new Date(filtroDesde);
    const matchHasta = !filtroHasta || fechaOT <= new Date(filtroHasta);
    
    return matchVehiculo && matchTipo && matchEstado && matchDesde && matchHasta;
  });

  const costoTotal = otsFiltradas.reduce((acc, ot) => {
    const tareas = ot.tareasRealizadas.reduce((tAcc, t) => tAcc + t.costoBase, 0);
    const insumos = ot.insumos.reduce((iAcc, i) => iAcc + i.precioUnitario * i.cantidad, 0);
    return acc + tareas + insumos;
  }, 0);

  const getEstadoColor = (estado: string) => {
    switch(estado) {
        case 'PAUSADA': return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'PROGRAMADA': return 'bg-gray-100 text-gray-700 border-gray-200';
        case 'FINALIZADA': return 'bg-green-100 text-green-700 border-green-200';
        case 'CERRADA_POR_MECANICO': return 'bg-gray-100 text-gray-700 border-gray-200';
        case 'ABIERTA': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  const getTipoColor = (tipo: string) => {
    switch(tipo) {
        case 'PREVENTIVA': return 'bg-sky-100 text-sky-700 border-sky-200';
        case 'CORRECTIVA': return 'bg-amber-100 text-amber-700 border-amber-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg border">
        <h1 className="text-3xl font-bold">Órdenes de Trabajo</h1>
        <div className="flex items-center gap-4">
            <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50"><FileDown className="w-4 h-4 mr-2" /> Exportar</Button>
            <Button className="bg-cyan-600"><Plus className="w-4 h-4 mr-2" /> Crear Nueva OT</Button>
        </div>
      </div>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><Filter className="text-cyan-600 w-5 h-5"/> Filtros</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <select className="p-2 border rounded-md" value={filtroVehiculo} onChange={(e) => setFiltroVehiculo(e.target.value)}>
                <option value="Todos">Todos los Vehículos</option>
                {vehiculos.map(v => <option key={v.id} value={v.patente}>{v.patente}</option>)}
            </select>
            <select className="p-2 border rounded-md" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                <option value="Todos">Todos los Tipos</option>
                <option value="PREVENTIVA">PREVENTIVA</option>
                <option value="CORRECTIVA">CORRECTIVA</option>
            </select>
            <select className="p-2 border rounded-md" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="Todos">Todos los Estados</option>
                <option value="EN_PROCESO">EN PROCESO</option>
                <option value="PROGRAMADA">PROGRAMADA</option>
                <option value="FINALIZADA">FINALIZADA</option>
                <option value="CERRADA_POR_MECANICO">CERRADA POR MECANICO</option>
                <option value="ABIERTA">ABIERTA</option>
                <option value="PAUSADA">PAUSADA</option>
            </select>
            <input type="date" className="p-2 border rounded-md" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} placeholder="Desde" />
            <input type="date" className="p-2 border rounded-md" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} placeholder="Hasta" />
        </div>

        <div className="overflow-auto mt-6">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b uppercase text-xs text-gray-500">
                    <tr>
                        <th className="p-4">Folio</th>
                        <th className="p-4">Vehículo / Modelo</th>
                        <th className="p-4">Tipo</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {otsFiltradas.map((ot) => {
                        const vehiculo = vehiculos.find(v => v.id === ot.vehiculoId);
                        return (
                            <tr key={ot.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-bold">{ot.folio}</td>
                                <td className="p-4">{vehiculo?.patente || 'N/A'}</td>
                                <td className="p-4"><Badge className={`${getTipoColor(ot.tipo)} border`}>{ot.tipo}</Badge></td>
                                <td className="p-4"><Badge className={`${getEstadoColor(ot.estado)} border`}>{ot.estado.replace('_', ' ')}</Badge></td>
                                <td className="p-4 text-right">
                                    <Button size="sm" variant="outline" className="mr-2" onClick={() => navigate(`/flota/ordenes-trabajo/${ot.id}`)}>Ver</Button>
                                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => eliminarOrdenTrabajo(ot.id)}><Trash className="w-4 h-4"/></Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </Card>
    </div>
  );
}
