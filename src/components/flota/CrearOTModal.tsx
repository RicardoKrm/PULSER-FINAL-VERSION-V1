import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppContext } from '../../context/AppContext';
import { OrdenDeTrabajo } from '../../types';
import { logActividad } from '../../lib/supabase';

interface CrearOTModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehiculoPreseleccionadoId?: string;
}

export const CrearOTModal: React.FC<CrearOTModalProps> = ({ isOpen, onClose, vehiculoPreseleccionadoId }) => {
  const { ordenesTrabajo, crearOrdenTrabajo, vehiculos, tiposFalla, pautas, kitsRepuesto, personal } = useAppContext();
  const excludedRoles = ['super administrador', 'súper administrador', 'super admin', 'súper admin', 'administrador', 'gerente', 'administrativo'];
  
  const personalOperativoList = personal.filter(u => {
    const roleLower = (u.roleBadgeText || u.rol?.nombre || '').toLowerCase();
    return !excludedRoles.some(r => roleLower.includes(r));
  });

  // State for all fields
  const [formData, setFormData] = useState<Partial<OrdenDeTrabajo>>({
    vehiculoId: vehiculoPreseleccionadoId || '',
    tipo: 'PREVENTIVA',
    prioridad: 'MEDIA',
    kilometrajeApertura: 0,
    fechaCreacion: new Date().toISOString(),
  });

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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let insumosDesdeKit: any[] = [];
    if (formData.kitRepuestos) {
      const selectedKit = kitsRepuesto.find(k => k.nombre === formData.kitRepuestos);
      if (selectedKit && selectedKit.detalles) {
        insumosDesdeKit = selectedKit.detalles.map(det => ({
          id: Math.random().toString(36).substr(2, 9),
          nombre: det.repuesto,
          cantidad: det.cantidad,
          precioUnitario: 0 // Placeholder, as in standard the app sets this manually or fetched
        }));
      }
    }

    const folioNumbers = ordenesTrabajo
      .map(ot => {
        const match = ot.folio?.match(/OT-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));
      
    const lastNum = folioNumbers.length > 0 ? Math.max(...folioNumbers) : 0;
    const nextFolio = `OT-${String(lastNum + 1).padStart(4, '0')}`;

    const nuevaOT: OrdenDeTrabajo = {
      id: Math.random().toString(36).substr(2, 9),
      folio: nextFolio,
      vehiculoId: formData.vehiculoId || '',
      tipo: formData.tipo as any,
      estado: 'ABIERTA',
      prioridad: formData.prioridad as any,
      kilometrajeApertura: Number(formData.kilometrajeApertura),
      fechaCreacion: formData.fechaCreacion || new Date().toISOString(),
      tareasRealizadas: [],
      insumos: insumosDesdeKit,
      observacionInicial: formData.observacionInicial,
      pauta: formData.pauta,
      kitRepuestos: formData.kitRepuestos,
      tipoFalla: formData.tipoFalla,
      sintomas: formData.sintomas,
      inspeccionTrenMotriz: formData.inspeccionTrenMotriz,
      eje: formData.eje,
      presionNeumatico: formData.presionNeumatico ? Number(formData.presionNeumatico) : undefined,
      personalOperativo: formData.personalOperativo,
      proveedor: formData.proveedor,
      empresaExterna: formData.empresaExterna,
      rutEmpresa: formData.rutEmpresa,
      valorHH: formData.valorHH ? Number(formData.valorHH) : undefined,
      presupuestoAprobado: formData.presupuestoAprobado ? Number(formData.presupuestoAprobado) : undefined,
      observaciones: formData.observaciones,
      historial: [{ 
        id: Math.random().toString(36).substring(7), 
        orden_id: '',
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
      // we would use currentUser and currentCompany from Auth context but this is a demo, 
      // so if we don't have them handy in the local state, we'll let supabase triggers handle it later or omit for now
      // Actually we have personal and active companies, let's keep ids null to not break constraints if IDs don't match exactly.
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
              <input type="number" name="kilometrajeApertura" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">Prioridad</label>
              <select name="prioridad" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" onChange={handleChange}>
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
                    <select name="pauta" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" onChange={handleChange}>
                        <option value="">---------</option>
                        {filteredPautas.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Kit Repuestos</label>
                    <select name="kitRepuestos" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" onChange={handleChange}>
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
                  <select name="tipoFalla" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" onChange={handleChange}>
                      <option value="">---------</option>
                      {filteredTiposFalla.map(tf => <option key={tf.id} value={tf.nombre}>{tf.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Síntomas</label>
                  <input type="text" name="sintomas" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" onChange={handleChange} />
                </div>
               </>
            )}
            {formData.tipo === 'EVALUATIVA_NEUMATICOS' && (
              <>
                <div>
                  <label className="block text-sm font-medium">Inspección Tren Motriz</label>
                  <select name="inspeccionTrenMotriz" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" onChange={handleChange}>
                     <option value="">Configuración Ejes...</option>
                     <option value="4x2">4x2 (6 Ruedas)</option>
                     <option value="6x2">6x2 (8 Ruedas)</option>
                     <option value="6x4">6x4 (10 Ruedas)</option>
                     <option value="8x4">8x4 (12 Ruedas)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Eje</label>
                  <input type="text" name="eje" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" onChange={handleChange} />
                </div>
              </>
            )}
            {(formData.tipo.includes('NEUMATICOS')) && (
                <div>
                    <label className="block text-sm font-medium">Presión Neumático (PSI)</label>
                    <input type="number" name="presionNeumatico" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" onChange={handleChange} />
                </div>
            )}
          </div>
        ))}
        
        {renderSection("ASIGNACIÓN Y TIEMPO", (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Personal Operativo</label>
              <select name="personalOperativo" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" onChange={handleChange} required>
                  <option value="">---------</option>
                  {personalOperativoList.map(m => <option key={m.id} value={m.name}>{m.name} ({m.roleBadgeText || m.rol?.nombre})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Fecha Programada</label>
              <input type="date" name="fechaProgramada" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" onChange={handleChange} />
            </div>
          </div>
        ))}

        {renderSection("GESTIÓN ADMINISTRATIVA", (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium">Proveedor</label>
               <input type="text" name="proveedor" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" onChange={handleChange} />
             </div>
             <div>
               <label className="block text-sm font-medium">Empresa Externa</label>
               <input type="text" name="empresaExterna" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" onChange={handleChange} />
             </div>
             <div>
               <label className="block text-sm font-medium">RUT Empresa</label>
               <input type="text" name="rutEmpresa" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" onChange={handleChange} />
             </div>
             <div>
               <label className="block text-sm font-medium">Valor HH</label>
               <input type="number" name="valorHH" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" onChange={handleChange} />
             </div>
             <div>
                <label className="block text-sm font-medium">Presupuesto Aprobado</label>
                <input type="number" name="presupuestoAprobado" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" onChange={handleChange} />
             </div>
             <div>
                <label className="block text-sm font-medium">Observaciones</label>
                <input type="text" name="observaciones" className="w-full p-2 border rounded rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" onChange={handleChange} />
             </div>
          </div>
        ))}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="bg-cyan-600">Generar Orden de Trabajo</Button>
        </div>
      </form>
    </Modal>
  );
};
