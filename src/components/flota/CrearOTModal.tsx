import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppContext } from '../../context/AppContext';
import { useCompany } from '../../contexts/CompanyContext';
import { OrdenDeTrabajo } from '../../types';
import { logActividad } from '../../lib/supabase';
import Swal from 'sweetalert2';

export interface CrearOTModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehiculoPreseleccionadoId?: string;
  otToEdit?: OrdenDeTrabajo | null;
}

export const CrearOTModal: React.FC<CrearOTModalProps> = ({ isOpen, onClose, vehiculoPreseleccionadoId, otToEdit }) => {
  const { ordenesTrabajo, crearOrdenTrabajo, actualizarOrdenTrabajo, vehiculos, tiposFalla, pautas, kitsRepuesto, personal } = useAppContext();
  const { activeCompanyId } = useCompany();
    const [allowConductor, setAllowConductor] = useState(false);
  const excludedRoles = ['super administrador', 'súper administrador', 'super admin', 'súper admin', 'administrador', 'gerente', 'administrativo'];
  
  const personalOperativoList = personal.filter(u => {
    const roleLower = (u.roleBadgeText || u.rol?.nombre || '').toLowerCase();
    if (!allowConductor && (roleLower.includes('conductor') || roleLower.includes('operador') || roleLower.includes('chofer'))) {
        return false;
    }
    return !excludedRoles.some(r => roleLower.includes(r));
  });

  // State for all fields
  const [formData, setFormData] = useState<Partial<OrdenDeTrabajo>>({
    vehiculoId: vehiculoPreseleccionadoId || '',
    tipo: 'PREVENTIVA',
    prioridad: 'MEDIA',
    kilometrajeApertura: 0,
    fechaCreacion: new Date().toISOString(),
    fechaProgramada: new Date().toISOString()
  });

  React.useEffect(() => {
    if (otToEdit) {
      let combinedDate = new Date().toISOString();
      if (otToEdit.fechaProgramada) {
         try {
           const timeStr = otToEdit.horaInicioProgramada || "08:00";
           const timeSegment = timeStr.length === 5 ? timeStr + ':00' : timeStr;
           const d = new Date(`${otToEdit.fechaProgramada}T${timeSegment}`);
           if (!isNaN(d.getTime())) {
             combinedDate = d.toISOString();
           }
         } catch(e) {}
      }
      setFormData({ ...otToEdit, fechaProgramada: combinedDate });
    } else {
      const preVeh = vehiculos.find(v => String(v.id) === String(vehiculoPreseleccionadoId));
      const currentKm = preVeh ? Number(preVeh.kilometrajeActual || (preVeh as any).kilometraje_actual || 0) : 0;
      setFormData({
        vehiculoId: vehiculoPreseleccionadoId || '',
        tipo: 'PREVENTIVA',
        prioridad: 'MEDIA',
        kilometrajeApertura: currentKm,
        fechaCreacion: new Date().toISOString(),
        fechaProgramada: new Date().toISOString()
      });
    }
  }, [otToEdit, vehiculoPreseleccionadoId, isOpen, vehiculos]);

  const vehiculoSeleccionado = vehiculos.find(v => v.id === formData.vehiculoId);
  
  const filteredTiposFalla = useMemo(() => {
    if (!vehiculoSeleccionado?.modelo) return tiposFalla;
    return tiposFalla.filter(tf => {
      const modeloFalla = (tf.modelo_afectado || '').toLowerCase();
      // si no tiene modelo_afectado o es "general", lo mostramos. Si tiene, filtramos por modelo.
      if (!modeloFalla || modeloFalla === 'general' || modeloFalla === 'todos' || modeloFalla === '') return true;
      return vehiculoSeleccionado.modelo?.toLowerCase().includes(modeloFalla) || modeloFalla.includes(vehiculoSeleccionado.modelo?.toLowerCase() || '');
    });
  }, [tiposFalla, vehiculoSeleccionado]);

  const filteredPautas = useMemo(() => {
    if (!vehiculoSeleccionado?.modelo) return pautas;
    return pautas.filter(p => {
      const pautaModelo = (p.modeloVehiculo || '').toLowerCase();
      if (!pautaModelo || pautaModelo === 'general' || pautaModelo === 'todos' || pautaModelo === '') return true;
      return vehiculoSeleccionado.modelo?.toLowerCase().includes(pautaModelo) || pautaModelo.includes(vehiculoSeleccionado.modelo?.toLowerCase() || '');
    });
  }, [pautas, vehiculoSeleccionado]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'vehiculoId') {
      const selectedVeh = vehiculos.find(v => String(v.id) === String(value));
      const currentKm = selectedVeh ? Number(selectedVeh.kilometrajeActual || (selectedVeh as any).kilometraje_actual || 0) : 0;
      setFormData(prev => ({ 
        ...prev, 
        vehiculoId: value,
        kilometrajeApertura: prev.kilometrajeApertura ? prev.kilometrajeApertura : currentKm
      }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehiculoId) {
      Swal.fire({
        title: "Vehículo Obligatorio",
        text: "Debes seleccionar un vehículo de la flota para poder crear la Orden de Trabajo.",
        icon: "warning",
        confirmButtonColor: "#0891b2"
      });
      return;
    }

    let autoInstruccion = '';
    switch(formData.tipo) {
      case 'PREVENTIVA':
      case 'PREVENTIVA_NEUMATICOS':
          autoInstruccion = `Mantenimiento preventivo. Pauta a realizar: ${formData.pauta || 'No especificada'}.`;
          if (formData.kitRepuestos) autoInstruccion += ` Utilizar Kit: ${formData.kitRepuestos}.`;
          break;
      case 'CORRECTIVA':
      case 'EVALUATIVA':
          autoInstruccion = `Revisión/Reparación. Falla reportada: ${formData.tipoFalla || 'No especificada'}. Síntomas: ${formData.sintomas || 'No especificados'}.`;
          break;
      case 'INSPECCION':
          autoInstruccion = `Realizar inspección general del vehículo.`;
          break;
      case 'EVALUATIVA_NEUMATICOS':
          autoInstruccion = `Inspección de Neumáticos/Tren Motriz. Configuración Ejes: ${formData.inspeccionTrenMotriz || 'No especificada'}, Eje afectado: ${formData.eje || 'No especificado'}.`;
          break;
      case 'CORRECTIVA_NEUMATICOS':
          autoInstruccion = `Reparación correctiva de neumáticos.`;
          if (formData.presionNeumatico) autoInstruccion += ` Ajustar presión a: ${formData.presionNeumatico} PSI.`;
          break;
      default:
          autoInstruccion = 'Revisar vehículo según requerimiento.';
    }

    const pd = new Date(formData.fechaProgramada || new Date().toISOString());
    const fechaProgramadaOnly = `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, '0')}-${String(pd.getDate()).padStart(2, '0')}`;
    const horaInicioOnly = `${String(pd.getHours()).padStart(2, '0')}:${String(pd.getMinutes()).padStart(2, '0')}`;
    const endDate = new Date(pd.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours
    const horaTerminoOnly = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

    if (otToEdit) {
      actualizarOrdenTrabajo({ 
          ...formData, 
          observacionInicial: autoInstruccion,
          fechaProgramada: fechaProgramadaOnly,
          horaInicioProgramada: horaInicioOnly,
          horaTerminoProgramada: formData.horaTerminoProgramada || horaTerminoOnly
      } as OrdenDeTrabajo);
      onClose();
      return;
    }

    let insumosDesdeKit: any[] = [];
    if (formData.kitRepuestos) {
      const selectedKit = kitsRepuesto.find(k => k.nombre === formData.kitRepuestos);
      if (selectedKit && selectedKit.detalles) {
        insumosDesdeKit = selectedKit.detalles.map(det => ({
          id: typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
          nombre: det.repuesto,
          cantidad: det.cantidad,
          precioUnitario: 0 // Placeholder, as in standard the app sets this manually or fetched
        }));
      }
    }

    // Collect all existing folios from in-memory state and localStorage cache for this company
    const allKnownFolios = new Set<string>();
    (ordenesTrabajo || []).forEach(ot => {
      if (ot?.folio && (!activeCompanyId || !ot.empresa_id || ot.empresa_id === activeCompanyId)) allKnownFolios.add(ot.folio);
    });
    try {
      const storageKey = activeCompanyId ? `pulser_ordenes_trabajo_${activeCompanyId}` : 'pulser_ordenes_trabajo';
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          parsed.forEach((o: any) => { if (o?.folio) allKnownFolios.add(o.folio); });
        }
      }
    } catch(e) {}

    let maxNum = 0;
    allKnownFolios.forEach(folioStr => {
      const match = folioStr?.match(/OT-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const nextFolio = `OT-${String(maxNum + 1).padStart(4, '0')}`;

    const finalId = typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });

    let pautaFinal = formData.pauta;
    if ((formData.tipo === 'PREVENTIVA' || formData.tipo === 'PREVENTIVA_NEUMATICOS') && !pautaFinal) {
      if (filteredPautas.length > 0) {
        pautaFinal = filteredPautas[0].nombre;
      } else if (vehiculoSeleccionado?.tipoUltimoMant) {
        pautaFinal = vehiculoSeleccionado.tipoUltimoMant;
      }
    }

    const selectedPautaObj = pautas.find(p => p.nombre === pautaFinal);
    const selectedFallaObj = tiposFalla.find(tf => tf.nombre === formData.tipoFalla);

    const nuevaOT: OrdenDeTrabajo = {
      id: finalId,
      folio: nextFolio,
      vehiculoId: formData.vehiculoId || '',
      vehiculo_id: formData.vehiculoId || '',
      tipo: formData.tipo as any,
      estado: 'ABIERTA',
      prioridad: formData.prioridad as any,
      kilometrajeApertura: Number(formData.kilometrajeApertura || 0),
      kilometraje_apertura: Number(formData.kilometrajeApertura || 0),
      fechaCreacion: formData.fechaCreacion || new Date().toISOString(),
      fechaProgramada: fechaProgramadaOnly,
      horaInicioProgramada: horaInicioOnly,
      horaTerminoProgramada: horaTerminoOnly,
      tareasRealizadas: [],
      insumos: insumosDesdeKit,
      observacionInicial: autoInstruccion,
      pauta: pautaFinal,
      pauta_mantenimiento_id: selectedPautaObj?.id,
      kitRepuestos: formData.kitRepuestos,
      tipoFalla: formData.tipoFalla,
      tipo_falla_id: selectedFallaObj?.id,
      sintomas: formData.sintomas,
      inspeccionTrenMotriz: formData.inspeccionTrenMotriz,
      eje: formData.eje,
      presionNeumatico: formData.presionNeumatico ? Number(formData.presionNeumatico) : undefined,
      tecnicoResponsable: formData.tecnicoResponsable,
      personalOperativo: formData.personalOperativo,
      proveedor: formData.proveedor,
      empresaExterna: formData.empresaExterna,
      rutEmpresa: formData.rutEmpresa,
      valorHH: formData.valorHH ? Number(formData.valorHH) : undefined,
      presupuestoAprobado: formData.presupuestoAprobado ? Number(formData.presupuestoAprobado) : undefined,
      observaciones: formData.observaciones,
      tecnico_tipo: formData.tecnico_tipo || 'INTERNO',
      externo_nombre: formData.externo_nombre,
      externo_especialidad: formData.externo_especialidad,
      externo_intervencion: formData.externo_intervencion,
      historial: [{ 
        id: typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(7), 
        orden_id: finalId,
        comentario: 'OT Creada', 
        created_at: new Date().toISOString(), 
        usuario_nombre: 'Sistema',
        estado_nuevo: 'ABIERTA'
      }],
      costoInsumos: 0,
      costoManoObraTareas: 0,
      costoManoObraHH: 0,
      tiempoTrabajadoSegundos: 0,
    };
    crearOrdenTrabajo(nuevaOT);
    
    // Asynchronously log the activity dynamically 
    const vehiculo = vehiculos.find(v => v.id === formData.vehiculoId);
    logActividad(
      'Mantenimiento',
      'Creó OT',
      `OT ${nuevaOT.folio} generada para patente ${vehiculo ? vehiculo.patente : 'desconocida'}`,
    );

    onClose();
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <div className="space-y-3 pt-4 border-t">
      <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase">{title}</h3>
      {children}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Orden de Trabajo">
      <form onSubmit={handleSubmit} className="space-y-4">
        {renderSection("IDENTIFICACIÓN", (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Vehículo</label>
              <select name="vehiculoId" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={formData.vehiculoId} onChange={handleChange} required>
                <option value="">---------</option>
                {vehiculos.map(v => <option key={v.id} value={v.id}>{v.patente}{v.modelo ? ` - ${v.modelo}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Tipo OT</label>
              <select name="tipo" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={formData.tipo} onChange={handleChange}>
                <option value="PREVENTIVA">PREVENTIVA</option>
                <option value="CORRECTIVA">CORRECTIVA</option>
                <option value="EVALUATIVA">EVALUATIVA</option>
                <option value="INSPECCION">INSPECCION</option>
                <option value="PREVENTIVA_NEUMATICOS">PREVENTIVA NEUMATICOS</option>
                <option value="CORRECTIVA_NEUMATICOS">CORRECTIVA NEUMATICOS</option>
                <option value="EVALUATIVA_NEUMATICOS">EVALUATIVA NEUMATICOS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Kilometraje Apertura</label>
              <input type="number" name="kilometrajeApertura" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={formData.kilometrajeApertura || ''} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">Prioridad</label>
              <select name="prioridad" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" onChange={handleChange} value={formData.prioridad || "MEDIA"}>
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
              </select>
            </div>
          </div>
        ))}

        {renderSection("DETALLES TÉCNICOS", (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(formData.tipo === 'PREVENTIVA' || formData.tipo === 'PREVENTIVA_NEUMATICOS') && (
              <>
                  <div>
                    <label className="block text-sm font-medium">Pauta Mantenimiento</label>
                    <select name="pauta" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={formData.pauta || ''} onChange={handleChange}>
                        <option value="">---------</option>
                        {filteredPautas.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Kit Repuestos</label>
                    <select name="kitRepuestos" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={formData.kitRepuestos || ''} onChange={handleChange}>
                        <option value="">---------</option>
                        {kitsRepuesto.map(k => <option key={k.id} value={k.nombre}>{k.nombre}</option>)}
                    </select>
                  </div>
              </>
            )}
            {(formData.tipo.includes('CORRECTIVA') || formData.tipo.includes('EVALUATIVA')) && formData.tipo !== 'EVALUATIVA_NEUMATICOS' && (
               <>
                <div>
                  <label className="block text-sm font-medium">Tipo de Falla</label>
                  <select name="tipoFalla" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={formData.tipoFalla || ''} onChange={handleChange}>
                      <option value="">---------</option>
                      {filteredTiposFalla.map(tf => <option key={tf.id} value={tf.nombre}>{tf.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Síntomas</label>
                  <input type="text" name="sintomas" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={formData.sintomas || ''} onChange={handleChange} />
                </div>
               </>
            )}
            {formData.tipo === 'EVALUATIVA_NEUMATICOS' && (
              <>
                <div>
                  <label className="block text-sm font-medium">Inspección Tren Motriz</label>
                  <select name="inspeccionTrenMotriz" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={formData.inspeccionTrenMotriz || ''} onChange={handleChange}>
                     <option value="">Configuración Ejes...</option>
                     <option value="4x2">4x2 (6 Ruedas)</option>
                     <option value="6x2">6x2 (8 Ruedas)</option>
                     <option value="6x4">6x4 (10 Ruedas)</option>
                     <option value="8x4">8x4 (12 Ruedas)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Eje</label>
                  <input type="text" name="eje" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={formData.eje || ''} onChange={handleChange} />
                </div>
              </>
            )}
            {(formData.tipo.includes('NEUMATICOS')) && (
                <div>
                    <label className="block text-sm font-medium">Presión Neumático (PSI)</label>
                    <input type="number" name="presionNeumatico" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={formData.presionNeumatico || ''} onChange={handleChange} />
                </div>
            )}
          </div>
        ))}
        
        {renderSection("ASIGNACIÓN Y TIEMPO", (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 mb-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
              <label className="block text-sm font-bold mb-2">Tipo de Trabajador Asignado</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tecnico_tipo" value="INTERNO" checked={!formData.tecnico_tipo || formData.tecnico_tipo === 'INTERNO'} onChange={(e) => setFormData({...formData, tecnico_tipo: 'INTERNO'})} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Personal Interno</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tecnico_tipo" value="EXTERNO" checked={formData.tecnico_tipo === 'EXTERNO'} onChange={(e) => setFormData({...formData, tecnico_tipo: 'EXTERNO'})} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Personal/Empresa Externa</span>
                </label>
              </div>
            </div>

            {(!formData.tecnico_tipo || formData.tecnico_tipo === 'INTERNO') && (
              <>
                <div>
                  <label className="block text-sm font-medium">Responsable Principal</label>
                  <select name="tecnicoResponsable" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" onChange={handleChange} value={formData.tecnicoResponsable || ''} required>
                      <option value="">---------</option>
                      {personalOperativoList.map(m => <option key={m.id} value={m.name}>{m.name} ({m.roleBadgeText || m.rol?.nombre})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Personal de Apoyo (Opcional)</label>
                  <select name="personalOperativo" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" onChange={handleChange} value={formData.personalOperativo || ''}>
                      <option value="">Ninguno</option>
                      {personalOperativoList.map(m => <option key={m.id} value={m.name}>{m.name} ({m.roleBadgeText || m.rol?.nombre})</option>)}
                  </select>
                </div>
              </>
            )}

            {formData.tecnico_tipo === 'EXTERNO' && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50/50 dark:bg-orange-900/10 p-4 rounded-lg border border-orange-100 dark:border-orange-900/30">
                <div>
                  <label className="block text-sm font-medium text-orange-900 dark:text-orange-200">Nombre (Persona o Empresa)</label>
                  <input type="text" name="externo_nombre" className="w-full p-2 border border-orange-200 dark:border-orange-800/50 rounded-md dark:bg-slate-800 dark:text-slate-100" onChange={handleChange} value={formData.externo_nombre || ''} required placeholder="Ej: Taller Juanito / Juan Pérez" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-900 dark:text-orange-200">Tipo de Especialista</label>
                  <input type="text" name="externo_especialidad" className="w-full p-2 border border-orange-200 dark:border-orange-800/50 rounded-md dark:bg-slate-800 dark:text-slate-100" onChange={handleChange} value={formData.externo_especialidad || ''} required placeholder="Ej: Electromecánico, Tornero..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-900 dark:text-orange-200">Tipo de Intervención</label>
                  <select name="externo_intervencion" className="w-full p-2 border border-orange-200 dark:border-orange-800/50 rounded-md dark:bg-slate-800 dark:text-slate-100" onChange={handleChange} value={formData.externo_intervencion || ''} required>
                    <option value="">Seleccione...</option>
                    <option value="DIAGNOSTICO">Diagnóstico</option>
                    <option value="DIAGNOSTICO_REPARACION_REPUESTOS">Diagnóstico + Reparación + Repuestos</option>
                    <option value="TODO">Todo (Servicio integral)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-orange-900 dark:text-orange-200">Observaciones del Servicio Externo</label>
                  <textarea name="observaciones" rows={2} className="w-full p-2 border border-orange-200 dark:border-orange-800/50 rounded-md dark:bg-slate-800 dark:text-slate-100" onChange={handleChange} value={formData.observaciones || ''} placeholder="Detalles de lo que se va a realizar..."></textarea>
                </div>
              </div>
            )}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                  <label className="block text-sm font-medium">Fecha de Creación (OT)</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" 
                    value={(() => {
                        const d = formData.fechaCreacion ? new Date(formData.fechaCreacion) : new Date();
                        if (isNaN(d.getTime())) return '';
                        return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
                    })()}
                    onChange={(e) => {
                        const d = formData.fechaCreacion ? new Date(formData.fechaCreacion) : new Date();
                        const [y, m, day] = e.target.value.split('-').map(Number);
                        if (!isNaN(y)) {
                            d.setFullYear(y, m - 1, day);
                            setFormData({ ...formData, fechaCreacion: d.toISOString() });
                        }
                    }}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium">Fecha Programada</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" 
                    value={(() => {
                        const d = formData.fechaProgramada ? new Date(formData.fechaProgramada) : new Date();
                        if (isNaN(d.getTime())) return '';
                        return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
                    })()}
                    onChange={(e) => {
                        const d = formData.fechaProgramada ? new Date(formData.fechaProgramada) : new Date();
                        const [y, m, day] = e.target.value.split('-').map(Number);
                        if (!isNaN(y)) {
                            d.setFullYear(y, m - 1, day);
                            setFormData({ ...formData, fechaProgramada: d.toISOString() });
                        }
                    }}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium">Hora Programada (08:00 - 17:00)</label>
                  <input 
                    type="time" 
                    min="08:00"
                    max="17:00"
                    className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" 
                    value={(() => {
                        const d = formData.fechaProgramada ? new Date(formData.fechaProgramada) : new Date();
                        if (isNaN(d.getTime())) return '';
                        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                    })()}
                    onChange={(e) => {
                        let val = e.target.value;
                        const [inputH] = val.split(':').map(Number);
                        if (!isNaN(inputH)) {
                            if (inputH < 8) val = '08:00';
                            if (inputH > 17 || (inputH === 17 && val.split(':')[1] !== '00')) val = '17:00';
                        }
                        
                        const d = formData.fechaProgramada ? new Date(formData.fechaProgramada) : new Date();
                        const [h, m] = val.split(':').map(Number);
                        if (!isNaN(h)) {
                            d.setHours(h, m);
                            setFormData({ ...formData, fechaProgramada: d.toISOString() });
                        }
                    }}
                  />
              </div>
            </div>
          </div>
        ))}

        {renderSection("GESTIÓN ADMINISTRATIVA", (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium">Proveedor</label>
               <input type="text" name="proveedor" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={formData.proveedor || ''} onChange={handleChange} />
             </div>
             <div>
               <label className="block text-sm font-medium">Empresa Externa</label>
               <input type="text" name="empresaExterna" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={formData.empresaExterna || ''} onChange={handleChange} />
             </div>
             <div>
               <label className="block text-sm font-medium">RUT Empresa</label>
               <input type="text" name="rutEmpresa" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={formData.rutEmpresa || ''} onChange={handleChange} />
             </div>
             <div>
               <label className="block text-sm font-medium">Valor HH</label>
               <input type="number" name="valorHH" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={formData.valorHH || ''} onChange={handleChange} />
             </div>
             <div>
                <label className="block text-sm font-medium">Presupuesto Aprobado</label>
                <input type="number" name="presupuestoAprobado" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={formData.presupuestoAprobado || ''} onChange={handleChange} />
             </div>
             <div>
                <label className="block text-sm font-medium">Observaciones</label>
                <input type="text" name="observaciones" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" value={formData.observaciones || ''} onChange={handleChange} />
             </div>
          </div>
        ))}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="bg-cyan-600">{otToEdit ? 'Guardar Cambios' : 'Generar Orden de Trabajo'}</Button>
        </div>
      </form>
    </Modal>
  );
};
