import React, { useState } from 'react';
import { 
  ArrowLeft, FileText, CheckCircle, XCircle, Printer, ShoppingCart, 
  Paperclip, History, Download, AlertCircle, Send, Save, Plus, Trash2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import Swal from 'sweetalert2';

interface Props {
  solicitud: any;
  onBack: () => void;
  onSave?: (solicitud: any) => void;
  isNew?: boolean;
  nextId?: string;
}

export default function SolicitudCompraDetalle({ solicitud: initialData, onBack, onSave, isNew = false, nextId = 'SC-000001' }: Props) {
  const [solicitud, setSolicitud] = useState(() => initialData || {
    id: nextId,
    estado: 'BORRADOR',
    fecha: new Date().toISOString().split('T')[0],
    solicitante: '',
    departamento: 'Operaciones',
    centroCosto: '',
    faena: '',
    prioridad: 'MEDIA',
    motivo: '',
    observaciones: '',
    montoAprox: 0,
    items: [],
    adjuntos: [],
    historial: [
      { fecha: new Date().toISOString(), usuario: 'Usuario', accion: 'Creó la solicitud en borrador' }
    ]
  });

  const [editMode, setEditMode] = useState(isNew || solicitud.estado === 'BORRADOR');
  const [showAprobarModal, setShowAprobarModal] = useState(false);
  const [showRechazarModal, setShowRechazarModal] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  
  const [newItem, setNewItem] = useState({
    descripcion: '',
    cantidad: 1,
    unidad: 'Un',
    categoria: 'General',
    marca: '',
    modelo: '',
    codigo: '',
    montoEstimado: 0
  });

  // State for item approval
  const [itemsAprobacion, setItemsAprobacion] = useState<any[]>(
    solicitud.items.map((i: any) => ({ ...i, cantidadAprobada: i.cantidad }))
  );
  
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BORRADOR': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
      case 'PENDIENTE': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'EN REVISIÓN': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'APROBADA': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'APROBADA PARCIALMENTE': return 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400';
      case 'RECHAZADA': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      case 'CONVERTIDA EN OC': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'ANULADA': return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setSolicitud((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddItem = () => {
    if (!newItem.descripcion.trim()) {
      Swal.fire('Atención', 'Por favor ingrese la descripción del ítem.', 'warning');
      return;
    }
    const itemToAdd = {
      id: Date.now(),
      ...newItem,
      cantidadAprobada: newItem.cantidad
    };
    const updatedItems = [...solicitud.items, itemToAdd];
    const calcMonto = updatedItems.reduce((acc, i) => acc + (Number(i.montoEstimado || 0) * Number(i.cantidad || 1)), 0);

    setSolicitud((prev: any) => ({
      ...prev,
      items: updatedItems,
      montoAprox: calcMonto > 0 ? calcMonto : prev.montoAprox
    }));

    setNewItem({
      descripcion: '',
      cantidad: 1,
      unidad: 'Un',
      categoria: 'General',
      marca: '',
      modelo: '',
      codigo: '',
      montoEstimado: 0
    });
    setShowAddItem(false);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = solicitud.items.filter((_: any, idx: number) => idx !== index);
    const calcMonto = updatedItems.reduce((acc: number, i: any) => acc + (Number(i.montoEstimado || 0) * Number(i.cantidad || 1)), 0);
    setSolicitud((prev: any) => ({
      ...prev,
      items: updatedItems,
      montoAprox: calcMonto
    }));
  };

  const handleGuardarBorrador = () => {
    if (onSave) {
      onSave(solicitud);
    }
    Swal.fire('Guardado', 'La solicitud ha sido guardada en borrador.', 'success');
  };

  const handleEnviar = () => {
    if (!solicitud.solicitante.trim()) {
      Swal.fire('Atención', 'Por favor indique el nombre del solicitante.', 'warning');
      return;
    }
    if (!solicitud.motivo.trim()) {
      Swal.fire('Atención', 'Por favor indique el motivo de la compra.', 'warning');
      return;
    }
    Swal.fire({
      title: '¿Desea enviar la solicitud?',
      text: "Una vez enviada quedará pendiente de aprobación.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, enviar'
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = { 
          ...solicitud, 
          estado: 'PENDIENTE',
          historial: [{ fecha: new Date().toISOString(), usuario: solicitud.solicitante || 'Usuario', accion: 'Envió la solicitud' }, ...solicitud.historial]
        };
        setSolicitud(updated);
        if (onSave) {
          onSave(updated);
        }
        setEditMode(false);
        Swal.fire('Enviada', 'La solicitud ha sido enviada exitosamente.', 'success');
      }
    });
  };

  const handleAprobarSubmit = () => {
    const isPartial = itemsAprobacion.some(i => i.cantidadAprobada < i.cantidad);
    const newState = isPartial ? 'APROBADA PARCIALMENTE' : 'APROBADA';
    
    const updated = {
      ...solicitud,
      estado: newState,
      items: itemsAprobacion,
      historial: [
        { 
          fecha: new Date().toISOString(), 
          usuario: 'Aprobador', 
          accion: isPartial ? 'Aprobó parcialmente la solicitud' : 'Aprobó la solicitud' 
        }, 
        ...solicitud.historial
      ]
    };

    setSolicitud(updated);
    if (onSave) {
      onSave(updated);
    }
    setShowAprobarModal(false);
    Swal.fire('Aprobada', `La solicitud ha sido ${newState.toLowerCase()}.`, 'success');
  };

  const handleRechazarSubmit = () => {
    if (!motivoRechazo.trim()) {
      Swal.fire('Error', 'Debe indicar un motivo de rechazo.', 'error');
      return;
    }
    const updated = {
      ...solicitud,
      estado: 'RECHAZADA',
      historial: [
        { fecha: new Date().toISOString(), usuario: 'Aprobador', accion: `Rechazó la solicitud. Motivo: ${motivoRechazo}` }, 
        ...solicitud.historial
      ]
    };
    setSolicitud(updated);
    if (onSave) {
      onSave(updated);
    }
    setShowRechazarModal(false);
    Swal.fire('Rechazada', 'La solicitud ha sido rechazada.', 'success');
  };

  const isEditable = solicitud.estado === 'BORRADOR' || editMode;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
      {/* Cabecera */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-black text-slate-800 dark:text-white flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-500" /> Solicitud de Compra {solicitud.id}
            </h1>
            <span className={`px-3 py-1 rounded-md text-[10px] font-black tracking-wider uppercase inline-flex ${getStatusColor(solicitud.estado)}`}>
              {solicitud.estado}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1">
            Solicitante: {solicitud.solicitante || 'Por especificar'} • Fecha: {solicitud.fecha}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button onClick={onBack} variant="outline" className="font-bold">
            <ArrowLeft className="w-4 h-4 mr-2" /> VOLVER
          </Button>
          
          <Button onClick={() => window.print()} variant="outline" className="font-bold">
            <Printer className="w-4 h-4 mr-2" /> IMPRIMIR
          </Button>

          {solicitud.estado === 'BORRADOR' && (
            <>
              <Button onClick={handleGuardarBorrador} variant="outline" className="font-bold border-blue-500 text-blue-600 hover:bg-blue-50">
                <Save className="w-4 h-4 mr-2" /> GUARDAR BORRADOR
              </Button>
              <Button onClick={handleEnviar} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                <Send className="w-4 h-4 mr-2" /> ENVIAR SOLICITUD
              </Button>
            </>
          )}

          {solicitud.estado === 'PENDIENTE' && (
            <>
              <Button onClick={() => setShowAprobarModal(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                <CheckCircle className="w-4 h-4 mr-2" /> APROBAR / AJUSTAR
              </Button>
              <Button onClick={() => setShowRechazarModal(true)} className="bg-red-500 hover:bg-red-600 text-white font-bold">
                <XCircle className="w-4 h-4 mr-2" /> RECHAZAR
              </Button>
            </>
          )}

          {(solicitud.estado === 'APROBADA' || solicitud.estado === 'APROBADA PARCIALMENTE') && (
            <Button className="bg-[#1e293b] hover:bg-slate-800 text-white font-bold">
              <ShoppingCart className="w-4 h-4 mr-2" /> GENERAR ORDEN DE COMPRA
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Contenido Central (Left) */}
        <div className="flex-1 space-y-6">
          {/* Información General */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 py-4 px-6">
              <CardTitle className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-wider uppercase">Información General</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre Solicitante *</label>
                  {isEditable ? (
                    <input 
                      type="text"
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 font-bold" 
                      placeholder="Ej: Juan Pérez"
                      value={solicitud.solicitante}
                      onChange={(e) => handleFieldChange('solicitante', e.target.value)}
                    />
                  ) : (
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{solicitud.solicitante || '-'}</span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Departamento</label>
                  {isEditable ? (
                    <select 
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 dark:bg-slate-900 dark:border-slate-700 dark:text-white font-medium" 
                      value={solicitud.departamento}
                      onChange={(e) => handleFieldChange('departamento', e.target.value)}
                    >
                      <option value="Operaciones">Operaciones</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Administración">Administración</option>
                      <option value="Prevención de Riesgos">Prevención de Riesgos</option>
                      <option value="Logística">Logística</option>
                    </select>
                  ) : (
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{solicitud.departamento || '-'}</span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Centro de Costo</label>
                  {isEditable ? (
                    <input 
                      type="text" 
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500" 
                      placeholder="Ej: CC-102"
                      value={solicitud.centroCosto} 
                      onChange={(e) => handleFieldChange('centroCosto', e.target.value)}
                    />
                  ) : (
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{solicitud.centroCosto || '-'}</span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Faena / Proyecto</label>
                  {isEditable ? (
                    <input 
                      type="text" 
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500" 
                      placeholder="Ej: Mina Central"
                      value={solicitud.faena} 
                      onChange={(e) => handleFieldChange('faena', e.target.value)}
                    />
                  ) : (
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{solicitud.faena || '-'}</span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prioridad</label>
                  {isEditable ? (
                    <select 
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 dark:bg-slate-900 dark:border-slate-700 dark:text-white font-medium" 
                      value={solicitud.prioridad}
                      onChange={(e) => handleFieldChange('prioridad', e.target.value)}
                    >
                      <option value="BAJA">BAJA</option>
                      <option value="MEDIA">MEDIA</option>
                      <option value="ALTA">ALTA</option>
                      <option value="CRÍTICA">CRÍTICA</option>
                    </select>
                  ) : (
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{solicitud.prioridad}</span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto Estimado ($ CLP)</label>
                  {isEditable ? (
                    <input 
                      type="number" 
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 font-bold" 
                      placeholder="0"
                      value={solicitud.montoAprox || ''} 
                      onChange={(e) => handleFieldChange('montoAprox', Number(e.target.value))}
                    />
                  ) : (
                    <span className="font-black text-slate-800 dark:text-slate-200 text-sm">${(solicitud.montoAprox || 0).toLocaleString('es-CL')}</span>
                  )}
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Motivo / Requerimiento *</label>
                  {isEditable ? (
                    <textarea 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm h-20 resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 font-medium" 
                      value={solicitud.motivo} 
                      onChange={(e) => handleFieldChange('motivo', e.target.value)}
                      placeholder="Justifique la necesidad de la compra de forma detallada..."
                    ></textarea>
                  ) : (
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{solicitud.motivo || '-'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ítems */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 py-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-wider uppercase">Detalle de Ítems Solicitados</CardTitle>
              {isEditable && (
                <Button onClick={() => setShowAddItem(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8">
                  + AGREGAR ÍTEM
                </Button>
              )}
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cant.</th>
                    {(solicitud.estado.includes('APROBADA') || solicitud.estado === 'PENDIENTE' || solicitud.estado === 'CONVERTIDA EN OC') && (
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Aprobado</th>
                    )}
                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Unidad</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Descripción</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Categoría</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Marca / Modelo</th>
                    {isEditable && <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {solicitud.items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm font-medium text-slate-500">
                        No hay ítems registrados en esta solicitud. Haz clic en <strong>+ AGREGAR ÍTEM</strong> para añadir requerimientos.
                      </td>
                    </tr>
                  ) : (
                    solicitud.items.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-black text-slate-800 dark:text-white text-sm">{item.cantidad}</td>
                        {(solicitud.estado.includes('APROBADA') || solicitud.estado === 'PENDIENTE' || solicitud.estado === 'CONVERTIDA EN OC') && (
                          <td className="px-4 py-3 text-center">
                            {solicitud.estado === 'PENDIENTE' ? (
                              <span className="text-slate-400 text-xs">-</span>
                            ) : (
                              <span className={`px-2 py-1 rounded text-xs font-black ${item.cantidadAprobada < item.cantidad ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {item.cantidadAprobada}
                              </span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 font-bold text-slate-600 dark:text-slate-400 text-xs">{item.unidad}</td>
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200 text-sm">
                          {item.descripcion}
                          {item.codigo && <span className="block text-[10px] text-slate-400 font-normal">Cód: {item.codigo}</span>}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400 text-xs">{item.categoria || 'General'}</td>
                        <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400 text-xs">
                          {item.marca || '-'} {item.modelo && `/ ${item.modelo}`}
                        </td>
                        {isEditable && (
                          <td className="px-4 py-3 text-center">
                            <button 
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-red-500 p-1"
                              title="Eliminar ítem"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Panel Lateral Derecho */}
        <div className="w-full xl:w-96 space-y-6 flex-shrink-0">
          
          {/* Adjuntos */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 py-4 px-6 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-slate-500" />
                <CardTitle className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-wider uppercase">Adjuntos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {solicitud.adjuntos.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No hay documentos adjuntos</p>
              ) : (
                solicitud.adjuntos.map((adj: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{adj.nombre}</span>
                    </div>
                    <button className="text-slate-400 hover:text-blue-500">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
              {isEditable && (
                <button className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                  <Paperclip className="w-3.5 h-3.5" /> AGREGAR DOCUMENTO
                </button>
              )}
            </CardContent>
          </Card>

          {/* Historial y Auditoría */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 py-4 px-6">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <CardTitle className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-wider uppercase">Historial</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-80 overflow-y-auto">
                {(solicitud.historial || []).map((ev: any, idx: number) => {
                  const d = new Date(ev.fecha);
                  return (
                    <div key={idx} className="p-4 flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-black text-slate-600 dark:text-slate-400">{(ev.usuario || 'U').charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{ev.usuario || 'Usuario'}</p>
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">{ev.accion}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{isNaN(d.getTime()) ? ev.fecha : d.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Modal Agregar Ítem */}
      <Modal isOpen={showAddItem} onClose={() => setShowAddItem(false)} title="Agregar Ítem a la Solicitud" size="lg">
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Descripción del Ítem / Repuesto *</label>
            <input 
              type="text" 
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none focus:border-blue-500 dark:text-white"
              placeholder="Ej: Casco de Seguridad Blanco V-Gard"
              value={newItem.descripcion}
              onChange={(e) => setNewItem({ ...newItem, descripcion: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Cantidad *</label>
              <input 
                type="number" 
                min="1"
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none focus:border-blue-500 dark:text-white"
                value={newItem.cantidad}
                onChange={(e) => setNewItem({ ...newItem, cantidad: Math.max(1, parseInt(e.target.value) || 1) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Unidad</label>
              <select 
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none focus:border-blue-500 dark:text-white"
                value={newItem.unidad}
                onChange={(e) => setNewItem({ ...newItem, unidad: e.target.value })}
              >
                <option value="Un">Un (Unidades)</option>
                <option value="Set">Set / Juego</option>
                <option value="Kg">Kg (Kilogramos)</option>
                <option value="Lts">Lts (Litros)</option>
                <option value="Mt">Mt (Metros)</option>
                <option value="Caja">Caja</option>
                <option value="Global">Global</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Categoría</label>
              <input 
                type="text" 
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none focus:border-blue-500 dark:text-white"
                placeholder="Ej: EPP, Herramientas, Repuestos"
                value={newItem.categoria}
                onChange={(e) => setNewItem({ ...newItem, categoria: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Precio Unitario Est. ($ CLP)</label>
              <input 
                type="number" 
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none focus:border-blue-500 dark:text-white"
                placeholder="0"
                value={newItem.montoEstimado || ''}
                onChange={(e) => setNewItem({ ...newItem, montoEstimado: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Marca</label>
              <input 
                type="text" 
                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none dark:text-white"
                placeholder="Ej: MSA, 3M"
                value={newItem.marca}
                onChange={(e) => setNewItem({ ...newItem, marca: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Modelo</label>
              <input 
                type="text" 
                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none dark:text-white"
                placeholder="Ej: V-Gard"
                value={newItem.modelo}
                onChange={(e) => setNewItem({ ...newItem, modelo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Código / Ref</label>
              <input 
                type="text" 
                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none dark:text-white"
                placeholder="Ej: EPP-001"
                value={newItem.codigo}
                onChange={(e) => setNewItem({ ...newItem, codigo: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="outline" onClick={() => setShowAddItem(false)}>Cancelar</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={handleAddItem}>
              Agregar Ítem
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modals de Aprobación/Rechazo */}
      <Modal isOpen={showAprobarModal} onClose={() => setShowAprobarModal(false)} title="Aprobar Solicitud" size="3xl">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-4">
            Puede aprobar la solicitud completa o ajustar las cantidades según presupuesto o stock.
          </p>
          
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50">
                  <th className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase">Descripción</th>
                  <th className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase text-center">Solicitado</th>
                  <th className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase text-center">Aprobado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {itemsAprobacion.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-bold text-xs">{item.descripcion}</td>
                    <td className="px-4 py-3 text-center font-bold text-xs">{item.cantidad} {item.unidad}</td>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="number" 
                        min="0"
                        max={item.cantidad}
                        className="w-20 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-sm font-bold mx-auto outline-none focus:border-blue-500" 
                        value={item.cantidadAprobada}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const newItems = [...itemsAprobacion];
                          newItems[idx].cantidadAprobada = val;
                          setItemsAprobacion(newItems);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowAprobarModal(false)}>Cancelar</Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleAprobarSubmit}>
              Confirmar Aprobación
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showRechazarModal} onClose={() => setShowRechazarModal(false)} title="Rechazar Solicitud">
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Está a punto de rechazar la solicitud <strong>{solicitud.id}</strong>. Esta acción no se puede deshacer y la solicitud no podrá ser convertida en Orden de Compra.
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Motivo del Rechazo *</label>
            <textarea 
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none h-24 resize-none focus:border-red-500"
              placeholder="Indique la razón por la cual rechaza esta solicitud..."
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowRechazarModal(false)}>Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleRechazarSubmit}>
              Rechazar Definitivamente
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
