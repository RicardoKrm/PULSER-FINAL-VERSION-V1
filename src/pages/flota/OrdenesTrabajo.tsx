import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Plus, Search, Filter, DollarSign, FileDown, Trash, Edit } from 'lucide-react';
import { CrearOTModal } from '../../components/flota/CrearOTModal';
import { usePermissions } from '../../hooks/usePermissions';

export default function GestionOrdenesTrabajo() {
  const { ordenesTrabajo, vehiculos, eliminarOrdenTrabajo } = useAppContext();
  const { profile } = useAuth();
  const { hasPermission } = usePermissions();
  const canCrearOT = hasPermission('Módulo de Mantenimiento:Crear Órdenes');
  const isMecanico = profile?.rol?.nombre === 'Mecánico' || profile?.rol?.nombre === 'Mecanico';
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [otToEdit, setOtToEdit] = useState<any>(null);

  const [filtroVehiculo, setFiltroVehiculo] = useState('Todos');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  const otsFiltradas = ordenesTrabajo.filter(ot => {
    // Seguridad de vistas (Roles)
    if (isMecanico && ot.responsable_id !== profile?.id) return false;

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

  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;
  
  const otsPaginadas = otsFiltradas.slice((paginaActual - 1) * itemsPorPagina, paginaActual * itemsPorPagina);
  const totalPaginas = Math.ceil(otsFiltradas.length / itemsPorPagina);
  const isJefatura = profile?.rol?.nombre === 'Supervisor' || profile?.rol?.nombre === 'Administrador' || profile?.rol?.nombre === 'Súper Admin' || profile?.rol?.nombre === 'Dueño';

  const costoTotal = otsFiltradas.reduce((acc, ot) => {
    return acc + (ot.costoInsumos || 0) + (ot.costoManoObraTareas || 0) + (ot.costoManoObraHH || 0);
  }, 0);

  const getEstadoColor = (estado: string) => {
    switch(estado) {
        case 'PAUSADA': return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'PROGRAMADA': return 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';
        case 'FINALIZADA': return 'bg-green-100 text-green-700 border-green-200';
        case 'CERRADA_POR_MECANICO': return 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';
        case 'ABIERTA': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        default: return 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';
    }
  }

  const getTipoColor = (tipoRaw: string) => {
    const tipo = (tipoRaw || '').toUpperCase().replace(/_/g, ' ').trim();

    if (tipo.includes('PREVENTIVA NEUMATICO') || tipo.includes('PREVENTIVO NEUMATICO') || tipo.includes('PREVENTIVA NEUMÁTICO') || tipo.includes('PREVENTIVO NEUMÁTICO')) {
       return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900';
    }
    if (tipo.includes('CORRECTIVA NEUMATICO') || tipo.includes('CORRECTIVO NEUMATICO') || tipo.includes('CORRECTIVA NEUMÁTICO') || tipo.includes('CORRECTIVO NEUMÁTICO')) {
       return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900';
    }
    if (tipo.includes('EVALUATIVA NEUMATICO') || tipo.includes('EVALUATIVO NEUMATICO') || tipo.includes('EVALUATIVA NEUMÁTICO') || tipo.includes('EVALUATIVO NEUMÁTICO')) {
       return 'bg-[#fcf8f2] text-[#c29153] border-[#e8dfd3] dark:bg-stone-900/40 dark:text-[#dfb278] dark:border-stone-800';
    }

    if (tipo.includes('PREVENTIV')) {
       return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900';
    }
    if (tipo.includes('CORRECTIV')) {
       return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900';
    }
    if (tipo.includes('EVALUA') || tipo.includes('EVALUAC')) {
       return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900';
    }
    if (tipo.includes('INSPECC')) {
       return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900';
    }

    switch(tipoRaw) {
        case 'PREVENTIVA': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900';
        case 'CORRECTIVA': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900';
        case 'INSPECCION': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900';
        default: return 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-lg border dark:border-slate-800">
        <h1 className="text-3xl font-bold">Órdenes de Trabajo</h1>
        <div className="flex items-center gap-4">
            <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 dark:bg-green-900/30"><FileDown className="w-4 h-4 mr-2" /> Exportar</Button>
            {canCrearOT && (
              <Button className="bg-cyan-600" onClick={() => { setOtToEdit(null); setIsModalOpen(true); }}><Plus className="w-4 h-4 mr-2" /> Crear Nueva OT</Button>
            )}
        </div>
      </div>
      
      <CrearOTModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} otToEdit={otToEdit} />
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><Filter className="text-cyan-600 w-5 h-5"/> Filtros</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <select className="p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={filtroVehiculo} onChange={(e) => setFiltroVehiculo(e.target.value)}>
                <option value="Todos">Todos los Vehículos</option>
                {vehiculos.map(v => <option key={v.id} value={v.patente}>{v.patente}</option>)}
            </select>
            <select className="p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                <option value="Todos">Todos los Tipos</option>
                <option value="PREVENTIVA">PREVENTIVA</option>
                <option value="CORRECTIVA">CORRECTIVA</option>
                <option value="INSPECCION">INSPECCION</option>
            </select>
            <select className="p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="Todos">Todos los Estados</option>
                <option value="EN_PROCESO">EN PROCESO</option>
                <option value="PROGRAMADA">PROGRAMADA</option>
                <option value="FINALIZADA">FINALIZADA</option>
                <option value="CERRADA_POR_MECANICO">CERRADA POR MECANICO</option>
                <option value="ABIERTA">ABIERTA</option>
                <option value="PAUSADA">PAUSADA</option>
            </select>
            <input type="date" className="p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} placeholder="Desde" />
            <input type="date" className="p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} placeholder="Hasta" />
        </div>

        <div className="overflow-auto mt-6">
            {isJefatura && (
               <div className="flex justify-end p-4 font-bold text-lg text-slate-700 dark:text-slate-200">
                  Costo Total OTs Mostradas: <span className="ml-2 font-mono">${costoTotal.toLocaleString()}</span>
               </div>
            )}
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800 uppercase text-xs text-slate-500 dark:text-slate-400">
                    <tr>
                        <th className="p-4">Folio</th>
                        <th className="p-4">Vehículo / Modelo</th>
                        <th className="p-4">Tipo</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {otsPaginadas.map((ot) => {
                        const vehiculo = vehiculos.find(v => v.id === ot.vehiculoId);
                        return (
                            <tr key={ot.id} className="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900/50">
                                <td className="p-4 font-bold">{ot.folio}</td>
                                <td className="p-4">{vehiculo?.patente || 'N/A'}</td>
                                <td className="p-4"><Badge className={`${getTipoColor(ot.tipo)} border dark:border-slate-800`}>{ot.tipo}</Badge></td>
                                <td className="p-4"><Badge className={`${getEstadoColor(ot.estado)} border dark:border-slate-800`}>{ot.estado.replace('_', ' ')}</Badge></td>
                                <td className="p-4 text-right">
                                    <Button size="sm" variant="ghost" className="mr-2 text-cyan-600" onClick={() => { setOtToEdit(ot); setIsModalOpen(true); }}><Edit className="w-4 h-4"/></Button>
                                    <Button size="sm" variant="outline" className="mr-2" onClick={() => navigate(`/flota/ordenes-trabajo/${ot.id}`)}>Ver</Button>
                                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => eliminarOrdenTrabajo(ot.id)}><Trash className="w-4 h-4"/></Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            
            {totalPaginas > 1 && (
                <div className="flex justify-center items-center gap-2 p-4 border-t dark:border-slate-800">
                    <Button variant="outline" size="sm" disabled={paginaActual === 1} onClick={() => setPaginaActual(p => p - 1)}>Anterior</Button>
                    <span className="text-sm">Página {paginaActual} de {totalPaginas}</span>
                    <Button variant="outline" size="sm" disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual(p => p + 1)}>Siguiente</Button>
                </div>
            )}
        </div>
      </Card>
    </div>
  );
}
