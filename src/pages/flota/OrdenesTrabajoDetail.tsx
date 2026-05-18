import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ArrowLeft, Edit, Printer, Clock, Wrench, Boxes, History, ChevronDown, ChevronUp, Save, Trash2, Plus, FileText, CheckCircle, FileDown, Search } from 'lucide-react';

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
  const { ordenesTrabajo, vehiculos, kitsRepuesto, tareasEstandar, actualizarOrdenTrabajo } = useAppContext();
  const [activeTab, setActiveTab] = useState<'tareas' | 'insumos' | 'historial'>('tareas');
  const [activePanels, setActivePanels] = useState<Record<string, boolean>>({ diagnostico: false, pauta: false, personal: false, estado: false });
  const [selectedKitToAdd, setSelectedKitToAdd] = useState('');
  
  const [isTareaModalOpen, setIsTareaModalOpen] = useState(false);
  const [isInsumoModalOpen, setIsInsumoModalOpen] = useState(false);
  const [insumoSearch, setInsumoSearch] = useState('');
  
  const ot = ordenesTrabajo.find(o => o.id === id || o.folio === id);
  const vehiculo = vehiculos.find(v => v.id === ot?.vehiculoId);

  if (!ot) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">OT no encontrada</div>;

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
          descripcion: `Agregado Kit de repuestos: ${kit.nombre}`,
          fechaEvento: new Date().toISOString(),
          usuario: 'Sistema/Admin'
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
        { id: Math.random().toString(36).substr(2, 9), descripcion: tarea.descripcion, costoBase: tarea.costoManoObra }
      ],
      costoManoObraTareas: ot.costoManoObraTareas + tarea.costoManoObra
    });
    setIsTareaModalOpen(false);
  };

  const agregarInsumo = (repuesto: any) => {
    if (!ot) return;
    const existe = ot.insumos.find(i => i.nombre === repuesto.nombre);
    
    let nuevosInsumos = [];
    if (existe) {
      nuevosInsumos = ot.insumos.map(i => i.nombre === repuesto.nombre ? { ...i, cantidad: i.cantidad + 1 } : i);
    } else {
      nuevosInsumos = [...ot.insumos, { id: Math.random().toString(36).substr(2, 9), nombre: repuesto.nombre, cantidad: 1, precioUnitario: 15000 }];
    }

    actualizarOrdenTrabajo({
      ...ot,
      insumos: nuevosInsumos,
      costoInsumos: ot.costoInsumos + 15000
    });
  };

  const filteredInsumos = sumInsumosData.filter(i => i.nombre.toLowerCase().includes(insumoSearch.toLowerCase()) || i.sku.toLowerCase().includes(insumoSearch.toLowerCase()));

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border dark:border-slate-800">
        <Button variant="ghost" onClick={() => navigate('/flota/ordenes-trabajo')}><ArrowLeft className="w-4 h-4 mr-2" />Volver al listado</Button>
        <h1 className="text-xl font-bold">Orden de Trabajo #{ot.folio} <Badge className="ml-2 bg-green-600 text-white">{ot.estado.replace('_', ' ')}</Badge></h1>
        <div className="flex gap-2 font-bold">
            {ot.tipo === 'INSPECCION' && (
              <Button onClick={() => navigate('/flota/neumaticos?tab=inspeccion')} className="bg-purple-600 hover:bg-purple-700 text-white">
                <FileText className="w-4 h-4 mr-2" /> Realizar Inspección
              </Button>
            )}
            <span className="flex items-center text-slate-600 dark:text-slate-400 mr-4"><Clock className="w-4 h-4 mr-1"/> Tiempo trabajado: {new Date(ot.tiempoTrabajadoSegundos * 1000).toISOString().substr(11, 8)}</span>
            <Button variant="outline"><Edit className="w-4 h-4 mr-2" />Editar OT</Button>
            <Button variant="outline"><CheckCircle className="w-4 h-4 mr-2" />Firmar Certificado</Button>
            <Button variant="outline"><Printer className="w-4 h-4 mr-2" />Imprimir OT</Button>
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

            <Card>
                <CardHeader><CardTitle className="text-lg">Desglose de Costos</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-4 border rounded dark:border-slate-800"><strong>Insumos</strong><p className="text-xl font-mono text-cyan-600">${ot.costoInsumos.toLocaleString()}</p></div>
                    <div className="text-center p-4 border rounded dark:border-slate-800"><strong>Mano de Obra (Tareas)</strong><p className="text-xl font-mono text-cyan-600">${ot.costoManoObraTareas.toLocaleString()}</p></div>
                    <div className="text-center p-4 border rounded dark:border-slate-800"><strong>Mano de Obra (HH)</strong><p className="text-xl font-mono text-cyan-600">${ot.costoManoObraHH.toLocaleString()}</p></div>
                    <div className="col-span-3 text-right text-lg font-bold">Total OT: <span className="font-mono text-green-600">${totalCosto.toLocaleString()}</span></div>
                </CardContent>
            </Card>

            <div className="flex gap-2">
                <Button variant={activeTab === 'tareas' ? 'default' : 'outline'} onClick={() => setActiveTab('tareas')}>Tareas Realizadas</Button>
                <Button variant={activeTab === 'insumos' ? 'default' : 'outline'} onClick={() => setActiveTab('insumos')}>Insumos y Repuestos</Button>
                <Button variant={activeTab === 'historial' ? 'default' : 'outline'} onClick={() => setActiveTab('historial')}>Historial de la OT</Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {activeTab === 'tareas' && (
                        <div>
                            <div className="flex justify-between items-center mb-4"><h3 className="font-bold">Tareas</h3><Button size="sm" onClick={() => setIsTareaModalOpen(true)}><Plus className="w-4 h-4 mr-2"/>añadir tarea</Button></div>
                            {ot.tareasRealizadas.map(t => <div key={t.id} className="flex justify-between p-2 border-b last:border border-0 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900/50"><span>{t.descripcion}</span><span className="font-mono text-slate-600 dark:text-slate-400">${t.costoBase.toLocaleString()}</span></div>)}
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
                            {ot.insumos.map(i => <div key={i.id} className="flex justify-between p-2 border-b last:border border-0 dark:border-slate-800"><span>{i.nombre} (x{i.cantidad})</span><span className="font-mono text-slate-600 dark:text-slate-400">${(i.precioUnitario * i.cantidad).toLocaleString()}</span></div>)}
                        </div>
                    )}
                    {activeTab === 'historial' && (
                        <div>
                            <h3 className="font-bold mb-4">Historial</h3>
                            {ot.historial.map(h => <div key={h.id} className="text-sm p-2 border-b last:border border-0 dark:border-slate-800"><span className="font-semibold">{h.usuario}</span> - {h.descripcion} <span className="text-slate-400 dark:text-slate-500 dark:text-slate-400">({new Date(h.fechaEvento).toLocaleString()})</span></div>)}
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
            
            <AccordionPanel title="Cambiar Estado (Admin)" active={activePanels.estado} onToggle={() => togglePanel('estado')}>
                <select className="w-full p-2 border rounded dark:border-slate-800 text-sm dark:bg-slate-800 dark:text-slate-100"><option>{ot.estado}</option></select>
                <Button className="w-full mt-2 bg-blue-50 dark:bg-blue-900/300">Actualizar Estado</Button>
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
