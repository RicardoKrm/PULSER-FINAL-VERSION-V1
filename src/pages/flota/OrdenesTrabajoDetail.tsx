import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ArrowLeft, Edit, Printer, Clock, Wrench, Boxes, History, ChevronDown, ChevronUp, Save, Trash2, Plus, FileText, CheckCircle, FileDown, Search, AlertCircle, PenTool, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const sumInsumosData = [
  { id: 1, nombre: "Filtro Aceite Dirección Hidráulica Scania", sku: "38377546", stock: 96 },
  { id: 2, nombre: "Filtro Aceite E III", sku: "A 457 180 11 09:MBB", stock: 99 },
  { id: 3, nombre: "Filtro Aceite E V", sku: "A 457 180 00 09:MBB", stock: 100 },
  { id: 4, nombre: "Filtro Aceite E V", sku: "A 457 180 00 09:HENGST", stock: 95 },
  { id: 5, nombre: "Filtro Aire NCV3", sku: "A 0000903751:HENGST", stock: 20 },
];

export default function OrdenesTrabajoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ordenesTrabajo, vehiculos, kitsRepuesto, tareasEstandar, repuestos, actualizarOrdenTrabajo } = useAppContext();
  const { profile } = useAuth();
  const isSupervisorOrAdmin = profile?.rol?.nombre === 'Supervisor' || profile?.rol?.nombre === 'Administrador' || profile?.rol?.nombre === 'Admin' || profile?.rol?.nombre === 'Súper Admin';
  const isMecanico = profile?.rol?.nombre === 'Mecánico' || profile?.rol?.nombre === 'Mecanico';
  const [activeTab, setActiveTab] = useState<'tareas' | 'insumos' | 'historial' | 'solicitudes'>('tareas');
  const [activePanels, setActivePanels] = useState<Record<string, boolean>>({ diagnostico: false, pauta: false, personal: false, estado: false });
  const [selectedKitToAdd, setSelectedKitToAdd] = useState('');
  
  const [isTareaModalOpen, setIsTareaModalOpen] = useState(false);
  const [isInsumoModalOpen, setIsInsumoModalOpen] = useState(false);
  const [insumoSearch, setInsumoSearch] = useState('');

  const [isSolicitudModalOpen, setIsSolicitudModalOpen] = useState(false);
  const [nuevaSolicitud, setNuevaSolicitud] = useState({ repuesto_nombre: '', cantidad: 1 });
  const [isAprobarModalOpen, setIsAprobarModalOpen] = useState(false);
  const [solicitudToAprobar, setSolicitudToAprobar] = useState<any>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  
  const [firmaURL, setFirmaURL] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const ot = ordenesTrabajo.find(o => o.id === id || o.folio === id);
  const vehiculo = vehiculos.find(v => v.id === ot?.vehiculoId);

  const [nuevoEstado, setNuevoEstado] = useState(ot?.estado || 'ABIERTA');
  const [kmCierre, setKmCierre] = useState(ot?.kilometrajeCierre?.toString() || '');
  const [isUpdatingDb, setIsUpdatingDb] = useState(false);

  if (!ot) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">OT no encontrada</div>;

  const handleActualizarEstado = async () => {
    if (!ot) return;
    if (nuevoEstado === 'FINALIZADA') {
        const kmVal = Number(kmCierre);
        if (!kmCierre || isNaN(kmVal) || kmVal <= 0) {
            alert('Debe ingresar un Kilometraje de Cierre válido para finalizar la OT.');
            return;
        }

        setIsUpdatingDb(true);
        try {
            // Actualización de la OT en base de datos si existe, en este caso 
            // el context maneja local, pero podemos sincronizar Vehiculo a Supabase directo
            // de acuerdo a la instrucción
            const { data: dbVehiculo, error: selectErr } = await supabase
                .from('vehiculo')
                .select('*')
                .eq('id', ot.vehiculoId)
                .single();

            if (!selectErr && dbVehiculo) {
                // 1. Actualizar el KM actual del vehículo si el de la OT es mayor
                let updatedData: any = {};
                let updatedDetalles = dbVehiculo.detalles || {};
                
                if (kmVal > (dbVehiculo.kilometraje_actual || 0)) {
                    updatedData.kilometraje_actual = kmVal;
                    updatedData.updated_at = new Date().toISOString();
                }

                // 2. Guardar caché de Pauta si es preventiva
                if (ot.tipo === 'PREVENTIVA' || ot.tipo === 'PREVENTIVA_NEUMATICOS') {
                    // Update detalles object directly exactly like python logic mapping
                    updatedDetalles.km_ultima_mantencion = kmVal;
                    updatedDetalles.fecha_ultima_mantencion = new Date().toISOString();
                    updatedDetalles.tipo_ult_pauta = ot.pauta || 'Sin Pauta Especificada';
                    
                    updatedData.detalles = updatedDetalles;
                }

                if (Object.keys(updatedData).length > 0) {
                    const { error: updateErr } = await supabase
                        .from('vehiculo')
                        .update(updatedData)
                        .eq('id', ot.vehiculoId);
                    
                    if (updateErr) {
                        console.error('Error updating Vehiculo:', updateErr);
                        alert('Advertencia: No se pudo actualizar el vehículo en la BD.');
                    }
                }
            } else if (selectErr) {
                console.warn("Vehículo no encontrado en BD para sincronizar.", selectErr);
            }

            // Continuar con actualizacion en AppContext para UI
            actualizarOrdenTrabajo({
                ...ot,
                estado: nuevoEstado as any,
                kilometrajeCierre: kmVal,
                historial: [
                    ...ot.historial,
                    {
                        id: Math.random().toString(36).substr(2, 9),
                        orden_id: ot.id,
                        comentario: `Cierre de OT a los ${kmVal} km`,
                        created_at: new Date().toISOString(),
                        estado_nuevo: nuevoEstado,
                        usuario_nombre: 'Taller'
                    }
                ]
            });
            alert('OT Finalizada y Pizarra de Mantenimiento actualizada.');
        } catch (error) {
            console.error(error);
        } finally {
            setIsUpdatingDb(false);
        }
    } else {
        // Just state update
        actualizarOrdenTrabajo({
            ...ot,
            estado: nuevoEstado as any,
            historial: [
                ...ot.historial,
                {
                    id: Math.random().toString(36).substr(2, 9),
                    orden_id: ot.id,
                    comentario: `Cambio de estado a ${nuevoEstado}`,
                    created_at: new Date().toISOString(),
                    estado_nuevo: nuevoEstado,
                    usuario_nombre: 'Administrador'
                }
            ]
        });
    }
    togglePanel('estado');
  };

  const togglePanel = (panel: string) => setActivePanels(prev => ({ ...prev, [panel]: !prev[panel] }));
  const totalCosto = ot.costoInsumos + ot.costoManoObraTareas + ot.costoManoObraHH;

  const handleCargarKit = () => {
    if (!selectedKitToAdd || !ot) return;
    const kit = kitsRepuesto.find(k => k.id === selectedKitToAdd);
    if (!kit || !kit.detalles) return;

    const nuevosInsumos = kit.detalles.map(det => ({
      id: Math.random().toString(36).substr(2, 9),
      nombre: det.repuesto,
      cantidad: det.cantidad,
      precioUnitario: 0
    }));

    actualizarOrdenTrabajo({
      ...ot,
      insumos: [...ot.insumos, ...nuevosInsumos],
      historial: [
        ...ot.historial,
        {
          id: Math.random().toString(36).substr(2, 9),
          orden_id: ot.id,
          comentario: `Agregado Kit de repuestos: ${kit.nombre}`,
          created_at: new Date().toISOString(),
          usuario_nombre: 'Sistema/Admin'
        }
      ]
    });
    setSelectedKitToAdd('');
  };

  const agregarTarea = (tarea: any) => {
    if (!ot) return;
    actualizarOrdenTrabajo({
      ...ot,
      tareasRealizadas: [
        ...ot.tareasRealizadas,
        { 
          id: Math.random().toString(36).substr(2, 9), 
          orden_id: ot.id, 
          tarea_estandar_id: tarea.id, 
          tiempo_real_minutos: tarea.tiempoEstandarMinutos || 0,
          costo_real: tarea.costoManoObra,
          tarea_estandar: tarea 
        }
      ],
      costoManoObraTareas: ot.costoManoObraTareas + tarea.costoManoObra
    });
    setIsTareaModalOpen(false);
  };

  const agregarInsumo = (repuesto: any) => {
    if (!ot) return;
    const existe = ot.insumos.find(i => i.repuesto?.nombre === repuesto.nombre);
    
    let nuevosInsumos: any[] = [];
    if (existe) {
      nuevosInsumos = ot.insumos.map(i => i.repuesto?.nombre === repuesto.nombre ? { ...i, cantidad: i.cantidad + 1, costo_total: (i.cantidad + 1) * i.costo_unitario_aplicado } : i);
    } else {
      nuevosInsumos = [...ot.insumos, { 
        id: Math.random().toString(36).substr(2, 9), 
        orden_id: ot.id,
        repuesto_id: repuesto.id || Math.random().toString(36).substr(2, 9),
        repuesto: repuesto,
        cantidad: 1, 
        costo_unitario_aplicado: repuesto.costo_unitario || 0,
        costo_total: repuesto.costo_unitario || 0
      }];
    }

    actualizarOrdenTrabajo({
      ...ot,
      insumos: nuevosInsumos,
      costoInsumos: nuevosInsumos.reduce((sum, item) => sum + item.costo_total, 0),
      historial: [
        ...ot.historial,
        {
          id: Math.random().toString(36).substr(2, 9),
          orden_id: ot.id,
          comentario: `Agregado insumo/repuesto: ${repuesto.nombre}`,
          created_at: new Date().toISOString(),
          usuario_nombre: profile?.nombre || 'Taller'
        }
      ]
    });
    setIsInsumoModalOpen(false);
    setInsumoSearch('');
  };

  const crearSolicitud = () => {
    if (!ot || !nuevaSolicitud.repuesto_nombre) return;
    
    const s: any = {
       id: Math.random().toString(36).substr(2, 9),
       orden_id: ot.id,
       repuesto_nombre: nuevaSolicitud.repuesto_nombre,
       cantidad: nuevaSolicitud.cantidad,
       estado: 'PENDIENTE',
       solicitante_id: profile?.id,
       fecha_solicitud: new Date().toISOString()
    };
    
    actualizarOrdenTrabajo({
      ...ot,
      solicitudes: [...(ot.solicitudes || []), s],
      historial: [
        ...ot.historial,
        {
          id: Math.random().toString(36).substr(2, 9),
          orden_id: ot.id,
          comentario: `Solicitud de repuesto creada: ${s.repuesto_nombre} (x${s.cantidad})`,
          created_at: s.fecha_solicitud,
          usuario_nombre: profile?.nombre || 'Taller'
        }
      ]
    });
    setIsSolicitudModalOpen(false);
    setNuevaSolicitud({ repuesto_nombre: '', cantidad: 1 });
  };

  const resolverSolicitud = (solicitudId: string, nuevoEstado: 'APROBADA' | 'RECHAZADA') => {
    if (!ot) return;
    
    const nuevasSolicitudes = (ot.solicitudes || []).map(s => {
       if (s.id === solicitudId) {
          return { ...s, estado: nuevoEstado, motivo_rechazo: nuevoEstado === 'RECHAZADA' ? motivoRechazo : undefined };
       }
       return s;
    });

    actualizarOrdenTrabajo({
      ...ot,
      solicitudes: nuevasSolicitudes,
      historial: [
        ...ot.historial,
        {
          id: Math.random().toString(36).substr(2, 9),
          orden_id: ot.id,
          comentario: `Solicitud ${nuevoEstado}: ${ot.solicitudes?.find(s => s.id === solicitudId)?.repuesto_nombre}${nuevoEstado === 'RECHAZADA' ? ` - Motivo: ${motivoRechazo}` : ''}`,
          created_at: new Date().toISOString(),
          usuario_nombre: profile?.nombre || 'Jefatura'
        }
      ]
    });
    
    setIsAprobarModalOpen(false);
    setSolicitudToAprobar(null);
    setMotivoRechazo('');
  };
  
  const handleFirmaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
           if (event.target?.result && ot) {
              setFirmaURL(event.target.result as string);
              actualizarOrdenTrabajo({
                 ...ot,
                 firmaCertificado: event.target.result as string,
                 historial: [
                    ...ot.historial,
                    {
                       id: Math.random().toString(36).substr(2, 9),
                       orden_id: ot.id,
                       comentario: `Firma digital asociada al certificado`,
                       created_at: new Date().toISOString(),
                       usuario_nombre: profile?.nombre || 'Taller'
                    }
                 ]
              });
           }
        };
        reader.readAsDataURL(e.target.files[0]);
     }
  };

  const hasSolicitudesPendientes = (ot?.solicitudes?.filter(s => s.estado === 'PENDIENTE').length || 0) > 0;

  const filteredInsumos = sumInsumosData.filter(i => i.nombre.toLowerCase().includes(insumoSearch.toLowerCase()) || i.sku.toLowerCase().includes(insumoSearch.toLowerCase()));

  return (
    <div className="space-y-6 p-6">
      
      {hasSolicitudesPendientes && (
        <div className="bg-red-500/10 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded shadow-sm flex items-center">
          <AlertCircle className="w-5 h-5 mr-3" />
          <span className="font-bold mr-2">¡ATENCIÓN!</span> Esta OT tiene solicitudes de repuestos pendientes de aprobación.
        </div>
      )}

      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border dark:border-slate-800">
        <Button variant="ghost" onClick={() => navigate('/flota/ordenes-trabajo')}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        <h1 className="text-xl font-bold">OT #{ot.folio} <Badge className="ml-2 bg-green-600 text-white">{ot.estado.replace('_', ' ')}</Badge></h1>
        <div className="flex gap-2 font-bold">
            {ot.tipo === 'INSPECCION' && (
              <Button onClick={() => navigate('/flota/neumaticos?tab=inspeccion')} className="bg-purple-600 hover:bg-purple-700 text-white">
                <FileText className="w-4 h-4 mr-2" /> Realizar Inspección
              </Button>
            )}
            <span className="flex items-center text-slate-600 dark:text-slate-400 mr-4"><Clock className="w-4 h-4 mr-1"/> {new Date(ot.tiempoTrabajadoSegundos * 1000).toISOString().substr(11, 8)}</span>
            
            <Button variant="outline" className="hidden lg:flex" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2"/> Hoja OT</Button>
            <Button variant="outline" className="hidden xl:flex" onClick={() => window.print()}><FileText className="w-4 h-4 mr-2"/> Cargo Personal</Button>
            <Button variant="outline" onClick={() => window.print()}><CheckCircle className="w-4 h-4 mr-2"/> Certificado</Button>

            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
               <PenTool className="w-4 h-4 mr-2" /> Firmar
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFirmaUpload} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader><CardTitle className="text-lg">Información General</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <p><strong>Vehículo:</strong> {vehiculo?.patente || 'N/A'}</p>
                    <p><strong>Técnico Responsable:</strong> {ot.tecnicoResponsable || 'Sin asignar'}</p>
                    <p><strong>Tipo:</strong> {ot.tipo}</p>
                    <p><strong>Prioridad:</strong> {ot.prioridad}</p>
                    <p><strong>Fecha Creación:</strong> {new Date(ot.fechaCreacion).toLocaleDateString()}</p>
                    <p><strong>KM Apertura:</strong> {ot.kilometrajeApertura.toLocaleString()}</p>
                    <div className="col-span-2 bg-yellow-50 p-4 border dark:border-slate-800 border-yellow-200 rounded">
                        <p className="font-bold text-yellow-800 uppercase text-xs mb-1">Instrucciones para el Mecánico:</p>
                        <p className="text-yellow-900">{ot.observacionInicial || 'No se especificó un motivo.'}</p>
                    </div>
                </CardContent>
            </Card>

            {isSupervisorOrAdmin && (
               <Card>
                   <CardHeader><CardTitle className="text-lg">Desglose de Costos</CardTitle></CardHeader>
                   <CardContent className="grid grid-cols-3 gap-4 text-sm">
                       <div className="text-center p-4 border rounded dark:border-slate-800"><strong>Insumos</strong><p className="text-xl font-mono text-cyan-600">${ot.costoInsumos.toLocaleString()}</p></div>
                       <div className="text-center p-4 border rounded dark:border-slate-800"><strong>Mano de Obra (Tareas)</strong><p className="text-xl font-mono text-cyan-600">${ot.costoManoObraTareas.toLocaleString()}</p></div>
                       <div className="text-center p-4 border rounded dark:border-slate-800"><strong>Mano de Obra (HH)</strong><p className="text-xl font-mono text-cyan-600">${ot.costoManoObraHH.toLocaleString()}</p></div>
                       <div className="col-span-3 text-right text-lg font-bold">Total OT: <span className="font-mono text-green-600">${totalCosto.toLocaleString()}</span></div>
                   </CardContent>
               </Card>
            )}

            <div className="flex gap-2">
                <Button variant={activeTab === 'tareas' ? 'default' : 'outline'} onClick={() => setActiveTab('tareas')}>Tareas Realizadas</Button>
                <Button variant={activeTab === 'insumos' ? 'default' : 'outline'} onClick={() => setActiveTab('insumos')}>Insumos y Repuestos</Button>
                <Button variant={activeTab === 'solicitudes' ? 'default' : 'outline'} onClick={() => setActiveTab('solicitudes')}>Solicitudes Bodega</Button>
                <Button variant={activeTab === 'historial' ? 'default' : 'outline'} onClick={() => setActiveTab('historial')}>Historial de la OT</Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {activeTab === 'tareas' && (
                        <div>
                            <div className="flex justify-between items-center mb-4"><h3 className="font-bold">Tareas</h3><Button size="sm" onClick={() => setIsTareaModalOpen(true)}><Plus className="w-4 h-4 mr-2"/>añadir tarea</Button></div>
                            {ot.tareasRealizadas.map(t => <div key={t.id} className="flex justify-between p-2 border-b last:border border-0 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900/50"><span>{t.tarea_estandar?.descripcion || 'Tarea'}</span><span className="font-mono text-slate-600 dark:text-slate-400">${t.costo_real.toLocaleString()}</span></div>)}
                        </div>
                    )}
                    {activeTab === 'insumos' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold">Insumos</h3>
                                <div className="flex gap-2 items-center">
                                    <div className="flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
                                        <select 
                                            className="p-1 px-2 text-sm bg-transparent outline-none dark:text-slate-100 min-w-[150px]"
                                            value={selectedKitToAdd}
                                            onChange={(e) => setSelectedKitToAdd(e.target.value)}
                                        >
                                            <option value="">Seleccionar Kit...</option>
                                            {kitsRepuesto.map(k => (
                                                <option key={k.id} value={k.id}>{k.nombre}</option>
                                            ))}
                                        </select>
                                        <Button size="sm" variant="ghost" onClick={handleCargarKit} disabled={!selectedKitToAdd} className="rounded-none border-l dark:border-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 text-cyan-600">
                                            Cargar Kit
                                        </Button>
                                    </div>
                                    <Button size="sm" onClick={() => setIsInsumoModalOpen(true)}><Plus className="w-4 h-4 mr-2"/>añadir insumo</Button>
                                </div>
                            </div>
                            {ot.insumos.length === 0 && (
                                <p className="text-sm text-slate-500 py-4 text-center border-2 border-dashed rounded-lg dark:border-slate-800">
                                    No hay insumos registrados en esta OT.
                                </p>
                            )}
                            {ot.insumos.map(i => <div key={i.id} className="flex justify-between p-2 border-b last:border border-0 dark:border-slate-800"><span>{i.repuesto?.nombre || 'Insumo'} (x{i.cantidad})</span><span className="font-mono text-slate-600 dark:text-slate-400">${(i.costo_total).toLocaleString()}</span></div>)}
                        </div>
                    )}
                    {activeTab === 'historial' && (
                        <div>
                            <h3 className="font-bold mb-4">Historial</h3>
                            {ot.historial.map(h => <div key={h.id} className="text-sm p-2 border-b last:border border-0 dark:border-slate-800"><span className="font-semibold">{h.usuario_nombre || h.usuario_id || 'Sistema'}</span> - {h.comentario} <span className="text-slate-400 dark:text-slate-500 dark:text-slate-400">({new Date(h.created_at).toLocaleString()})</span></div>)}
                        </div>
                    )}
                    {activeTab === 'solicitudes' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold">Solicitudes de Bodega / Compras Directas</h3>
                                {isMecanico && <Button size="sm" onClick={() => setIsSolicitudModalOpen(true)}><Plus className="w-4 h-4 mr-2"/>Solicitar Repuesto</Button>}
                            </div>
                            {(!ot.solicitudes || ot.solicitudes.length === 0) ? (
                                <p className="text-slate-500 italic">No hay solicitudes registradas.</p>
                            ) : (
                                <div className="space-y-3">
                                   {ot.solicitudes.map(s => (
                                      <div key={s.id} className="flex flex-col md:flex-row justify-between p-3 border rounded-lg dark:border-slate-800">
                                         <div>
                                            <div className="flex items-center gap-2">
                                               <span className="font-semibold">{s.repuesto_nombre} (x{s.cantidad})</span>
                                               <Badge className={s.estado === 'PENDIENTE' ? 'bg-yellow-500' : s.estado === 'APROBADA' ? 'bg-green-600' : 'bg-red-600'}>{s.estado}</Badge>
                                            </div>
                                            <div className="text-sm text-slate-500 mt-1">Solicitado el {new Date(s.fecha_solicitud).toLocaleString()}</div>
                                            {s.motivo_rechazo && <div className="text-sm text-red-500 mt-1">Motivo: {s.motivo_rechazo}</div>}
                                         </div>
                                         {isSupervisorOrAdmin && s.estado === 'PENDIENTE' && (
                                            <div className="flex gap-2 mt-2 md:mt-0 items-center">
                                               <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={() => resolverSolicitud(s.id, 'APROBADA')}>
                                                  <ThumbsUp className="w-4 h-4 mr-1" /> Aprobar
                                               </Button>
                                               <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => { setSolicitudToAprobar(s); setIsAprobarModalOpen(true); }}>
                                                  <ThumbsDown className="w-4 h-4 mr-1" /> Rechazar
                                               </Button>
                                            </div>
                                         )}
                                      </div>
                                   ))}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="space-y-4">
            <AccordionPanel title="Diagnóstico / Evaluación" active={activePanels.diagnostico} onToggle={() => togglePanel('diagnostico')}>
                <textarea className="w-full p-2 border rounded dark:border-slate-800 text-sm dark:bg-slate-800 dark:text-slate-100" placeholder="Ingrese el diagnóstico técnico aquí..." defaultValue={ot.diagnosticoEvaluacion} />
                <Button className="w-full mt-2 bg-cyan-600"><Save className="w-4 h-4 mr-2" />Guardar Diagnóstico</Button>
            </AccordionPanel>

            <AccordionPanel title="Pauta de Mantenimiento" active={false} onToggle={() => {}}>
                <p className="text-sm mb-2">Asociada a: SM3-MINERAL</p>
                <Button className="bg-cyan-500 w-full"><FileDown className="w-4 h-4 mr-2"/> Ver PDF</Button>
            </AccordionPanel>

            <AccordionPanel title="Asignar Personal" active={activePanels.personal} onToggle={() => togglePanel('personal')}>
                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Responsable Principal</p>
                        <p className="text-sm font-semibold p-2 bg-slate-50 dark:bg-slate-900/50 rounded mt-1">{ot.tecnicoResponsable || 'Ninguno'}</p>
                    </div>

                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Cambiar Responsable</p>
                        <select className="w-full p-2 mt-1 border rounded dark:border-slate-800 text-sm dark:bg-slate-800 dark:text-slate-100"><option value="">Seleccionar técnico...</option></select>
                    </div>

                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Personal de Apoyo (Ayudantes)</p>
                        <input type="text" className="w-full p-2 mt-1 border rounded dark:border-slate-800 text-sm dark:bg-slate-800 dark:text-slate-100" placeholder="Buscar ayudantes..." />
                    </div>

                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700">Guardar Asignación</Button>
                </div>
            </AccordionPanel>
            
            <AccordionPanel title="Cambiar Estado" active={activePanels.estado} onToggle={() => togglePanel('estado')}>
                <div className="space-y-4 text-sm">
                    <div>
                        <label className="block text-slate-500 font-bold mb-1">Nuevo Estado</label>
                        <select 
                            className="w-full p-2 border rounded dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
                            value={nuevoEstado}
                            onChange={(e) => setNuevoEstado(e.target.value)}
                        >
                            <option value="ABIERTA">ABIERTA</option>
                            <option value="EN_PROCESO">EN PROCESO</option>
                            <option value="PAUSADA">PAUSADA</option>
                            <option value="FINALIZADA">FINALIZADA</option>
                        </select>
                    </div>

                    {nuevoEstado === 'FINALIZADA' && (
                        <div className="bg-green-50 dark:bg-green-900/10 p-4 border border-green-200 dark:border-green-900/30 rounded">
                            <p className="text-green-700 dark:text-green-400 font-bold mb-2">Obligatorio para Cierre</p>
                            <label className="block text-slate-700 dark:text-slate-300 mb-1">Kilometraje de Cierre (Tablero)</label>
                            <input 
                                type="number" 
                                className="w-full p-2 border rounded dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
                                value={kmCierre}
                                onChange={(e) => setKmCierre(e.target.value)}
                                placeholder="Ej: 154000"
                            />
                            <p className="text-xs text-green-600 dark:text-green-500 mt-2">Este valor actualizará automáticamente el odómetro del vehículo y reiniciará el ciclo en la Pizarra de Mantenimiento.</p>
                        </div>
                    )}

                    <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={handleActualizarEstado}
                        disabled={isUpdatingDb}
                    >
                        {isUpdatingDb ? 'Guardando...' : 'Actualizar Estado'}
                    </Button>
                </div>
            </AccordionPanel>
        </div>
      </div>

      <Modal isOpen={isTareaModalOpen} onClose={() => setIsTareaModalOpen(false)} title="Seleccionar Tarea Estándar">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 mt-4">
          {tareasEstandar.map(t => (
            <div key={t.id} className="flex justify-between items-center p-3 border rounded-lg dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
               <div>
                  <p className="font-semibold text-sm">{t.descripcion}</p>
                  <p className="text-xs text-slate-500">{t.tiempoEstandarMinutos} min | Valor: ${t.costoManoObra.toLocaleString()}</p>
               </div>
               <Button size="sm" onClick={() => agregarTarea(t)} className="bg-cyan-600">Añadir</Button>
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={isSolicitudModalOpen} onClose={() => setIsSolicitudModalOpen(false)} title="Nueva Solicitud de Repuesto">
         <div className="space-y-4">
            <div>
               <label className="block text-sm font-medium mb-1">Nombre o Descripción del Repuesto / Compra</label>
               <input type="text" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700" value={nuevaSolicitud.repuesto_nombre} onChange={e => setNuevaSolicitud({...nuevaSolicitud, repuesto_nombre: e.target.value})} placeholder="Ej: Bujías NGK Iridium" />
            </div>
            <div>
               <label className="block text-sm font-medium mb-1">Cantidad Necesaria</label>
               <input type="number" min="1" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700" value={nuevaSolicitud.cantidad} onChange={e => setNuevaSolicitud({...nuevaSolicitud, cantidad: Number(e.target.value)})} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
               <Button variant="outline" onClick={() => setIsSolicitudModalOpen(false)}>Cancelar</Button>
               <Button onClick={crearSolicitud} disabled={!nuevaSolicitud.repuesto_nombre} className="bg-cyan-600">Enviar Solicitud</Button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={isAprobarModalOpen} onClose={() => setIsAprobarModalOpen(false)} title="Rechazar Solicitud">
         <div className="space-y-4">
            <p>Se rechazará la solicitud de: <strong>{solicitudToAprobar?.repuesto_nombre}</strong></p>
            <div>
               <label className="block text-sm font-medium mb-1">Motivo del rechazo (Obligatorio)</label>
               <input type="text" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700" value={motivoRechazo} onChange={e => setMotivoRechazo(e.target.value)} placeholder="Ej: No hay stock, excede presupuesto..." />
            </div>
            <div className="flex justify-end gap-2 mt-4">
               <Button variant="outline" onClick={() => setIsAprobarModalOpen(false)}>Cancelar</Button>
               <Button onClick={() => resolverSolicitud(solicitudToAprobar?.id, 'RECHAZADA')} disabled={!motivoRechazo} className="bg-red-600 hover:bg-red-700 text-white">Rechazar Solicitud</Button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={isInsumoModalOpen} onClose={() => setIsInsumoModalOpen(false)} title="Buscar Repuesto en Inventario">
        <div className="mt-4">
          <div className="relative mb-4">
            <input 
              type="text" 
              placeholder="Buscar por nombre o número de parte..." 
              value={insumoSearch}
              onChange={(e) => setInsumoSearch(e.target.value)}
              className="w-full border rounded-lg p-2 pl-3 dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-1 focus:ring-cyan-500" 
            />
          </div>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
            {filteredInsumos.length > 0 ? filteredInsumos.map(i => (
               <div key={i.id} className="flex justify-between items-center p-3 border rounded-lg dark:border-slate-700">
                  <div>
                    <p className="font-bold text-sm uppercase">{i.nombre}</p>
                    <p className="text-xs text-slate-500">SKU: {i.sku} | Stock: <span className="text-emerald-500 font-semibold">{i.stock} disponibles ✓</span></p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input type="number" defaultValue={1} min={1} className="w-16 border rounded p-1 text-center text-sm dark:bg-slate-800 dark:border-slate-700" />
                    <Button size="sm" className="bg-[#0cf]" onClick={() => agregarInsumo(i)}>Añadir</Button>
                  </div>
               </div>
            )) : (
              <p className="text-center text-slate-500 text-sm mt-8">Los resultados aparecerán aquí.</p>
            )}
          </div>
          <div className="flex justify-end mt-4">
             <Button variant="ghost" onClick={() => setIsInsumoModalOpen(false)}>Cerrar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AccordionPanel({ title, active, onToggle, children }: any) {
  return (
    <Card>
      <CardHeader className="cursor-pointer flex flex-row justify-between items-center p-4 border-b dark:border-slate-800" onClick={onToggle}>
        <CardTitle className="text-base">{title}</CardTitle>
        {active ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
      </CardHeader>
      {active && <CardContent className="p-4">{children}</CardContent>}
    </Card>
  );
}
