import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Upload, FileText, FileCheck, FileWarning, Download, UserPlus, Truck, ShieldAlert, CheckCircle2, AlertCircle, X, Calendar, User, Hash, Search } from 'lucide-react';
import { exportToExcel } from '../../lib/excelExport';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../context/AuthContext';

export default function ControlDocumental() {
  const { activeCompanyId } = useCompany();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'conductores' | 'vehiculos'>('conductores');
  
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<any>(null); // For Modal
  const [modalType, setModalType] = useState<'driver' | 'vehicle' | null>(null);
  const [isAddingEntity, setIsAddingEntity] = useState<'driver' | 'vehicle' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newDriverForm, setNewDriverForm] = useState({
    nombre: '', rut: '', cargo: 'Conductor Interprovincial', tipoLicencia: 'A4', vencimientoLicencia: '', vencimientoSalud: ''
  });

  const [newVehicleForm, setNewVehicleForm] = useState({
    patente: '', tipo: 'Bus', anio: '2026', kmActual: '0', vencimientoRev: '', vencimientoSeguro: ''
  });

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [documentos, setDocumentos] = useState<any[]>([]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedEntity || !modalType) return;
    
    try {
      const file = files[0];
      const newDoc = {
        entidad_tipo: modalType === 'driver' ? 'conductor' : 'vehiculo',
        entidad_id: selectedEntity.id,
        nombre: file.name,
        estado: 'vigente'
      };

      const { data, error } = await supabase.from('operacion_documento').insert([newDoc]).select();
      if (error) throw error;

      if (data) {
        setDocumentos(prev => [...prev, ...data]);
        alert(`Archivo "${file.name}" registrado correctamente.`);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error al adjuntar el documento.');
    }
  };

  const loadDocumentos = async (entityId: string) => {
    try {
      const { data, error } = await supabase.from('operacion_documento').select('*').eq('entidad_id', entityId).order('created_at', { ascending: false });
      if (error) throw error;
      setDocumentos(data || []);
    } catch(error) {
      console.error(error);
    }
  };

  const handleDeleteDocumento = async (docId: string) => {
    if(!confirm('¿Estás seguro de que deseas eliminar este documento?')) return;
    try {
      const { error } = await supabase.from('operacion_documento').delete().eq('id', docId);
      if(error) throw error;
      setDocumentos(prev => prev.filter(d => d.id !== docId));
    } catch(e) {
      console.error(e);
      alert('Error al eliminar');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const today = new Date('2026-05-12').getTime();

  useEffect(() => {
    fetchData();
  }, [activeCompanyId]);

  const fetchData = async () => {
    try {
      let dQuery = supabase.from('colaborador').select('id, nombre, rut, rol, telefono, detalles');
      let vQuery = supabase.from('vehiculo').select('id, patente, marca, modelo, anio, kilometraje_actual, tipo, detalles');
      
      const [dRes, vRes] = await Promise.all([dQuery, vQuery]);
      
      if (dRes.data) {
        setDrivers(dRes.data.map((d: any) => ({
          ...d,
          cargo: d.rol || 'Conductor',
          tipoLicencia: d.detalles?.tipoLicencia || 'A4',
          vencimientoLicencia: d.detalles?.vencimientoLicencia || '2026-12-31',
          vencimientoSalud: d.detalles?.vencimientoSalud || '2026-12-31',
          vacaciones: d.detalles?.vacaciones || 'Al día'
        })));
      }
      
      if (vRes.data) {
        setVehicles(vRes.data.map((v: any) => ({
          ...v,
          tipo: v.tipo || 'Camión',
          anio: v.anio || 2020,
          kmActual: v.kilometraje_actual || 0,
          kmProximo: (v.kilometraje_actual || 0) + 10000,
          vencimientoRev: '2026-12-31',
          vencimientoSeguro: '2026-12-31'
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegularizar = async (entityId: string, tipoEntidad: 'driver' | 'vehicle', field: string, newValue: string, reasonDetails: string) => {
    try {
      const table = tipoEntidad === 'driver' ? 'colaborador' : 'vehiculo';
      
      const res = await supabase.from(table).select('detalles').eq('id', entityId).single();
      const currentDetails = res.data?.detalles || {};
      
      const updatedDetails = {
        ...currentDetails,
        [field]: newValue
      };

      const { error } = await supabase.from(table).update({
        detalles: updatedDetails
      }).eq('id', entityId);

      if (error) throw error;

      alert(`${reasonDetails}`);
      fetchData();
      if(selectedEntity && selectedEntity.id === entityId) {
         setSelectedEntity({...selectedEntity, ...updatedDetails});
      }
    } catch (e) {
      console.error(e);
      alert('Error al actualizar datos');
    }
  };

  // Rules Check
  const checkDriverStatus = (driver: any) => {
    const isLicenciaVencida = new Date(driver.vencimientoLicencia).getTime() < today;
    const isSaludVencida = new Date(driver.vencimientoSalud).getTime() < today;
    const isVacacionesVencidas = driver.vacaciones === 'Vencidas';
    
    if (isLicenciaVencida || isSaludVencida || isVacacionesVencidas) {
       return { status: 'BLOQUEADO', reasons: [
         isLicenciaVencida ? 'Licencia Vencida' : null,
         isSaludVencida ? 'Examen Salud Vencido' : null,
         isVacacionesVencidas ? 'Vacaciones Vencidas' : null
       ].filter(Boolean) }
    }
    return { status: 'ACTIVO', reasons: [] };
  };

  const checkVehicleStatus = (vehicle: any) => {
    const isRevVencida = new Date(vehicle.vencimientoRev).getTime() < today;
    const isSeguroVencido = new Date(vehicle.vencimientoSeguro).getTime() < today;
    const isOld = (2026 - vehicle.anio) >= 15;
    
    if (isRevVencida || isSeguroVencido || isOld) {
       return { status: 'BLOQUEADO', reasons: [
         isRevVencida ? 'Revisión Técnica Vencida' : null,
         isSeguroVencido ? 'Seguro Vencido' : null,
         isOld ? `Bloqueo automático: Unidad cumple 15+ años (Tiene ${2026 - vehicle.anio})` : null
       ].filter(Boolean) }
    }
    return { status: 'ACTIVO', reasons: [] };
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    const saveCompanyId = profile?.empresa_id;
    if (!saveCompanyId) return alert('No perteneces a una empresa asignada. Por favor contacta al administrador.');
    
    try {
      const { data, error } = await supabase.from('colaborador').insert([{
        empresa_id: saveCompanyId,
        nombre: newDriverForm.nombre,
        rut: newDriverForm.rut,
        rol: newDriverForm.cargo,
        detalles: {
          tipoLicencia: newDriverForm.tipoLicencia,
          vencimientoLicencia: newDriverForm.vencimientoLicencia,
          vencimientoSalud: newDriverForm.vencimientoSalud,
          vacaciones: 'Al día'
        }
      }]).select();
      if (error) throw error;
      alert('Conductor guardado correctamente');
      setIsAddingEntity(null);
      fetchData(); // reload
    } catch (error) {
      console.error(error);
      alert('Error al guardar conductor');
    }
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const saveCompanyId = profile?.empresa_id;
    if (!saveCompanyId) return alert('No perteneces a una empresa asignada. Por favor contacta al administrador.');
    
    try {
      const { data, error } = await supabase.from('vehiculo').insert([{
        empresa_id: saveCompanyId,
        patente: newVehicleForm.patente,
        tipo: newVehicleForm.tipo,
        anio: parseInt(newVehicleForm.anio) || 2026,
        kilometraje_actual: parseInt(newVehicleForm.kmActual) || 0,
        detalles: {
          vencimientoRev: newVehicleForm.vencimientoRev,
          vencimientoSeguro: newVehicleForm.vencimientoSeguro
        }
      }]).select();
      if (error) throw error;
      alert('Unidad guardada correctamente');
      setIsAddingEntity(null);
      fetchData(); // reload
    } catch (error) {
      console.error(error);
      alert('Error al guardar unidad');
    }
  };

  const openDriverModal = (driver: any) => {
    setSelectedEntity(driver);
    setModalType('driver');
    loadDocumentos(driver.id);
  };

  const openVehicleModal = (vehicle: any) => {
    setSelectedEntity(vehicle);
    setModalType('vehicle');
    loadDocumentos(vehicle.id);
  };

  const closeModals = () => {
    setSelectedEntity(null);
    setModalType(null);
  };

  const handleExportDrivers = () => exportToExcel(drivers.map(d => ({
    Nombre: d.nombre, RUT: d.rut, Cargo: d.cargo,
    "Venc. Licencia": d.vencimientoLicencia,
    "Venc. Salud": d.vencimientoSalud,
    Estado: checkDriverStatus(d).status
  })), 'Conductores', 'Conductores');

  const handleExportVehicles = () => exportToExcel(vehicles.map(v => ({
    Patente: v.patente, Tipo: v.tipo, Año: v.anio,
    "Venc. Rev. Técnica": v.vencimientoRev,
    "Venc. Seguro": v.vencimientoSeguro,
    Estado: checkVehicleStatus(v).status
  })), 'Vehiculos', 'Vehiculos');

  return (
    <div className="w-full flex flex-col min-h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestión de Ciclo de Vida y Documental
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
            Control de personal operativo y unidades motrices (GCV & GDC).
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'conductores' ? (
            <button onClick={() => setIsAddingEntity('driver')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 text-sm">
              <UserPlus className="w-4 h-4" /> Registrar Conductor
            </button>
          ) : (
            <button onClick={() => setIsAddingEntity('vehicle')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 text-sm">
              <Truck className="w-4 h-4" /> Registrar Vehículo
            </button>
          )}
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl w-fit">
          <button
            onClick={() => { setActiveTab('conductores'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'conductores' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <User className="w-4 h-4" /> Personal Operativo
          </button>
          <button
            onClick={() => { setActiveTab('vehiculos'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'vehiculos' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Truck className="w-4 h-4" /> Unidades Motrices
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder={activeTab === 'conductores' ? "Buscar conductor por nombre o RUT..." : "Buscar unidad por patente..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:border-indigo-500 outline-none transition-colors text-slate-900 dark:text-white shadow-sm"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full">
           
           {activeTab === 'conductores' && (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
               {drivers
                 .filter(d => d.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || d.rut.toLowerCase().includes(searchQuery.toLowerCase()))
                 .map(d => {
                 const { status, reasons } = checkDriverStatus(d);
                 return (
                   <div 
                     key={d.id} 
                     onClick={() => openDriverModal(d)}
                     className={`bg-white dark:bg-slate-900 border p-4 rounded-xl cursor-pointer hover:shadow-md transition-all ${status === 'BLOQUEADO' ? 'border-red-300 dark:border-red-900/50 hover:border-red-400' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400'}`}
                   >
                     <div className="flex justify-between items-start mb-3">
                       <div>
                         <h4 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{d.nombre}</h4>
                         <p className="text-xs text-slate-500 font-medium dark:text-slate-400">{d.rut} • {d.cargo}</p>
                       </div>
                       <Badge variant={status === 'ACTIVO' ? 'default' : 'destructive'} className={status === 'ACTIVO' ? 'bg-emerald-500 hover:bg-emerald-600' : 'animate-pulse'}>
                         {status}
                       </Badge>
                     </div>
                     <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                       <p className="text-slate-600 dark:text-slate-400">Licencia: <span className="font-bold text-slate-800 dark:text-slate-200">{d.tipoLicencia}</span></p>
                       <p className="text-slate-600 dark:text-slate-400">Vacaciones: <span className={`font-semibold ${d.vacaciones === 'Vencidas' ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>{d.vacaciones}</span></p>
                       <p className="text-slate-600 dark:text-slate-400 col-span-2">Vencimiento: <span className={`font-semibold ${reasons.some(r => r?.includes('Licencia')) ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>{d.vencimientoLicencia}</span></p>
                     </div>
                     {status === 'BLOQUEADO' && (
                       <div className="mt-3 bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-100 dark:border-red-900/30">
                         <ul className="text-xs text-red-600 dark:text-red-400 font-medium space-y-0.5">
                           {reasons.map((r, idx) => <li key={idx} className="flex gap-1.5 items-center"><AlertCircle className="w-3 h-3"/> {r}</li>)}
                         </ul>
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
           )}

           {activeTab === 'vehiculos' && (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
               {vehicles
                 .filter(v => v.patente.toLowerCase().includes(searchQuery.toLowerCase()))
                 .map(v => {
                 const { status, reasons } = checkVehicleStatus(v);
                 return (
                   <div 
                     key={v.id} 
                     onClick={() => openVehicleModal(v)}
                     className={`bg-white dark:bg-slate-900 border p-4 rounded-xl cursor-pointer hover:shadow-md transition-all ${status === 'BLOQUEADO' ? 'border-red-300 dark:border-red-900/50 hover:border-red-400' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400'}`}
                   >
                     <div className="flex justify-between items-start mb-3">
                       <div>
                         <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-wide leading-tight">{v.patente}</h4>
                         <p className="text-xs text-slate-500 font-medium dark:text-slate-400">{v.tipo} • Año {v.anio} ({2026 - v.anio} Años)</p>
                       </div>
                       <Badge variant={status === 'ACTIVO' ? 'default' : 'destructive'} className={status === 'ACTIVO' ? 'bg-emerald-500 hover:bg-emerald-600' : 'animate-pulse'}>
                         {status}
                       </Badge>
                     </div>
                     <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                       <p className="text-slate-600 dark:text-slate-400">Rev. Técnica: <span className={`font-semibold ${reasons.some(r => r?.includes('Revisión')) ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>{v.vencimientoRev}</span></p>
                       <p className="text-slate-600 dark:text-slate-400">Km: <span className="font-semibold text-slate-800 dark:text-slate-200">{v.kmActual.toLocaleString()} / {v.kmProximo.toLocaleString()}</span></p>
                     </div>
                     {status === 'BLOQUEADO' && (
                       <div className="mt-3 bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-100 dark:border-red-900/30">
                         <ul className="text-xs text-red-600 dark:text-red-400 font-medium space-y-0.5">
                           {reasons.map((r, idx) => <li key={idx} className="flex gap-1.5 items-center"><AlertCircle className="w-3 h-3"/> {r}</li>)}
                         </ul>
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
           )}

      </div>

      {/* Modal Agregar Entidad */}
      {isAddingEntity === 'driver' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-3">
                 <UserPlus className="w-5 h-5 text-indigo-500" />
                 <h2 className="font-black text-slate-800 dark:text-white text-lg">
                   Registrar Nuevo Conductor
                 </h2>
               </div>
               <button onClick={() => setIsAddingEntity(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <div className="p-6">
              <form className="space-y-4" onSubmit={handleSaveDriver}>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1 dark:text-slate-400">Nombre Completo</label>
                  <input type="text" value={newDriverForm.nombre} onChange={e => setNewDriverForm({...newDriverForm, nombre: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1 dark:text-slate-400">RUT</label>
                  <input type="text" placeholder="12.345.678-9" value={newDriverForm.rut} onChange={e => setNewDriverForm({...newDriverForm, rut: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1 dark:text-slate-400">Cargo</label>
                    <select value={newDriverForm.cargo} onChange={e => setNewDriverForm({...newDriverForm, cargo: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white">
                      <option value="Conductor Interprovincial">Conductor Interprovincial</option>
                      <option value="Conductor Interno Mina">Conductor Interno Mina</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1 dark:text-slate-400">Tipo de Licencia</label>
                    <select value={newDriverForm.tipoLicencia} onChange={e => setNewDriverForm({...newDriverForm, tipoLicencia: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white">
                      <option>A1</option>
                      <option>A2</option>
                      <option>A3</option>
                      <option>A4</option>
                      <option>A5</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1 dark:text-slate-400">Venc. Licencia</label>
                    <input type="date" value={newDriverForm.vencimientoLicencia} onChange={e => setNewDriverForm({...newDriverForm, vencimientoLicencia: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1 dark:text-slate-400">Venc. Salud</label>
                    <input type="date" value={newDriverForm.vencimientoSalud} onChange={e => setNewDriverForm({...newDriverForm, vencimientoSalud: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white" required />
                  </div>
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors">
                    Guardar Conductor
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isAddingEntity === 'vehicle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-3">
                 <Truck className="w-5 h-5 text-indigo-500" />
                 <h2 className="font-black text-slate-800 dark:text-white text-lg">
                   Registrar Nueva Unidad Motriz
                 </h2>
               </div>
               <button onClick={() => setIsAddingEntity(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <div className="p-6">
              <form className="space-y-4" onSubmit={handleSaveVehicle}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1 dark:text-slate-400">Patente</label>
                    <input type="text" placeholder="AB-CD-12" value={newVehicleForm.patente} onChange={e => setNewVehicleForm({...newVehicleForm, patente: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1 dark:text-slate-400">Tipo</label>
                    <select value={newVehicleForm.tipo} onChange={e => setNewVehicleForm({...newVehicleForm, tipo: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white">
                      <option>Bus</option>
                      <option>Camion</option>
                      <option>Minibus</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1 dark:text-slate-400">Año Inscrip.</label>
                    <input type="number" value={newVehicleForm.anio} onChange={e => setNewVehicleForm({...newVehicleForm, anio: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1 dark:text-slate-400">Km Actuales</label>
                    <input type="number" value={newVehicleForm.kmActual} onChange={e => setNewVehicleForm({...newVehicleForm, kmActual: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1 dark:text-slate-400">Venc. Rev. Técnica</label>
                    <input type="date" value={newVehicleForm.vencimientoRev} onChange={e => setNewVehicleForm({...newVehicleForm, vencimientoRev: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1 dark:text-slate-400">Venc. Seguro</label>
                    <input type="date" value={newVehicleForm.vencimientoSeguro} onChange={e => setNewVehicleForm({...newVehicleForm, vencimientoSeguro: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white" required />
                  </div>
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors">
                    Guardar Unidad
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reusable para Control Documental */}
      {(selectedEntity && modalType) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header Modal */}
            <div className={`px-6 py-4 flex justify-between items-center shrink-0 border-b ${modalType === 'driver' ? 'border-indigo-100 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-amber-100 bg-amber-50/50 dark:bg-amber-900/20'}`}>
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${modalType === 'driver' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                   {modalType === 'driver' ? <User className="w-5 h-5" /> : <Truck className="w-5 h-5"/>}
                 </div>
                 <div>
                   <h2 className="font-black text-slate-800 dark:text-white text-lg">
                     {modalType === 'driver' ? selectedEntity.nombre : selectedEntity.patente}
                   </h2>
                   <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                     {modalType === 'driver' ? `${selectedEntity.rut} - ${selectedEntity.cargo}` : `${selectedEntity.tipo} - Año ${selectedEntity.anio}`}
                   </p>
                 </div>
              </div>
              <button onClick={closeModals} className="p-1.5 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors">
                 <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
               
               {/* Documentos List */}
               <div>
                 <div className="flex justify-between items-end mb-4">
                   <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                     <FileText className="w-4 h-4 text-slate-400"/> Control Documental
                   </h3>
                   <label className="text-indigo-600 font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer">
                     <Upload className="w-3 h-3"/> Adjuntar Documento
                     <input 
                       type="file" 
                       className="hidden" 
                       ref={fileInputRef}
                       onChange={(e) => handleFileUpload(e.target.files)} 
                       multiple 
                     />
                   </label>
                 </div>
                 
                 <div 
                   className={`space-y-3 min-h-[140px] rounded-xl border-2 border-dashed p-4 transition-colors ${
                     isDragging 
                       ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' 
                       : 'border-slate-200 dark:border-slate-800'
                   }`}
                   onDragOver={handleDragOver}
                   onDragLeave={handleDragLeave}
                   onDrop={handleDrop}
                 >
                   {(!documentos || documentos.length === 0) ? (
                     <div className="h-full flex flex-col items-center justify-center py-6 text-center">
                       <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full mb-3">
                         <Upload className="w-6 h-6 text-slate-400" />
                       </div>
                       <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No hay documentos adjuntos</p>
                       <p className="text-xs font-medium text-slate-400 mt-1">Arrastra tus archivos aquí o escoge "Adjuntar Documento"</p>
                     </div>
                   ) : (
                     <>
                       {documentos.map((doc: any) => (
                         <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl hover:border-indigo-300 transition-colors group relative overflow-hidden">
                           <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-lg ${doc.estado === 'vigente' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>
                               {doc.estado === 'vigente' ? <FileCheck className="w-5 h-5" /> : <FileWarning className="w-5 h-5" />}
                             </div>
                             <div>
                               <p className="font-bold text-sm text-slate-800 dark:text-white">{doc.nombre}</p>
                               <p className={`text-[10px] font-bold uppercase tracking-wide ${doc.estado === 'vigente' ? 'text-emerald-600' : 'text-red-500'}`}>
                                 Registrado
                               </p>
                             </div>
                           </div>
                           <button onClick={() => handleDeleteDocumento(doc.id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1">
                             Eliminar
                           </button>
                         </div>
                       ))}
                     </>
                   )}
                 </div>
               </div>

               {/* Regularizacion Notice */}
               {((modalType === 'driver' && checkDriverStatus(selectedEntity).status === 'BLOQUEADO') || 
                 (modalType === 'vehicle' && checkVehicleStatus(selectedEntity).status === 'BLOQUEADO')) && (
                 <>
                   <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-900/30 flex gap-3 items-start">
                     <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                     <div>
                       <h4 className="font-black text-red-800 dark:text-red-400 text-sm">Entidad Irregular</h4>
                       <p className="text-xs text-red-700 dark:text-red-300 mt-1 font-medium">Esta entidad se encuentra bloqueada operativamente. Para reactivar, es necesario regularizar los documentos vencidos adjuntando los nuevos certificados.</p>
                     </div>
                   </div>

                   <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                     <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-3">Herramientas de Regularización</h4>
                     {modalType === 'driver' && checkDriverStatus(selectedEntity).reasons.includes('Licencia Vencida') && (
                       <div className="flex gap-2 items-center mb-3">
                         <span className="text-xs font-semibold w-1/3 text-slate-700 dark:text-slate-300">Licencia Vencida:</span>
                         <input type="date" className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white" id="nueva_licencia" defaultValue="" />
                         <button onClick={() => {
                           const v = (document.getElementById('nueva_licencia') as HTMLInputElement).value;
                           if(v) handleRegularizar(selectedEntity.id, 'driver', 'vencimientoLicencia', v, `Licencia renovada hasta ${v}`)
                         }} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition">Actualizar</button>
                       </div>
                     )}
                     {modalType === 'driver' && checkDriverStatus(selectedEntity).reasons.includes('Examen Salud Vencido') && (
                       <div className="flex gap-2 items-center mb-3">
                         <span className="text-xs font-semibold w-1/3 text-slate-700 dark:text-slate-300">Examen Vencido:</span>
                         <input type="date" className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white" id="nuevo_salud" defaultValue="" />
                         <button onClick={() => {
                           const v = (document.getElementById('nuevo_salud') as HTMLInputElement).value;
                           if(v) handleRegularizar(selectedEntity.id, 'driver', 'vencimientoSalud', v, `Examen de Salud renovado hasta ${v}`)
                         }} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition">Actualizar</button>
                       </div>
                     )}
                     {modalType === 'driver' && checkDriverStatus(selectedEntity).reasons.includes('Vacaciones Vencidas') && (
                       <div className="flex gap-2 items-center mb-3">
                         <span className="text-xs font-semibold w-1/3 text-slate-700 dark:text-slate-300">Vacaciones:</span>
                         <button onClick={() => {
                           handleRegularizar(selectedEntity.id, 'driver', 'vacaciones', 'Al día', 'Vacaciones marcadas como Al día')
                         }} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition flex-1">Marcar al día</button>
                       </div>
                     )}
                     {modalType === 'vehicle' && checkVehicleStatus(selectedEntity).reasons.includes('Revisión Técnica Vencida') && (
                       <div className="flex gap-2 items-center mb-3">
                         <span className="text-xs font-semibold w-1/3 text-slate-700 dark:text-slate-300">Rev. Técnica Vencida:</span>
                         <input type="date" className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white" id="nueva_revTec" defaultValue="" />
                         <button onClick={() => {
                           const v = (document.getElementById('nueva_revTec') as HTMLInputElement).value;
                           if(v) handleRegularizar(selectedEntity.id, 'vehicle', 'vencimientoRev', v, `Revisión Técnica renovada hasta ${v}`)
                         }} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition">Actualizar</button>
                       </div>
                     )}
                     {modalType === 'vehicle' && checkVehicleStatus(selectedEntity).reasons.includes('Seguro Vencido') && (
                       <div className="flex gap-2 items-center mb-3">
                         <span className="text-xs font-semibold w-1/3 text-slate-700 dark:text-slate-300">Seguro Vencido:</span>
                         <input type="date" className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white" id="nuevo_seguro" defaultValue="" />
                         <button onClick={() => {
                           const v = (document.getElementById('nuevo_seguro') as HTMLInputElement).value;
                           if(v) handleRegularizar(selectedEntity.id, 'vehicle', 'vencimientoSeguro', v, `Seguro renovado hasta ${v}`)
                         }} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition">Actualizar</button>
                       </div>
                     )}
                     {(modalType === 'vehicle' && checkVehicleStatus(selectedEntity).reasons.some(r => r?.includes('Bloqueo automático: Unidad cumple 15+ años'))) && (
                        <div className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-100 dark:border-red-900/30">
                          La unidad no puede ser regularizada debido a antigüedad superior a 15 años. Debe ser dada de baja.
                        </div>
                     )}
                   </div>
                 </>
               )}

               {/* Historial */}
               {selectedEntity.historial && selectedEntity.historial.length > 0 && (
                 <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                   <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                     <Calendar className="w-4 h-4 text-slate-400"/> Historial de Regularizaciones
                   </h3>
                   <div className="space-y-3">
                     {selectedEntity.historial.map((h: any) => (
                       <div key={h.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm border-l-2 border-emerald-500 pl-3">
                         <span className="text-slate-400 dark:text-slate-500 min-w-[120px] font-bold text-[11px] whitespace-nowrap">{h.fecha}</span>
                         <span className="font-semibold text-slate-800 dark:text-slate-200">{h.accion}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
