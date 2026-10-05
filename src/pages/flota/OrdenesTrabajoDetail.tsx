import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { CrearTareaModal } from '../../components/flota/CrearTareaModal';
import { ArrowLeft, Edit, Printer, Clock, Wrench, Boxes, History, ChevronDown, ChevronUp, Save, Trash2, Plus, FileText, CheckCircle, FileDown, Search, AlertCircle, PenTool, ThumbsUp, ThumbsDown, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePermissions } from '../../hooks/usePermissions';
import { FormularioInspeccion } from './GestionNeumaticos';
import { OrdenDeTrabajo } from '../../types';

export default function OrdenesTrabajoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ordenesTrabajo, vehiculos, kitsRepuesto, tareasEstandar, repuestos, personal, pautas, actualizarOrdenTrabajo, agregarTareaEstandar } = useAppContext();
  const { profile } = useAuth();
  const { activeCompanyId } = useCompany();
  const [empresaLogo, setEmpresaLogo] = useState<string | null>(null);

  useEffect(() => {
    if (activeCompanyId) {
      supabase.from('empresa').select('detalles').eq('id', activeCompanyId).single().then(({ data }) => {
        if (data?.detalles?.logo_url) {
          setEmpresaLogo(data.detalles.logo_url);
        }
      });
    }
  }, [activeCompanyId]);
  
  const { hasPermission } = usePermissions();
  // Solo el dueño del sistema tiene acceso total por defecto. Los demás se rigen por los permisos configurables.
  const isSaaSAdmin = profile?.rol?.nombre === 'Súper Administrador';
  
  const canViewCostos = isSaaSAdmin || hasPermission('Reportes y Finanzas:Ver Costos');
  const canManageTareas = isSaaSAdmin || hasPermission('Módulo de Mantenimiento:Gestionar Tareas OT');
  const canManageInsumos = isSaaSAdmin || hasPermission('Módulo de Mantenimiento:Gestionar Insumos OT');
  const canAssignPersonal = isSaaSAdmin || hasPermission('Módulo de Mantenimiento:Asignar Personal OT');
  const canForceState = isSaaSAdmin || hasPermission('Módulo de Mantenimiento:Forzar Cambio Estado OT');
  const canManageRequests = isSaaSAdmin || hasPermission('Módulo de Mantenimiento:Aprobar Solicitudes Repuestos');

  const [activeTab, setActiveTab] = useState<'tareas' | 'insumos' | 'historial' | 'solicitudes'>('tareas');
  const [activePanels, setActivePanels] = useState<Record<string, boolean>>({ diagnostico: false, pauta: false, personal: false, estado: false });
  const [selectedKitToAdd, setSelectedKitToAdd] = useState('');
  const [selectedTecnico, setSelectedTecnico] = useState('');
  const [isInspeccionModalOpen, setIsInspeccionModalOpen] = useState(false);

  const [isTareaModalOpen, setIsTareaModalOpen] = useState(false);
  const [isCrearTareaModalOpen, setIsCrearTareaModalOpen] = useState(false);
  const [tareaSearch, setTareaSearch] = useState('');
  const [isInsumoModalOpen, setIsInsumoModalOpen] = useState(false);
  const [insumoSearch, setInsumoSearch] = useState('');
  const [insumoQuantities, setInsumoQuantities] = useState<Record<string, number>>({});

  const [isSolicitudModalOpen, setIsSolicitudModalOpen] = useState(false);
  const [nuevaSolicitud, setNuevaSolicitud] = useState({ repuesto_nombre: '', cantidad: 1 });
  const [isAprobarModalOpen, setIsAprobarModalOpen] = useState(false);
  const [solicitudToAprobar, setSolicitudToAprobar] = useState<any>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  
  const [firmaURL, setFirmaURL] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [personalTemporal, setPersonalTemporal] = useState('');

  const otFromContext = ordenesTrabajo.find(o => o.id === id || o.folio === id);
  const [asyncOt, setAsyncOt] = useState<OrdenDeTrabajo | null>(null);
  const [loadingOt, setLoadingOt] = useState(!otFromContext);
  const ot = otFromContext || asyncOt;

  useEffect(() => {
    if (otFromContext || !id) {
      setLoadingOt(false);
      return;
    }

    let isMounted = true;
    setLoadingOt(true);

    const loadMissingOt = async () => {
      // 1. Caso ID de Línea Base virtual: "ot-base-..."
      if (id.startsWith('ot-base-')) {
        const vehId = id.replace('ot-base-', '');
        let veh = vehiculos.find(v => String(v.id) === String(vehId));
        if (!veh) {
          const { data } = await supabase.from('vehiculo').select('*').eq('id', vehId).maybeSingle();
          if (data) {
            veh = {
              id: data.id,
              patente: data.patente || data.numero_interno || 'Sin Patente',
              modelo: data.modelo || '',
              marca: data.marca || '',
              ano: data.anio || '',
              vin: data.vin || data.chasis || '',
              kmUltimaMantencion: data.km_ultima_mantencion || 0,
              tipoUltimoMant: data.tipo_ultimo_mant || ''
            } as any;
          }
        }

        if (veh && isMounted) {
          const rawKm = Number((veh as any).kmUltimaMantencion || (veh as any).km_ultima_mantencion || 0);
          const rawFecha = (veh as any).fechaUltimaMantencion || (veh as any).fecha_ultima_mantencion || new Date().toISOString();
          const pautaNombre = (veh as any).tipoUltimoMant || (veh as any).tipoUltimaPauta || (veh as any).tipo_ultimo_mant || 'Mantenimiento Preventivo Inicial';

          const baselineOt: OrdenDeTrabajo = {
            id: id,
            folio: `OT-INI-${(veh as any).numeroInterno || (veh as any).numero_interno || veh.patente || '01'}`,
            empresa_id: activeCompanyId || '',
            empresaId: activeCompanyId || '',
            vehiculoId: veh.id,
            tipo: 'PREVENTIVA',
            estado: 'FINALIZADA',
            prioridad: 'MEDIA',
            kilometrajeApertura: rawKm,
            kilometrajeCierre: rawKm,
            fechaCreacion: typeof rawFecha === 'string' ? rawFecha : new Date(rawFecha).toISOString(),
            fechaProgramada: typeof rawFecha === 'string' ? rawFecha : new Date(rawFecha).toISOString(),
            inicio_proceso: typeof rawFecha === 'string' ? rawFecha : new Date(rawFecha).toISOString(),
            termino_proceso: typeof rawFecha === 'string' ? rawFecha : new Date(rawFecha).toISOString(),
            pauta: pautaNombre,
            observacionInicial: `Línea Base: Mantención registrada a los ${rawKm.toLocaleString('es-CL')} km.`,
            observaciones: 'Orden de trabajo inicial generada automáticamente para trazabilidad y línea base histórica.',
            costoInsumos: 0,
            costoManoObraHH: 0,
            costoManoObraTareas: 0,
            tiempoTrabajadoSegundos: 0,
            tareasRealizadas: [],
            insumos: [],
            historial: [],
            solicitudes: []
          };
          setAsyncOt(baselineOt);
        }
        if (isMounted) setLoadingOt(false);
        return;
      }

      // 2. Caso normal: consultar directamente a Supabase
      try {
        const { data: row } = await supabase
          .from('orden_de_trabajo')
          .select('*')
          .or(`id.eq.${id},folio.eq.${id}`)
          .maybeSingle();

        if (row && isMounted) {
          const [tareasRes, insumosRes, histRes, solRes] = await Promise.all([
            supabase.from('ot_tareas_realizadas').select('*').eq('orden_id', row.id),
            supabase.from('detalle_insumo_ot').select('*').eq('orden_id', row.id),
            supabase.from('historial_ot').select('*').eq('orden_id', row.id).order('created_at', { ascending: true }),
            supabase.from('solicitud_repuesto_ot').select('*').eq('orden_id', row.id).order('created_at', { ascending: true })
          ]);

          const loadedOt: OrdenDeTrabajo = {
            id: row.id,
            folio: row.folio,
            empresa_id: row.empresa_id,
            empresaId: row.empresa_id,
            vehiculoId: row.vehiculo_id,
            tecnicoResponsable: row.tecnico_responsable || undefined,
            responsable_id: row.responsable_id || undefined,
            tecnico_tipo: row.tecnico_tipo || undefined,
            externo_nombre: row.externo_nombre || undefined,
            externo_especialidad: row.externo_especialidad || undefined,
            externo_intervencion: row.externo_intervencion || undefined,
            tipo: row.tipo as any,
            estado: row.estado as any,
            prioridad: row.prioridad as any,
            inicio_proceso: row.inicio_proceso || undefined,
            kilometrajeApertura: Number(row.kilometraje_apertura || 0),
            kilometrajeCierre: row.kilometraje_cierre ? Number(row.kilometraje_cierre) : undefined,
            fechaCreacion: row.fecha_creacion,
            fechaProgramada: row.fecha_programada || undefined,
            horaInicioProgramada: row.hora_inicio_programada || undefined,
            horaTerminoProgramada: row.hora_termino_programada || undefined,
            observacionInicial: row.observacion_inicial || undefined,
            diagnosticoEvaluacion: row.diagnostico_evaluacion || undefined,
            pauta: row.pauta || undefined,
            pauta_mantenimiento_id: row.pauta_mantenimiento_id || undefined,
            kitRepuestos: row.kit_repuestos || undefined,
            tipoFalla: row.tipo_falla || undefined,
            sintomas: row.sintomas || undefined,
            inspeccionTrenMotriz: row.inspeccion_tren_motriz || undefined,
            eje: row.eje || undefined,
            presionNeumatico: row.presion_neumatico ? Number(row.presion_neumatico) : undefined,
            personalOperativo: row.personal_operativo || undefined,
            proveedor: row.proveedor || undefined,
            empresaExterna: row.empresa_externa || undefined,
            rutEmpresa: row.rut_empresa || undefined,
            valorHH: row.valor_hh ? Number(row.valor_hh) : undefined,
            presupuestoAprobado: row.presupuesto_aprobado ? Number(row.presupuesto_aprobado) : undefined,
            observaciones: row.observaciones || undefined,
            costoInsumos: Number(row.costo_insumos || 0),
            costoManoObraTareas: Number(row.costo_mano_obra_tareas || 0),
            costoManoObraHH: Number(row.costo_mano_obra_hh || 0),
            tiempoTrabajadoSegundos: Number(row.tiempo_trabajado_segundos || 0),
            tareasRealizadas: (tareasRes.data || []).map((t: any) => ({
              id: t.id,
              orden_id: t.orden_id,
              tarea_estandar_id: t.tarea_estandar_id,
              tiempo_real_minutos: Number(t.tiempo_real_minutos || 0),
              costo_real: Number(t.costo_real || 0),
              tarea_estandar: t.tarea_estandar || {
                id: t.tarea_estandar_id,
                descripcion: 'Tarea',
                costoManoObra: Number(t.costo_real || 0)
              }
            })),
            insumos: (insumosRes.data || []).map((i: any) => ({
              id: i.id,
              orden_id: i.orden_id,
              repuesto_id: i.repuesto_id,
              cantidad: Number(i.cantidad || 0),
              costo_unitario_aplicado: Number(i.costo_unitario_aplicado || i.costo_unitario || 0),
              costo_total: Number(i.costo_total || 0),
              repuesto: i.repuesto || {
                id: i.repuesto_id,
                nombre: 'Repuesto/Insumo',
                costo_unitario: Number(i.costo_unitario_aplicado || 0)
              }
            })),
            historial: (histRes.data || []).map((h: any) => ({
              id: h.id,
              orden_id: h.orden_id,
              usuario_nombre: h.usuario_nombre || 'Sistema',
              comentario: h.comentario || '',
              created_at: h.created_at || new Date().toISOString()
            })),
            solicitudes: (solRes.data || []).map((s: any) => ({
              id: s.id,
              orden_id: s.orden_id,
              repuesto_id: s.repuesto_id,
              repuesto_nombre: s.repuesto_nombre,
              cantidad: Number(s.cantidad || 0),
              estado: s.estado || 'PENDIENTE',
              fecha_solicitud: s.fecha_solicitud || s.created_at || new Date().toISOString(),
              created_at: s.created_at || new Date().toISOString(),
              usuario_nombre: s.usuario_nombre || 'Mecánico',
              motivo_rechazo: s.motivo_rechazo || ''
            }))
          };

          setAsyncOt(loadedOt);
        }
      } catch (err) {
        console.warn("Aviso al consultar OT directamente en BD:", err);
      } finally {
        if (isMounted) setLoadingOt(false);
      }
    };

    loadMissingOt();

    return () => {
      isMounted = false;
    };
  }, [id, otFromContext, activeCompanyId, vehiculos]);

  React.useEffect(() => {
    if (ot) {
      setSelectedTecnico(ot.tecnicoResponsable || '');
      setPersonalTemporal(ot.personalOperativo || '');
      setNuevoEstado(ot.estado || 'ABIERTA');
      setKmCierre(ot.kilometrajeCierre ? ot.kilometrajeCierre.toString() : '');
      setSelectedTipoTecnico(ot.tecnico_tipo || 'INTERNO');
      setExternoNombre(ot.externo_nombre || '');
      setExternoEspecialidad(ot.externo_especialidad || '');
      setExternoIntervencion(ot.externo_intervencion || '');
    }
  }, [ot]);

  const vehiculo = vehiculos.find(v => String(v.id) === String(ot?.vehiculoId));

  const filteredPautas = (pautas || []).filter(p => {
    if (!vehiculo?.modelo) return true;
    const pautaModelo = (p.modeloVehiculo || '').toLowerCase();
    if (!pautaModelo || pautaModelo === 'general' || pautaModelo === 'todos') return true;
    return vehiculo.modelo.toLowerCase().includes(pautaModelo) || pautaModelo.includes(vehiculo.modelo.toLowerCase());
  });

  const [nuevoEstado, setNuevoEstado] = useState(ot?.estado || 'ABIERTA');
  const [kmCierre, setKmCierre] = useState(ot?.kilometrajeCierre?.toString() || '');
  const [isUpdatingDb, setIsUpdatingDb] = useState(false);

  const [isPautaModalOpen, setIsPautaModalOpen] = useState(false);
  const [infoView, setInfoView] = useState<'info' | 'costos'>('info');
  
  // External worker state
  const [selectedTipoTecnico, setSelectedTipoTecnico] = useState<'INTERNO' | 'EXTERNO'>(ot?.tecnico_tipo || 'INTERNO');
  const [externoNombre, setExternoNombre] = useState(ot?.externo_nombre || '');
  const [externoEspecialidad, setExternoEspecialidad] = useState(ot?.externo_especialidad || '');
  const [externoIntervencion, setExternoIntervencion] = useState(ot?.externo_intervencion || '');

    const [isPausaModalOpen, setIsPausaModalOpen] = useState(false);
    const [tiposPausa, setTiposPausa] = useState<any[]>([]);
    const [motivoPausaSeleccionado, setMotivoPausaSeleccionado] = useState('');

    React.useEffect(() => {
        const fetchPausas = async () => {
            const { data } = await supabase.from('tipo_pausa').select('*').eq('estado', 'Activo');
            if (data) setTiposPausa(data);
        };
        fetchPausas();
    }, []);

    const [timerDisplay, setTimerDisplay] = useState(ot?.tiempoTrabajadoSegundos || 0);

    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (ot?.estado === 'EN_PROCESO') {
            interval = setInterval(() => {
                if (ot?.inicio_proceso) {
                    const elapsedTime = Math.floor((Date.now() - new Date(ot.inicio_proceso).getTime()) / 1000);
                    setTimerDisplay((ot.tiempoTrabajadoSegundos || 0) + elapsedTime);
                } else {
                    setTimerDisplay(prev => prev + 1);
                }
            }, 1000);
        } else {
            setTimerDisplay(ot?.tiempoTrabajadoSegundos || 0);
        }
        return () => clearInterval(interval);
    }, [ot?.estado, ot?.tiempoTrabajadoSegundos, ot?.inicio_proceso]);

    const handleActualizarEstadoRapido = async (estadoStr: string, pausaInfo?: { id: string, nombre: string }, kmForzado?: number) => {
        if (!ot) return;
        const updates: any = { estado: estadoStr as any };
        const now = new Date().toISOString();

        if (estadoStr === 'EN_PROCESO') {
            updates.inicio_proceso = now;
        }
        if (estadoStr === 'PAUSADA' || estadoStr === 'FINALIZADA' || estadoStr === 'CERRADA_POR_MECANICO') {
            updates.tiempoTrabajadoSegundos = timerDisplay;
        }
        if (estadoStr === 'FINALIZADA' || estadoStr === 'CERRADA_POR_MECANICO') {
            updates.termino_proceso = now;
            
            let kmVal = kmForzado;
            if (kmVal === undefined) {
                let kmIngresado: string | null = null;
                if (estadoStr === 'CERRADA_POR_MECANICO') {
                    kmIngresado = window.prompt('Por favor ingrese el Kilometraje de Cierre actual del vehículo:');
                } else {
                    kmIngresado = kmCierre; // if called quickly, though UI shouldn't allow it without prompt
                    if (!kmIngresado) kmIngresado = window.prompt('Por favor ingrese el Kilometraje de Cierre actual del vehículo:');
                }
                kmVal = Number(kmIngresado);
            }
            
            if (isNaN(kmVal) || kmVal <= 0) {
                 alert('Debe ingresar un kilometraje válido para poder cerrar la OT.');
                 return;
            }
            if (kmVal < (ot.kilometrajeApertura || 0)) {
                 alert('El Kilometraje de Cierre no puede ser menor al Kilometraje de Apertura de la OT.');
                 return;
            }
            updates.kilometrajeCierre = kmVal;
            // The Supabase trigger 'procesar_cierre_ot' will handle the Vehicle updating properly.
        }

        let comentario = `Cambio de estado a ${estadoStr}`;
        if (estadoStr === 'EN_PROCESO') comentario += ' (Trabajo Iniciado)';
        if (estadoStr === 'PAUSADA' && pausaInfo) comentario += ` - Motivo: ${pausaInfo.nombre}`;

        setIsUpdatingDb(true);
        try {
            await actualizarOrdenTrabajo({
                ...ot,
                ...updates,
                pausa_id: pausaInfo ? pausaInfo.id : undefined,
                historial: [
                    ...ot.historial,
                    {
                        id: Math.random().toString(36).substr(2, 9),
                        orden_id: ot.id,
                        comentario: comentario,
                        created_at: now,
                        estado_nuevo: estadoStr,
                        usuario_nombre: profile?.nombre || 'General'
                    }
                ]
            });
            if (estadoStr === 'FINALIZADA' || estadoStr === 'CERRADA_POR_MECANICO') {
                alert(`OT ${estadoStr} con éxito. La Pizarra de Mantenimiento se actualizó.`);
            }
        } catch (e) {
             console.error("Error updating OT state:", e);
        } finally {
            setIsUpdatingDb(false);
            setNuevoEstado(estadoStr);
        }
    };

    const confirmarPausa = () => {
        const pausaSeleccionada = tiposPausa.find(p => p.id === motivoPausaSeleccionado);
        if (!pausaSeleccionada) return alert("Seleccione un motivo de pausa");
        handleActualizarEstadoRapido('PAUSADA', { id: pausaSeleccionada.id, nombre: pausaSeleccionada.nombre });
        setIsPausaModalOpen(false);
        setMotivoPausaSeleccionado('');
    };

    const handleGuardarDiagnostico = async () => {
        if (!ot) return;
        const textarea = document.getElementById('diag-textarea') as HTMLTextAreaElement;
        const text = textarea ? textarea.value : '';
        actualizarOrdenTrabajo({
            ...ot,
            diagnosticoEvaluacion: text,
            historial: [
                ...ot.historial,
                {
                    id: Math.random().toString(36).substr(2, 9),
                    orden_id: ot.id,
                    comentario: `Diagnóstico actualizado: ${text}`,
                    created_at: new Date().toISOString(),
                    usuario_nombre: profile?.nombre || 'Sistema'
                }
            ]
        });
        alert('Diagnóstico guardado correctamente');
        togglePanel('diagnostico');
    };

    if (loadingOt) {
      return (
        <div className="flex flex-col items-center justify-center p-16 space-y-4">
          <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Cargando orden de trabajo...</p>
        </div>
      );
    }

    if (!ot) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">OT no encontrada</div>;

    const handleActualizarEstado = async () => {

    if (!ot) return;
    if (nuevoEstado === 'PAUSADA') {
        setIsPausaModalOpen(true);
        return;
    }
    if (nuevoEstado === 'FINALIZADA' || nuevoEstado === 'CERRADA_POR_MECANICO') {
        let kmVal = Number(kmCierre);
        if (nuevoEstado === 'CERRADA_POR_MECANICO') {
             // For Admin dropdown as well:
             Swal.fire({
                 title: 'Confirmar Cierre',
                 text: 'Al cerrar la OT, se enviará una notificación para revisión. Por favor ingrese el kilometraje actual del vehículo:',
                 icon: 'warning',
                 input: 'number',
                 inputAttributes: {
                     min: (ot.kilometrajeApertura || 0).toString(),
                     step: '1'
                 },
                 showCancelButton: true,
                 confirmButtonColor: '#9333ea',
                 cancelButtonColor: '#64748b',
                 confirmButtonText: 'Sí, Cerrar OT',
                 cancelButtonText: 'Cancelar',
                 inputValidator: (value) => {
                     if (!value || isNaN(Number(value))) return 'Debe ingresar un kilometraje válido.';
                     if (Number(value) < (ot.kilometrajeApertura || 0)) return 'El kilometraje no puede ser menor al de apertura.';
                     return null;
                 }
             }).then((result) => {
                 if (result.isConfirmed) {
                     handleActualizarEstadoRapido('CERRADA_POR_MECANICO', undefined, Number(result.value))
                 }
             })
             return; // hand everything off to the rapid updater
        } else {
             if (!kmCierre || isNaN(kmVal) || kmVal <= 0) {
                 alert('Debe ingresar un Kilometraje de Cierre válido para finalizar la OT.');
                 return;
             }
        }

        if (kmVal < (ot.kilometrajeApertura || 0)) {
            alert('El Kilometraje de Cierre no puede ser menor al Kilometraje de Apertura de la OT.');
            return;
        }

        setIsUpdatingDb(true);
        try {
            // Continuar con actualizacion en AppContext para UI y Backend
            // Nota: Se delega a Supabase Trigger / Lógica central la transacción 
            // de vehículo e inventario
            const now = new Date().toISOString();
            await actualizarOrdenTrabajo({
                ...ot,
                estado: nuevoEstado as any,
                kilometrajeCierre: kmVal,
                tiempoTrabajadoSegundos: (nuevoEstado === 'PAUSADA' || nuevoEstado === 'FINALIZADA' || nuevoEstado === 'CERRADA_POR_MECANICO') ? timerDisplay : ot.tiempoTrabajadoSegundos,
                inicio_proceso: nuevoEstado === 'EN_PROCESO' ? now : ot.inicio_proceso,
                termino_proceso: now,
                historial: [
                    ...ot.historial,
                    {
                        id: Math.random().toString(36).substr(2, 9),
                        orden_id: ot.id,
                        comentario: `Cierre de OT a los ${kmVal} km`,
                        created_at: now,
                        estado_nuevo: nuevoEstado,
                        usuario_nombre: profile?.nombre || 'Taller'
                    }
                ]
            });
            alert('OT Finalizada con éxito. La Pizarra de Mantenimiento se ha actualizado.');
        } catch (error) {
            console.error('Error finalizando OT:', error);
            alert('Hubo un error al cerrar la OT.');
        } finally {
            setIsUpdatingDb(false);
            setNuevoEstado(nuevoEstado);
        }
    } else {
        // Just state update
        actualizarOrdenTrabajo({
            ...ot,
            estado: nuevoEstado as any,
            tiempoTrabajadoSegundos: (nuevoEstado === 'PAUSADA' || nuevoEstado === 'FINALIZADA' || nuevoEstado === 'CERRADA_POR_MECANICO') ? timerDisplay : ot.tiempoTrabajadoSegundos,
            inicio_proceso: nuevoEstado === 'EN_PROCESO' ? new Date().toISOString() : ot.inicio_proceso,
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

  const handleGuardarAsignacion = async () => {
    if (!ot) return;
    setIsUpdatingDb(true);
    let comentarios = [];
    if (selectedTipoTecnico === 'INTERNO') {
        if (selectedTecnico) {
           comentarios.push(`Responsable: ${selectedTecnico}`);
        }
        if (personalTemporal && personalTemporal !== ot.personalOperativo) {
           comentarios.push(`Apoyos: ${personalTemporal}`);
        }
    } else {
        comentarios.push(`Responsable Externo: ${externoNombre || 'No especificado'}`);
    }

    try {
      await actualizarOrdenTrabajo({
        ...ot,
        tecnico_tipo: selectedTipoTecnico,
        externo_nombre: externoNombre,
        externo_especialidad: externoEspecialidad,
        externo_intervencion: externoIntervencion,
        tecnicoResponsable: selectedTipoTecnico === 'INTERNO' ? (selectedTecnico || ot.tecnicoResponsable) : undefined,
        personalOperativo: selectedTipoTecnico === 'INTERNO' ? personalTemporal : undefined,
        historial: [
          ...ot.historial,
          ...(comentarios.length > 0 ? [{
            id: Math.random().toString(36).substring(2, 11),
            orden_id: ot.id,
            comentario: `Asignación actualizada -> ${comentarios.join(' | ')}`,
            created_at: new Date().toISOString(),
            usuario_nombre: profile?.nombre || 'Administrador'
          }] : [])
        ]
      });
      alert('Asignación de personal guardada correctamente.');
      togglePanel('personal');
    } catch (e) {
      console.error(e);
      alert('Error al guardar la asignación.');
    } finally {
      setIsUpdatingDb(false);
    }
  };

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
          usuario_nombre: profile?.nombre || 'General'
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
      costoManoObraTareas: ot.costoManoObraTareas + tarea.costoManoObra,
      historial: [
        ...ot.historial,
        {
          id: Math.random().toString(36).substr(2, 9),
          orden_id: ot.id,
          comentario: `Agregada tarea: ${tarea.descripcion || tarea.nombre || 'Tarea'}`,
          created_at: new Date().toISOString(),
          usuario_nombre: profile?.nombre || 'General'
        }
      ]
    });
    setIsTareaModalOpen(false);
    Swal.fire({
      title: 'Añadido',
      text: 'Tarea agregada exitosamente.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const agregarInsumo = (repuesto: any, cantidadToUse: number = 1) => {
    if (!ot) return;
    const existe = ot.insumos.find(i => i.repuesto?.nombre === repuesto.nombre);
    
    let nuevosInsumos: any[] = [];
    if (existe) {
      const nuevaCantidad = existe.cantidad + cantidadToUse;
      nuevosInsumos = ot.insumos.map(i => i.repuesto?.nombre === repuesto.nombre ? { ...i, cantidad: nuevaCantidad, costo_total: nuevaCantidad * i.costo_unitario_aplicado } : i);
    } else {
      nuevosInsumos = [...ot.insumos, { 
        id: Math.random().toString(36).substr(2, 9), 
        orden_id: ot.id,
        repuesto_id: repuesto.id || Math.random().toString(36).substr(2, 9),
        repuesto: repuesto,
        cantidad: cantidadToUse, 
        costo_unitario_aplicado: repuesto.costo_unitario || 0,
        costo_total: cantidadToUse * (repuesto.costo_unitario || 0)
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
          comentario: `Agregado insumo/repuesto: ${repuesto.nombre} (x${cantidadToUse})`,
          created_at: new Date().toISOString(),
          usuario_nombre: profile?.nombre || 'Taller'
        }
      ]
    });
    setIsInsumoModalOpen(false);
    setInsumoSearch('');
    setInsumoQuantities({});
    Swal.fire({
      title: 'Añadido',
      text: 'Resupuesto/Insumo agregado exitosamente.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const eliminarTarea = (tareaId: string) => {
    if (!ot) return;
    const tareaObj = ot.tareasRealizadas.find(t => t.id === tareaId);
    actualizarOrdenTrabajo({
      ...ot,
      tareasRealizadas: ot.tareasRealizadas.filter(t => t.id !== tareaId),
      costoManoObraTareas: ot.costoManoObraTareas - (tareaObj?.costo_real || 0),
      historial: [
        ...ot.historial,
        {
          id: Math.random().toString(36).substr(2, 9),
          orden_id: ot.id,
          comentario: `Se eliminó la tarea: ${tareaObj?.tarea_estandar?.descripcion || 'Tarea'}`,
          created_at: new Date().toISOString(),
          usuario_nombre: profile?.nombre || 'General'
        }
      ]
    });
  };

  const eliminarInsumo = (insumoId: string) => {
    if (!ot) return;
    const insumoObj = ot.insumos.find(i => i.id === insumoId);
    const nuevosInsumos = ot.insumos.filter(i => i.id !== insumoId);
    actualizarOrdenTrabajo({
      ...ot,
      insumos: nuevosInsumos,
      costoInsumos: nuevosInsumos.reduce((sum, item) => sum + item.costo_total, 0),
      historial: [
        ...ot.historial,
        {
          id: Math.random().toString(36).substr(2, 9),
          orden_id: ot.id,
          comentario: `Se eliminó el insumo/repuesto: ${insumoObj?.repuesto?.nombre || 'Insumo'}`,
          created_at: new Date().toISOString(),
          usuario_nombre: profile?.nombre || 'General'
        }
      ]
    });
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

  const handleImprimirCertificado = () => {
    if (!ot) return;
    const doc = new jsPDF();
    
    // Add a formal border
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(1);
    doc.rect(10, 10, 190, 277);
    
    // Inner border
    doc.setLineWidth(0.3);
    doc.rect(12, 12, 186, 273);

    // Header Style
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(12, 12, 186, 30, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("CERTIFICADO DE CONFORMIDAD TÉCNICA", 105, 26, { align: "center" });
    
    // Subheader
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Documento Oficial de Mantenimiento | Folio O.T.: #${ot.folio}`, 105, 35, { align: "center" });

    // Body
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text("1. IDENTIFICACIÓN DEL VEHÍCULO Y DEL SERVICIO", 20, 55);
    doc.setLineWidth(0.5);
    doc.line(20, 57, 190, 57);

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    const info = [
        [`Patente / Matrícula:`, `${vehiculo?.patente || 'N/A'}`],
        [`Marca y Modelo:`, `${vehiculo?.marca || ''} ${vehiculo?.modelo || ''}`],
        [`Año Fabricación / VIN:`, `${vehiculo?.ano || 'N/A'} / ${vehiculo?.vin || 'N/A'}`],
        [`Kilometraje de Cierre:`, `${ot.kilometrajeCierre ? ot.kilometrajeCierre.toLocaleString() + ' km' : 'N/A'}`],
        [`Tipo de Mantenimiento:`, `${ot.tipo || 'N/A'}`],
        [`Pauta Realizada:`, `${ot.pauta || 'N/A'}`],
        [`Fecha de Emisión:`, `${new Date().toLocaleDateString()}`]
    ];

    let currentY = 65;
    info.forEach(row => {
        doc.setFont('Helvetica', 'bold');
        doc.text(row[0], 25, currentY);
        doc.setFont('Helvetica', 'normal');
        doc.text(row[1], 80, currentY);
        currentY += 7;
    });

    currentY += 10;
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text("2. RESUMEN DE INTERVENCIONES APROBADAS", 20, currentY);
    doc.setLineWidth(0.5);
    doc.line(20, currentY + 2, 190, currentY + 2);
    currentY += 10;

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    if (ot.tareasRealizadas && ot.tareasRealizadas.length > 0) {
        ot.tareasRealizadas.forEach((t, idx) => {
            const textLines = doc.splitTextToSize(`• ${t.tarea_estandar?.descripcion || 'Tarea ejecutada'}`, 160);
            textLines.forEach((line: string) => {
                if (currentY > 260) {
                    doc.addPage();
                    doc.setDrawColor(15, 23, 42);
                    doc.setLineWidth(1);
                    doc.rect(10, 10, 190, 277);
                    doc.setLineWidth(0.3);
                    doc.rect(12, 12, 186, 273);
                    currentY = 25;
                    doc.setTextColor(15, 23, 42);
                }
                doc.text(line, 25, currentY);
                currentY += 6;
            });
        });
    } else {
        doc.text("No existen tareas específicas detalladas en este documento.", 25, currentY);
        currentY += 6;
    }

    const textDeclaracion = "Por el presente documento, se certifica técnica y profesionalmente que el vehículo individualizado en la Sección 1 ha sido sometido a los procesos de revisión y mantenimiento estipulados según los protocolos vigentes. Los repuestos e insumos utilizados cumplen con los estándares de calidad requeridos.\n\nSe deja constancia que los sistemas intervenidos fueron probados y calibrados, encontrándose el vehículo en condiciones operativas óptimas para su funcionamiento seguro en las rutas, conforme a las tareas listadas en la presente orden de trabajo. Este certificado avala exclusivamente los trabajos descritos y no cubre eventualidades por desgaste natural posterior, uso indebido u omisiones fuera de esta intervención.";
    const splitText = doc.splitTextToSize(textDeclaracion, 160);

    currentY += 15;
    if (currentY + (splitText.length * 5) + 40 > 270) {
        doc.addPage();
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(1);
        doc.rect(10, 10, 190, 277);
        doc.setLineWidth(0.3);
        doc.rect(12, 12, 186, 273);
        currentY = 25;
        doc.setTextColor(15, 23, 42);
    }

    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text("3. DECLARACIÓN FORMAL DE CONFORMIDAD TÉCNICA", 20, currentY);
    doc.setLineWidth(0.5);
    doc.line(20, currentY + 2, 190, currentY + 2);
    currentY += 15;

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    
    doc.text(splitText, 25, currentY);
    
    currentY += (splitText.length * 5) + 35;

    // Signatures
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    
    doc.line(70, currentY, 140, currentY);
    doc.text("V° B° Supervisor / Jefatura de Taller", 105, currentY + 5, { align: "center" });

    if (ot.firmaCertificado) {
        try {
            doc.addImage(ot.firmaCertificado, "PNG", 85, currentY - 25, 40, 20);
        } catch (e) {
            console.error('Error rendered firma en certificado', e);
        }
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Este certificado digital es emitido por el Sistema de Gestión de Flota y Mantenimiento.", 105, 278, { align: "center" });
    doc.text(`Folio Interno: #${ot.folio} - Fecha Impresión: ${new Date().toLocaleString()}`, 105, 282, { align: "center" });

    doc.autoPrint();
    const blob = doc.output('blob');
    const blobURL = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = blobURL;
    document.body.appendChild(iframe);
    iframe.onload = () => {
       setTimeout(() => {
          iframe.contentWindow?.print();
       }, 500);
    };
  };

  const handleExportarPDF = async (imprimir: boolean = false) => {
    if (!ot) return;

    // Create a new jsPDF instance
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor: [number, number, number] = [147, 51, 234]; // Purple theme
    const secondaryColor: [number, number, number] = [71, 85, 105]; // Slate
    const textColor: [number, number, number] = [15, 23, 42]; // Dark slate

    // Helper: title banner / header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 30, 'F');

    // Title text
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('CERTIFICADO DE ORDEN DE TRABAJO', 10, 12);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'normal');
    doc.text('HOJA DE CONTROL DE PROCESO', 10, 18);
    doc.setFont('Helvetica', 'bold');
    doc.text(`OT NO: #${ot.folio}`, 200, 12, { align: 'right' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Impreso: ${new Date().toLocaleString()}`, 200, 18, { align: 'right' });

    if (empresaLogo) {
      try {
        const ext = empresaLogo.split('.').pop()?.toUpperCase() || 'PNG';
        const imgExt = ['PNG', 'JPG', 'JPEG'].includes(ext) ? (ext === 'JPG' ? 'JPEG' : ext) : 'PNG';
        doc.addImage(empresaLogo, imgExt, 160, 2, 25, 25);
      } catch (err) {
        console.error("Error drawing company logo", err);
      }
    }

    // Add white margin decoration line
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(10, 26, 200, 26);


    // 1. General information section in a nice grid table (2 columns)
    const generalInfo: any[] = [
      [
        { content: 'INFORMACIÓN DE LA ORDEN DE TRABAJO', colSpan: 4, styles: { fontStyle: 'bold', textColor: primaryColor, fontSize: 10 } }
      ],
      [
        { content: 'Folio:', styles: { fontStyle: 'bold' } },
        `OT-#${ot.folio}`,
        { content: 'Vehículo (Patente):', styles: { fontStyle: 'bold' } },
        `${vehiculo?.patente || 'N/A'} ${vehiculo?.marca ? `(${vehiculo.marca} ${vehiculo.modelo || ''})` : ''}`
      ],
      [
        { content: 'Tipo de Servicio:', styles: { fontStyle: 'bold' } },
        ot.tipo?.replace('_', ' ') || 'N/A',
        { content: 'Técnico Responsable:', styles: { fontStyle: 'bold' } },
        ot.tecnicoResponsable || 'Sin asignar'
      ],
      [
        { content: 'Prioridad:', styles: { fontStyle: 'bold' } },
        ot.prioridad || 'N/A',
        { content: 'Personal de Apoyo:', styles: { fontStyle: 'bold' } },
        ot.personalOperativo || 'Sin apoyo'
      ],
      [
        { content: 'Fecha Creación:', styles: { fontStyle: 'bold' } },
        new Date(ot.fechaCreacion).toLocaleString() || 'N/A',
        { content: 'KM Apertura:', styles: { fontStyle: 'bold' } },
        ot.kilometrajeApertura ? ot.kilometrajeApertura.toLocaleString() : '0'
      ],
      [
        { content: 'Estado de la OT:', styles: { fontStyle: 'bold' } },
        ot.estado?.replace('_', ' ') || 'N/A',
        { content: 'Pauta Mantenimiento:', styles: { fontStyle: 'bold' } },
        ot.pauta || 'Ninguna'
      ],
      [
        { content: 'Tiempo Trabajado:', styles: { fontStyle: 'bold' } },
        new Date(timerDisplay * 1000).toISOString().substr(11, 8),
        { content: 'KM Cierre:', styles: { fontStyle: 'bold' } },
        ot.kilometrajeCierre ? ot.kilometrajeCierre.toLocaleString() : 'En proceso...'
      ]
    ];

    autoTable(doc, {
      startY: 32,
      body: generalInfo,
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: 2, textColor: textColor },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 55 },
        2: { cellWidth: 45 },
        3: { cellWidth: 55 }
      }
    } as any);

    let currentY = (doc as any).lastAutoTable.finalY + 6;

    // 2. Observations and Technical logs details (styled dynamically)
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('OBSERVACIONES Y DIAGNÓSTICO', 10, currentY);
    
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.3);
    doc.line(10, currentY + 1.5, 200, currentY + 1.5);
    currentY += 5;

    const noteText: any[] = [
      [
        { content: 'Instrucciones para el Mecánico (Observación Inicial):', styles: { fontStyle: 'bold', cellWidth: 50, fontSize: 8.5 } },
        { content: ot.observacionInicial || 'No se especificó un motivo.', styles: { fontSize: 8.5 } }
      ],
      [
        { content: 'Observaciones Generales de la OT:', styles: { fontStyle: 'bold', cellWidth: 50, fontSize: 8.5 } },
        { content: ot.observaciones || 'Sin observaciones adicionales.', styles: { fontSize: 8.5 } }
      ],
      [
        { content: 'Diagnóstico Técnico / Evaluación:', styles: { fontStyle: 'bold', cellWidth: 50, fontSize: 8.5 } },
        { content: ot.diagnosticoEvaluacion || 'Evaluación técnica no registrada todavía.', styles: { fontSize: 8.5 } }
      ]
    ];

    autoTable(doc, {
      startY: currentY,
      body: noteText,
      theme: 'grid',
      styles: { cellPadding: 3, textColor: textColor },
      gridStyles: { borderWidth: 0.1, borderColor: [203, 213, 225] },
      columnStyles: {
        0: { fillColor: [248, 250, 252], fontStyle: 'bold' }
      }
    } as any);

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // 3. Tareas Realizadas (Checklist)
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('TAREAS REALIZADAS', 10, currentY);
    doc.line(10, currentY + 1.5, 200, currentY + 1.5);
    currentY += 5;

    const tareasRows = ot.tareasRealizadas && ot.tareasRealizadas.length > 0
      ? ot.tareasRealizadas.map((t, idx) => [
          idx + 1,
          t.tarea_estandar?.descripcion || t.tarea_estandar?.nombre || 'Tarea ejecutada',
          `${t.tiempo_real_minutos || 0} min`,
          canViewCostos ? `$${t.costo_real ? t.costo_real.toLocaleString() : '0'}` : 'N/A'
        ])
      : [["-", "No se han asignado o realizado tareas para esta orden.", "-", "-"]];

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Descripción de la Tarea', 'Tiempo Real', 'Costo Tarea']],
      body: tareasRows,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, fontSize: 8.5 },
      styles: { fontSize: 8, cellPadding: 2, textColor: textColor },
      columnStyles: {
        0: { cellWidth: 10 },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' }
      }
    } as any);

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // 4. Insumos y Repuestos Utilizados
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('INSUMOS Y REPUESTOS UTILIZADOS', 10, currentY);
    doc.line(10, currentY + 1.5, 200, currentY + 1.5);
    currentY += 5;

    const insumosRows = ot.insumos && ot.insumos.length > 0
      ? ot.insumos.map((i, idx) => [
          idx + 1,
          i.repuesto?.nombre || i.nombre || 'Repuesto',
          i.cantidad,
          canViewCostos ? `$${(i.repuesto?.costo_unitario || i.precioUnitario || 0).toLocaleString()}` : 'N/A',
          canViewCostos ? `$${(i.costo_total || (i.cantidad * (i.repuesto?.costo_unitario || i.precioUnitario || 0))).toLocaleString()}` : 'N/A'
        ])
      : [["-", "No se han ingresado repuestos ni insumos todavía.", "-", "-", "-"]];

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Nombre del Insumo / Repuesto', 'Cantidad', 'Costo Unit.', 'Costo Total']],
      body: insumosRows,
      theme: 'striped',
      headStyles: { fillColor: secondaryColor, fontSize: 8.5 },
      styles: { fontSize: 8, cellPadding: 2, textColor: textColor },
      columnStyles: {
        0: { cellWidth: 10 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' }
      }
    } as any);

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // 5. Solicitudes de Repuestos (if any)
    const solicitudes = ot.solicitudes || [];
    if (solicitudes.length > 0) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('SOLICITUDES DE REPUESTOS EN BODEGA', 10, currentY);
      doc.line(10, currentY + 1.5, 200, currentY + 1.5);
      currentY += 5;

      const solRows = solicitudes.map((s, idx) => [
        idx + 1,
        s.repuesto_nombre,
        s.cantidad,
        s.estado,
        s.motivo_rechazo || 'N/A',
        new Date(s.fecha_solicitud).toLocaleDateString()
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Repuesto Solicitado', 'Cant.', 'Estado', 'Motivo Rechazo', 'Fecha Solicitud']],
        body: solRows,
        theme: 'striped',
        headStyles: { fillColor: [194, 65, 12], fontSize: 8.5 },
        styles: { fontSize: 8, cellPadding: 2, textColor: textColor },
        columnStyles: {
          0: { cellWidth: 10 },
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 25, halign: 'center' },
          5: { cellWidth: 25, halign: 'center' }
        }
      } as any);

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    // 6. Costs summary & signatures
    if (canViewCostos) {
      doc.setFillColor(248, 250, 252);
      doc.rect(130, currentY, 70, 30, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(130, currentY, 70, 30, 'S');

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(`Costo Insumos: $${ot.costoInsumos.toLocaleString()}`, 134, currentY + 6);
      doc.text(`Costo Mano Obra: $${ot.costoManoObraTareas.toLocaleString()}`, 134, currentY + 12);
      doc.text(`Costo HH: $${ot.costoManoObraHH.toLocaleString()}`, 134, currentY + 18);
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129);
      doc.text(`COSTO TOTAL: $${totalCosto.toLocaleString()}`, 134, currentY + 25);
    }

    const sigY = currentY + 36;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    
    // Left signature line
    doc.line(20, sigY + 15, 80, sigY + 15);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Firma Mecánico Responsable', 50, sigY + 19, { align: 'center' });
    if (ot.tecnicoResponsable) {
      doc.setFont('Helvetica', 'italic');
      doc.text(ot.tecnicoResponsable, 50, sigY + 23, { align: 'center' });
    }

    // Right signature line
    doc.line(130, sigY + 15, 190, sigY + 15);
    doc.setFont('Helvetica', 'normal');
    doc.text('Firma Supervisor / Oficina', 160, sigY + 19, { align: 'center' });
    doc.setFont('Helvetica', 'italic');
    doc.text('Aprobación Técnica', 160, sigY + 23, { align: 'center' });

    // Render signature if it exists
    if (ot.firmaCertificado) {
      try {
        doc.addImage(ot.firmaCertificado, 'PNG', 35, sigY - 8, 30, 20);
      } catch (e) {
        console.error('Error rendering signature in PDF', e);
      }
    }

    // --- 7. HISTORIAL DE PROCESO (Al final del todo) ---
    doc.addPage();
    let histY = 20;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('HISTORIAL Y SEGUIMIENTO DEL PROCESO', 10, histY);
    doc.line(10, histY + 1.5, 200, histY + 1.5);
    histY += 5;

    const historialRows = ot.historial && ot.historial.length > 0
      ? [...ot.historial]
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((h, idx) => [
            idx + 1,
            new Date(h.created_at).toLocaleString(),
            h.usuario_nombre || 'Sistema',
            h.comentario
          ])
      : [["-", "-", "-", "No se registran eventos en el historial de esta orden."]];

    autoTable(doc, {
      startY: histY,
      head: [['#', 'Fecha y Hora', 'Usuario / Rol', 'Acción / Suceso']],
      body: historialRows,
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105], fontSize: 8.5 },
      styles: { fontSize: 8, cellPadding: 2, textColor: textColor },
      gridStyles: { borderWidth: 0.1, borderColor: [226, 232, 240] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 40 },
        2: { cellWidth: 35 },
        3: { fontStyle: 'italic' }
      }
    } as any);

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Página ${i} de ${totalPages}`, 105, 287, { align: 'center' });
      doc.text('Este documento digital representa el avance de proceso y la hoja de auditoría de Orden de Trabajo.', 105, 291, { align: 'center' });
    }

    if (imprimir) {
      doc.autoPrint();
      const blob = doc.output('blob');
      const blobURL = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = blobURL;
      document.body.appendChild(iframe);
      iframe.onload = () => {
         setTimeout(() => {
            iframe.contentWindow?.print();
         }, 500);
      };
    } else {
      doc.save(`HOJA_OT_${ot.folio}.pdf`);

      Swal.fire({
        title: '¡PDF Generado!',
        text: 'Se ha descargado la Hoja de Orden de Trabajo con el avance actual y el historial completo de eventos.',
        icon: 'success',
        confirmButtonColor: '#9333ea'
      });
    }
  };

  const hasSolicitudesPendientes = (ot?.solicitudes?.filter(s => s.estado === 'PENDIENTE').length || 0) > 0;

  const filteredInsumos = repuestos.filter(i => {
     const search = (insumoSearch || '').toLowerCase().trim();
     if (!search) return true;
     return (i.nombre || '').toLowerCase().includes(search) || 
            (i.sku || '').toLowerCase().includes(search);
  });

  const filteredTareas = tareasEstandar.filter(t => {
     const search = (tareaSearch || '').toLowerCase().trim();
     if (!search) return true;
     return (t.descripcion || '').toLowerCase().includes(search);
  });

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
        <div className="flex flex-col items-center">
            <h1 className="text-xl font-bold">OT #{ot.folio} <Badge className="ml-2 bg-green-600 text-white">{ot.estado.replace('_', ' ')}</Badge></h1>
            <p className="text-xs text-slate-500 mt-1">
                Responsable: <span className="font-semibold text-slate-700 dark:text-slate-300">{ot.tecnicoResponsable || 'N/A'}</span> 
                {ot.personalOperativo && <span> | Apoyo: <span className="font-semibold text-slate-700 dark:text-slate-300">{ot.personalOperativo}</span></span>}
            </p>
        </div>
        <div className="flex gap-2 font-bold flex-wrap justify-end">
            {ot.tipo === 'INSPECCION' && (
              <Button onClick={() => navigate('/flota/neumaticos?tab=inspeccion')} className="bg-purple-600 hover:bg-purple-700 text-white">
                <FileText className="w-4 h-4 mr-2" /> Realizar Inspección
              </Button>
            )}
            <span className="flex items-center text-slate-600 dark:text-slate-400 mr-4"><Clock className="w-4 h-4 mr-1"/> {new Date(timerDisplay * 1000).toISOString().substr(11, 8)}</span>
            
            <Button variant="outline" className="hidden lg:flex" onClick={() => handleExportarPDF(false)}><FileDown className="w-4 h-4 mr-2"/> Descargar OT</Button>
            <Button variant="outline" className="hidden lg:flex" onClick={() => handleExportarPDF(true)}><Printer className="w-4 h-4 mr-2"/> Imprimir OT</Button>
            <Button variant="outline" onClick={handleImprimirCertificado}><CheckCircle className="w-4 h-4 mr-2"/> Imprimir Certificado</Button>

            {ot.estado === 'PROGRAMADA' || ot.estado === 'ABIERTA' || ot.estado === 'PENDIENTE' || ot.estado === 'PAUSADA' ? (
              <Button onClick={() => handleActualizarEstadoRapido('EN_PROCESO')} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold">
                 {ot.estado === 'PAUSADA' ? 'Reanudar Trabajo' : 'Iniciar Trabajo'}
              </Button>
            ) : ot.estado === 'EN_PROCESO' ? (
              <>
                 <Button onClick={() => setIsPausaModalOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-white font-bold">
                    Pausar OT
                 </Button>
                 <Button onClick={() => {
                     Swal.fire({
                         title: 'Confirmar Cierre',
                         text: 'Al cerrar la OT, se enviará una notificación al supervisor o administrador para que la revise. Por favor ingrese el kilometraje actual del vehículo:',
                         icon: 'warning',
                         input: 'number',
                         inputAttributes: {
                             min: (ot.kilometrajeApertura || 0).toString(),
                             step: '1'
                         },
                         showCancelButton: true,
                         confirmButtonColor: '#9333ea',
                         cancelButtonColor: '#64748b',
                         confirmButtonText: 'Sí, Cerrar OT',
                         cancelButtonText: 'Cancelar',
                         inputValidator: (value) => {
                             if (!value || isNaN(Number(value))) return 'Debe ingresar un kilometraje válido.';
                             if (Number(value) < (ot.kilometrajeApertura || 0)) return 'El kilometraje no puede ser menor al de apertura.';
                             return null;
                         }
                     }).then((result) => {
                         if (result.isConfirmed) {
                             handleActualizarEstadoRapido('CERRADA_POR_MECANICO', undefined, Number(result.value))
                         }
                     })
                 }} className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
                    <CheckCircle className="w-4 h-4 mr-2" /> Cerrar OT (Mecánico)
                 </Button>
              </>
            ) : null}

            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
               <PenTool className="w-4 h-4 mr-2" /> Firmar
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFirmaUpload} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full max-w-md mx-auto lg:mx-0">
                <button 
                   className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${infoView === 'info' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                   onClick={() => setInfoView('info')}
                >
                   Información General
                </button>
                {canViewCostos && (
                <button 
                   className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${infoView === 'costos' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                   onClick={() => setInfoView('costos')}
                >
                   Desglose de Costos
                </button>
                )}
            </div>

            {infoView === 'info' && (
                <Card>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm pt-6">
                        <p><strong>Vehículo:</strong> {vehiculo?.patente || 'N/A'}</p>
                        <p><strong>Técnico Responsable:</strong> {ot.tecnicoResponsable || 'Sin asignar'}</p>
                        <p><strong>Ayudantes:</strong> {ot.personalOperativo || 'Sin asignar'}</p>
                        <p><strong>Tipo:</strong> {ot.tipo}</p>
                        <p><strong>Prioridad:</strong> {ot.prioridad}</p>
                        <p><strong>Fecha Creación:</strong> {new Date(ot.fechaCreacion).toLocaleDateString()}</p>
                        <p><strong>KM Apertura:</strong> {ot.kilometrajeApertura.toLocaleString()}</p>
                        {ot.observaciones && (
                            <div className="col-span-2 bg-slate-50 p-4 border dark:border-slate-700 dark:bg-slate-800/50 rounded">
                                <p className="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs mb-1">Observaciones Generales:</p>
                                <p className="text-slate-800 dark:text-slate-200">{ot.observaciones}</p>
                            </div>
                        )}
                        <div className="col-span-2 bg-yellow-50 p-4 border dark:border-slate-800 border-yellow-200 rounded">
                            <p className="font-bold text-yellow-800 uppercase text-xs mb-1">Instrucciones para el Mecánico (Observación Inicial):</p>
                            <p className="text-yellow-900">{ot.observacionInicial || 'No se especificó un motivo.'}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {infoView === 'costos' && (
                <Card>
                    <CardContent className="pt-6 space-y-3">
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded">
                            <span className="flex items-center text-slate-700 dark:text-slate-300"><Wrench className="w-4 h-4 mr-2 text-blue-500" /> Costo en Insumos</span>
                            <span className="font-mono">${ot.costoInsumos.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded">
                            <span className="flex items-center text-slate-700 dark:text-slate-300"><History className="w-4 h-4 mr-2 text-yellow-500" /> M. Obra (Tareas)</span>
                            <span className="font-mono">${ot.costoManoObraTareas.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded">
                            <span className="flex items-center text-slate-700 dark:text-slate-300"><Clock className="w-4 h-4 mr-2 text-orange-500" /> M. Obra (HH)</span>
                            <span className="font-mono">${ot.costoManoObraHH.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t dark:border-slate-800 mt-4">
                            <span className="font-bold text-slate-800 dark:text-slate-100 text-lg">Costo Total OT</span>
                            <span className="font-bold text-emerald-500 text-lg">${totalCosto.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex gap-2">
                <Button variant={activeTab === 'tareas' ? 'default' : 'outline'} onClick={() => setActiveTab('tareas')}>Tareas Realizadas</Button>
                <Button variant={activeTab === 'insumos' ? 'default' : 'outline'} onClick={() => setActiveTab('insumos')}>Insumos y Repuestos</Button>
                <Button variant={activeTab === 'solicitudes' ? 'default' : 'outline'} onClick={() => setActiveTab('solicitudes')}>Solicitudes Bodega</Button>
                <Button variant={activeTab === 'historial' ? 'default' : 'outline'} onClick={() => setActiveTab('historial')}>Historial de la OT</Button>
                {ot.tipo?.includes('NEUMATICOS') && (
                    <Button variant="outline" onClick={() => setIsInspeccionModalOpen(true)} className="bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 border-purple-200 dark:border-purple-800">
                        <FileText className="w-4 h-4 mr-2" /> Pauta Inspección
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="pt-6">
                    {activeTab === 'tareas' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold">Tareas</h3>
                              {canManageTareas && (
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => setIsCrearTareaModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    <Plus className="w-4 h-4 mr-2"/>
                                    Crear Tarea
                                  </Button>
                                  <Button size="sm" onClick={() => setIsTareaModalOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2"/>
                                    Añadir Tarea
                                  </Button>
                                </div>
                              )}
                            </div>
                            {ot.tareasRealizadas.map(t => (
                                <div key={t.id} className="flex justify-between items-center p-2 border-b last:border-0 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900/50 transition-colors">
                                    <span className="flex-1 text-slate-800 dark:text-slate-200">{t.tarea_estandar?.descripcion || 'Tarea'}</span>
                                    <div className="flex items-center gap-4">
                                        {canViewCostos && <span className="font-mono text-slate-600 dark:text-slate-400">${t.costo_real.toLocaleString()}</span>}
                                        {canManageTareas && (
                                            <button onClick={() => eliminarTarea(t.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Eliminar tarea">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'insumos' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold">Insumos</h3>
                                {canManageInsumos && (
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
                                )}
                            </div>
                            {ot.insumos.length === 0 && (
                                <p className="text-sm text-slate-500 py-4 text-center border-2 border-dashed rounded-lg dark:border-slate-800">
                                    No hay insumos registrados en esta OT.
                                </p>
                            )}
                            {ot.insumos.map(i => (
                                <div key={i.id} className="flex justify-between items-center p-2 border-b last:border-0 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900/50 transition-colors">
                                    <span className="flex-1 text-slate-800 dark:text-slate-200">{i.repuesto?.nombre || 'Insumo'} <span className="text-slate-500 font-mono text-xs">(x{i.cantidad})</span></span>
                                    <div className="flex items-center gap-4">
                                        {canViewCostos && <span className="font-mono text-slate-600 dark:text-slate-400">${(i.costo_total).toLocaleString()}</span>}
                                        {canManageInsumos && (
                                            <button onClick={() => eliminarInsumo(i.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Eliminar insumo">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
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
                                <Button size="sm" onClick={() => setIsSolicitudModalOpen(true)}><Plus className="w-4 h-4 mr-2"/>Solicitar Repuesto</Button>
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
                                         {canManageRequests && s.estado === 'PENDIENTE' && (
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
                <textarea id="diag-textarea" className="w-full p-2 border rounded dark:border-slate-800 text-sm dark:bg-slate-800 dark:text-slate-100" placeholder="Ingrese el diagnóstico técnico aquí..." defaultValue={ot.diagnosticoEvaluacion} />
                <Button className="w-full mt-2 bg-cyan-600" onClick={handleGuardarDiagnostico}><Save className="w-4 h-4 mr-2" />Guardar Diagnóstico</Button>
            </AccordionPanel>

            <AccordionPanel title="Pauta de Mantenimiento" active={activePanels.pauta} onToggle={() => togglePanel('pauta')}>
                <p className="text-sm mb-2 text-slate-500">Filtradas por: {vehiculo?.modelo || 'Todos los modelos'}</p>
                <select 
                   className="w-full p-2 mb-4 border rounded dark:border-slate-800 text-sm dark:bg-slate-800 dark:text-slate-100"
                   value={ot.pauta || ''}
                   onChange={(e) => {
                       actualizarOrdenTrabajo({
                           ...ot,
                           pauta: e.target.value,
                           historial: [
                               ...ot.historial,
                               {
                                   id: Math.random().toString(36).substr(2, 9),
                                   orden_id: ot.id,
                                   comentario: `Se cambió la pauta de mantenimiento a: ${e.target.value || 'Ninguna'}`,
                                   created_at: new Date().toISOString(),
                                   usuario_nombre: profile?.nombre || 'Administrador'
                               }
                           ]
                       });
                   }}
                >
                   <option value="">Seleccione una Pauta...</option>
                   {filteredPautas.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                </select>

                {ot.pauta && (
                    <Button 
                        className="bg-cyan-500 w-full hover:bg-cyan-600 mt-2" 
                        onClick={() => {
                            const pautaObj = filteredPautas.find(p => p.nombre === ot.pauta);
                            if (pautaObj && (pautaObj as any).archivoPdfUrl) {
                                window.open((pautaObj as any).archivoPdfUrl, '_blank', 'noopener,noreferrer');
                            } else {
                                // Generate generic pauta PDF
                                const pdf = new jsPDF();
                                pdf.setFontSize(22);
                                pdf.setTextColor(6, 182, 212); // cyan
                                pdf.text(`PAUTA: ${ot.pauta}`, 105, 20, { align: "center" });
                                pdf.setFontSize(12);
                                pdf.setTextColor(0, 0, 0);
                                pdf.text(`Vehículo: ${vehiculo?.patente || 'N/A'}`, 20, 40);
                                pdf.text(`OT Folio: ${ot.folio}`, 20, 50);
                                pdf.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 60);
                                
                                pdf.setFont('Helvetica', 'bold');
                                pdf.text("Checklist de Mantenimiento:", 20, 80);
                                pdf.setFont('Helvetica', 'normal');
                                
                                let y = 95;
                                const items = [
                                    "Revisión de Niveles (Aceite, Refrigerante)",
                                    "Inspección Visual de Neumáticos",
                                    "Revisión de Frenos",
                                    "Inspección de Luces e Intermitentes",
                                    "Lubricación General del Chasis",
                                    "Filtro de Aire - Limpieza/Cambio"
                                ];
                                
                                items.forEach(t => {
                                    pdf.rect(20, y - 4, 5, 5); // Empty checkbox
                                    pdf.text(t, 30, y);
                                    y += 10;
                                });
                                
                                pdf.autoPrint();
                                const blob = pdf.output('blob');
                                const blobURL = URL.createObjectURL(blob);
                                const iframe = document.createElement('iframe');
                                iframe.style.display = 'none';
                                iframe.src = blobURL;
                                document.body.appendChild(iframe);
                                iframe.onload = () => {
                                   setTimeout(() => {
                                      iframe.contentWindow?.print();
                                   }, 500);
                                };
                            }
                        }}
                    >
                        <FileDown className="w-4 h-4 mr-2"/> Ver / Imprimir Pauta PDF
                    </Button>
                )}
            </AccordionPanel>

            {canAssignPersonal && (
            <AccordionPanel title="Asignar Personal" active={activePanels.personal} onToggle={() => togglePanel('personal')}>
                <div className="space-y-4">
                    <div className="mb-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        <label className="block text-sm font-bold mb-2">Tipo de Trabajador Asignado</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="detail_tecnico_tipo" value="INTERNO" checked={selectedTipoTecnico === 'INTERNO'} onChange={() => setSelectedTipoTecnico('INTERNO')} className="w-4 h-4 text-blue-600" />
                                <span className="text-sm">Personal Interno</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="detail_tecnico_tipo" value="EXTERNO" checked={selectedTipoTecnico === 'EXTERNO'} onChange={() => setSelectedTipoTecnico('EXTERNO')} className="w-4 h-4 text-blue-600" />
                                <span className="text-sm">Personal/Empresa Externa</span>
                            </label>
                        </div>
                    </div>

                    {selectedTipoTecnico === 'INTERNO' && (
                        <>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Responsable Principal</p>
                                <p className="text-sm font-semibold p-2 bg-slate-50 dark:bg-slate-900/50 rounded mt-1">{ot.tecnicoResponsable || 'Ninguno'}</p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Cambiar Responsable</p>
                                <select 
                                    value={selectedTecnico} 
                                    onChange={(e) => setSelectedTecnico(e.target.value)}
                                    className="w-full p-2 mt-1 border rounded dark:border-slate-800 text-sm dark:bg-slate-800 dark:text-slate-100"
                                >
                                    <option value="">Seleccionar técnico...</option>
                                    {personal
                                      .filter(p => p.isMecanico || p.roleBadgeText?.toLowerCase().includes('mecanic') || p.role?.toLowerCase().includes('mecanic') || p.roleBadgeText?.toLowerCase().includes('taller') || p.role?.toLowerCase().includes('taller'))
                                      .map(p => (
                                        <option key={p.id} value={p.name}>{p.name} ({p.roleBadgeText || p.role || 'Mecánico'})</option>
                                      ))
                                    }
                                    {/* Fallback to list anyone in personal if no filtered mechanics are found */}
                                    {personal.length > 0 && personal.filter(p => p.isMecanico || p.roleBadgeText?.toLowerCase().includes('mecanic') || p.role?.toLowerCase().includes('mecanic') || p.roleBadgeText?.toLowerCase().includes('taller') || p.role?.toLowerCase().includes('taller')).length === 0 &&
                                      personal.map(p => (
                                        <option key={p.id} value={p.name}>{p.name} ({p.roleBadgeText || p.role || 'Personal'})</option>
                                      ))
                                    }
                                </select>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Personal de Apoyo (Ayudantes)</p>
                                <input 
                                    type="text" 
                                    list="ayudantes-list"
                                    className="w-full p-2 mt-1 border rounded dark:border-slate-800 text-sm dark:bg-slate-800 dark:text-slate-100" 
                                    placeholder="Buscar ayudantes..." 
                                    onChange={(e) => {
                                        setPersonalTemporal(e.target.value);
                                    }}
                                    defaultValue={ot.personalOperativo || ''}
                                />
                                <datalist id="ayudantes-list">
                                    {personal.map(p => (
                                        <option key={p.id} value={p.name}>{p.roleBadgeText || p.role}</option>
                                    ))}
                                </datalist>
                            </div>
                        </>
                    )}

                    {selectedTipoTecnico === 'EXTERNO' && (
                        <div className="space-y-4 bg-orange-50/50 dark:bg-orange-900/10 p-4 rounded-lg border border-orange-100 dark:border-orange-900/30">
                            <div>
                                <p className="text-xs text-orange-900 dark:text-orange-200 uppercase font-bold">Nombre (Persona o Empresa)</p>
                                <input 
                                    type="text" 
                                    className="w-full p-2 mt-1 border border-orange-200 dark:border-orange-800/50 rounded dark:bg-slate-800 text-sm dark:text-slate-100" 
                                    placeholder="Ej: Taller Juanito / Juan Pérez" 
                                    value={externoNombre}
                                    onChange={(e) => setExternoNombre(e.target.value)}
                                />
                            </div>
                            <div>
                                <p className="text-xs text-orange-900 dark:text-orange-200 uppercase font-bold">Tipo de Especialista</p>
                                <input 
                                    type="text" 
                                    className="w-full p-2 mt-1 border border-orange-200 dark:border-orange-800/50 rounded dark:bg-slate-800 text-sm dark:text-slate-100" 
                                    placeholder="Ej: Electromecánico, Tornero..." 
                                    value={externoEspecialidad}
                                    onChange={(e) => setExternoEspecialidad(e.target.value)}
                                />
                            </div>
                            <div>
                                <p className="text-xs text-orange-900 dark:text-orange-200 uppercase font-bold">Tipo de Intervención</p>
                                <select 
                                    value={externoIntervencion} 
                                    onChange={(e) => setExternoIntervencion(e.target.value)}
                                    className="w-full p-2 mt-1 border border-orange-200 dark:border-orange-800/50 rounded dark:bg-slate-800 text-sm dark:text-slate-100"
                                >
                                    <option value="">Seleccione...</option>
                                    <option value="DIAGNOSTICO">Diagnóstico</option>
                                    <option value="DIAGNOSTICO_REPARACION_REPUESTOS">Diagnóstico + Reparación + Repuestos</option>
                                    <option value="TODO">Todo (Servicio integral)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <Button onClick={handleGuardarAsignacion} disabled={isUpdatingDb} className="w-full bg-cyan-600 hover:bg-cyan-700">
                        {isUpdatingDb ? 'Guardando...' : 'Guardar Asignación'}
                    </Button>
                </div>
            </AccordionPanel>
            )}
            
            {canForceState && (
            <AccordionPanel title="Cambiar Estado" active={activePanels.estado} onToggle={() => togglePanel('estado')}>
                <div className="space-y-4 text-sm">
                    <div>
                        <label className="block text-slate-500 font-bold mb-1">Nuevo Estado</label>
                        <select 
                            className="w-full p-2 border rounded dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
                            value={nuevoEstado}
                            onChange={(e) => setNuevoEstado(e.target.value)}
                        >
                            <option value="PROGRAMADA">PROGRAMADA</option>
                            <option value="PENDIENTE">PENDIENTE</option>
                            <option value="EN_PROCESO">EN PROCESO</option>
                            <option value="PAUSADA">PAUSADA</option>
                            <option value="CERRADA_POR_MECANICO">CERRADA POR MECÁNICO</option>
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
            )}
        </div>
      </div>

      <Modal isOpen={isTareaModalOpen} onClose={() => setIsTareaModalOpen(false)} title="Seleccionar Tarea Estándar">
        <div className="mt-4">
          <input 
              type="text" 
              placeholder="Buscar tarea..." 
              value={tareaSearch}
              onChange={(e) => setTareaSearch(e.target.value)}
              className="w-full border rounded-lg p-2 pl-3 dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-1 focus:ring-cyan-500 mb-4" 
          />
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {filteredTareas.slice(0, 50).map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 border rounded-lg dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                 <div>
                    <p className="font-semibold text-sm">{t.descripcion}</p>
                    <p className="text-xs text-slate-500">{t.tiempoEstandarMinutos} min | Valor: ${t.costoManoObra.toLocaleString()}</p>
                 </div>
                 <Button size="sm" onClick={() => agregarTarea(t)} className="bg-cyan-600">Añadir</Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal isOpen={isPausaModalOpen} onClose={() => setIsPausaModalOpen(false)} title="Motivo de Pausa">
         <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">Ingrese un motivo oficial de pausa antes de detener el cronómetro y el trabajo.</p>
            <select
               className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white"
               value={motivoPausaSeleccionado}
               onChange={(e) => setMotivoPausaSeleccionado(e.target.value)}
            >
               <option value="">Seleccione un motivo...</option>
               {tiposPausa.map(tp => (
                  <option key={tp.id} value={tp.id}>{tp.nombre}</option>
               ))}
            </select>
            <div className="flex gap-2 justify-end">
               <Button variant="outline" onClick={() => setIsPausaModalOpen(false)}>Cancelar</Button>
               <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={confirmarPausa} disabled={!motivoPausaSeleccionado}>
                  Pausar
               </Button>
            </div>
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

      <CrearTareaModal
        isOpen={isCrearTareaModalOpen}
        onClose={() => setIsCrearTareaModalOpen(false)}
        onCrear={(nuevaTarea) => {
          if (agregarTareaEstandar) agregarTareaEstandar(nuevaTarea);
          // And optionally select it or just close it. Let's just open the add tarea modal so the user can select it
          setIsCrearTareaModalOpen(false);
          setIsTareaModalOpen(true);
        }}
      />

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
            {filteredInsumos.slice(0, 50).length > 0 ? filteredInsumos.slice(0, 50).map(i => (
               <div key={i.id} className="flex justify-between items-center p-3 border rounded-lg dark:border-slate-700">
                  <div>
                    <p className="font-bold text-sm uppercase">{i.nombre}</p>
                    <p className="text-xs text-slate-500">SKU: {i.sku} | Stock: <span className="text-emerald-500 font-semibold">{i.stock_actual} disponibles ✓</span></p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="number" 
                      value={insumoQuantities[i.id] ?? 1} 
                      min={1} 
                      onChange={(e) => setInsumoQuantities({
                        ...insumoQuantities,
                        [i.id]: Math.max(1, parseInt(e.target.value) || 1)
                      })}
                      className="w-16 border rounded p-1 text-center text-sm dark:bg-slate-800 dark:border-slate-700" 
                    />
                    <Button size="sm" className="bg-[#0cf]" onClick={() => agregarInsumo(i, insumoQuantities[i.id] ?? 1)}>Añadir</Button>
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

      <Modal isOpen={isInspeccionModalOpen} onClose={() => setIsInspeccionModalOpen(false)} title="Pauta Inspección Técnica de Neumáticos" size="5xl">
        <FormularioInspeccion prefilledVehiculoId={ot.vehiculoId} onClose={() => setIsInspeccionModalOpen(false)} />
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
