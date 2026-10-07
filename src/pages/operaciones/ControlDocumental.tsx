import React, { useState, useEffect, useRef } from 'react';
import { Badge } from "../../components/ui/Badge";
import { 
  FileCheck, Truck, Users, AlertCircle, ShieldAlert, 
  CalendarClock, Search, Filter, Plus, FileText, 
  X, Save, CheckCircle2, AlertTriangle, XCircle, 
  UploadCloud, Download, Edit, Paperclip, Eye, Calendar
} from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Swal from 'sweetalert2';

export default function ControlDocumental() {
  const { activeCompanyId } = useCompany();
  const { profile } = useAuth();
  
  // Try to use activeCompanyId first, fallback to profile.empresa_id
  const saveCompanyId = activeCompanyId || profile?.empresa_id;

  const [alertConfig, setAlertConfig] = useState({
    diasAvisoLicencia: 15,
    diasAvisoSalud: 15,
    diasAvisoRevision: 30,
    diasAvisoSeguro: 30
  });

  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'unidades'>('personal');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Forms
  const [driverForm, setDriverForm] = useState({
    rut: '', nombre: '', rol: '', telefono: '',
    vencimientoLicencia: '', archivoLicencia: '',
    licenciasMedicas: [],
    vencimientoExamenes: '', archivoExamenes: '',
    fechaVacaciones: ''
  });

  const [vehicleForm, setVehicleForm] = useState({
    patente: '', marca: '', modelo: '', tipo: 'Camión', anio: new Date().getFullYear(),
    fechaInscripcion: '', tipoUso: 'Carga General',
    vencimientoRev: '', archivoRev: '',
    vencimientoSeguro: '', archivoSeguro: '',
    vencimientoPermisoCirculacion: '', archivoPermisoCirculacion: ''
  });

  // File Upload State
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadField, setCurrentUploadField] = useState<{type: 'driver'|'vehicle', field: string} | null>(null);

  const msPorDia = 24 * 60 * 60 * 1000;
  const today = new Date().getTime();

  useEffect(() => {
    if (saveCompanyId) {
      const saved = localStorage.getItem(`config_alertas_${saveCompanyId}`);
      if (saved) setAlertConfig(JSON.parse(saved));
      fetchData();
    }
  }, [saveCompanyId]);

  const fetchData = async () => {
    if (!saveCompanyId) return;
    setLoading(true);
    try {
      const { data: cols } = await supabase
        .from('colaborador')
        .select('*')
        .eq('empresa_id', saveCompanyId);
      
      const { data: vehs } = await supabase
        .from('vehiculo')
        .select('*')
        .eq('empresa_id', saveCompanyId);
      
      if (cols) setDrivers(cols);
      if (vehs) setVehicles(vehs);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // ----- FILE UPLOAD HANDLER -----
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !currentUploadField || !saveCompanyId) return;
    const file = event.target.files[0];
    
    if (file.type !== 'application/pdf') {
      Swal.fire('Error', 'Solo se permiten archivos PDF', 'error');
      return;
    }

    setUploading(true);
    try {
      const fileExt = 'pdf';
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${saveCompanyId}/${currentUploadField.type}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos_legales')
        .upload(filePath, file);

      if (uploadError) {
        console.error(uploadError);
        Swal.fire('Error de Almacenamiento', 'No se pudo subir el archivo. Por favor, asegúrate de haber creado el bucket "documentos_legales" en Supabase Storage.', 'error');
        setUploading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('documentos_legales')
        .getPublicUrl(filePath);

      const url = publicUrlData.publicUrl;

      if (currentUploadField.type === 'driver') {
        setDriverForm(prev => ({ ...prev, [currentUploadField.field]: url }));
      } else {
        setVehicleForm(prev => ({ ...prev, [currentUploadField.field]: url }));
      }

      Swal.fire('Subido', 'El documento se cargó correctamente', 'success');
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Hubo un problema subiendo el archivo', 'error');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setCurrentUploadField(null);
  };

  const triggerUpload = (type: 'driver'|'vehicle', field: string) => {
    setCurrentUploadField({ type, field });
    fileInputRef.current?.click();
  };

  // ----- STATUS CHECKERS -----
  const checkDocument = (dateStr: string, warningDays: number) => {
    if (!dateStr) return { status: 'FALTANTE', text: 'No registrado', date: '' };
    
    // Formatear a DD/MM/YYYY
    const [y, m, d] = dateStr.split('-');
    const dateFormatted = d && m && y ? `${d}/${m}/${y}` : dateStr;

    const t = new Date(dateStr).getTime();
    if (t < today) return { status: 'VENCIDO', text: 'Vencido', date: dateFormatted };
    if (t < today + warningDays * msPorDia) return { status: 'PROXIMO', text: 'Próximo a vencer', date: dateFormatted };
    return { status: 'EN ORDEN', text: 'Vigente', date: dateFormatted };
  };

  const checkDriverStatus = (driver: any) => {
    const det = driver.detalles || {};
    
    const docLicencia = checkDocument(det.vencimientoLicencia, alertConfig.diasAvisoLicencia);
    // Licencias médicas logic
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    let tieneLicenciaActiva = false;
    let tieneLicenciaVencida = false;
    let docSalud = { status: 'EN ORDEN', days: 0 };
    
    if (det.licenciasMedicas && det.licenciasMedicas.length > 0) {
       const sorted = [...det.licenciasMedicas].sort((a,b) => new Date(b.hasta).getTime() - new Date(a.hasta).getTime());
       const newest = sorted[0];
       const hastaDate = new Date(newest.hasta);
       const desdeDate = new Date(newest.desde);
       hastaDate.setHours(23,59,59,999);
       desdeDate.setHours(0,0,0,0);
       
       if (hoy >= desdeDate && hoy <= hastaDate) {
         tieneLicenciaActiva = true;
         docSalud = { status: 'VENCIDO', days: 0 }; 
       } else if (hastaDate < hoy) {
         docSalud = { status: 'EN ORDEN', days: 0 };
       }
    }
    const docExamen = checkDocument(det.vencimientoExamenes, alertConfig.diasAvisoSalud);
    const docVacaciones = checkDocument(det.fechaVacaciones, 0);
    
    let status = 'EN ORDEN';
    let reasons: string[] = [];

    if (docLicencia.status === 'VENCIDO') reasons.push('Licencia Vencida');
    if (tieneLicenciaActiva) reasons.push('Con Licencia Médica Activa');
    if (docExamen.status === 'VENCIDO') reasons.push('Examen Vencido');
    if (docVacaciones.status === 'VENCIDO') reasons.push('Vacaciones Vencidas');

    if (reasons.length > 0) {
      status = 'VENCIDO';
    } else {
      if (docLicencia.status === 'PROXIMO') reasons.push(`Licencia próxima (< ${alertConfig.diasAvisoLicencia} días)`);
      // No PROXIMO for sick leave
      if (docExamen.status === 'PROXIMO') reasons.push(`Exámenes próximos (< ${alertConfig.diasAvisoSalud} días)`);
      if (reasons.length > 0) status = 'PROXIMO';
    }

    return { 
      status, 
      reasons,
      docs: { licencia: docLicencia, salud: docSalud, examen: docExamen, vacaciones: docVacaciones }
    };
  };


  const handleExportExcel = () => {
    import('xlsx').then(XLSX => {
      const wb = XLSX.utils.book_new();

      // Exportar Conductores
      const driversData = drivers.map(d => {
        const stats = checkDriverStatus(d);
        let licenciaActivaStr = 'Apto para trabajar';
        if (d.detalles?.licenciasMedicas && d.detalles.licenciasMedicas.length > 0) {
           const hasActive = d.detalles.licenciasMedicas.some((lm:any) => {
             const h = new Date(); h.setHours(0,0,0,0);
             const de = new Date(lm.desde); de.setHours(0,0,0,0);
             const t = new Date(lm.hasta); t.setHours(23,59,59,999);
             return h >= de && h <= t;
           });
           if (hasActive) licenciaActivaStr = 'Con Licencia Médica';
        }

        return {
          'Nombre': d.nombre || '',
          'RUT': d.rut || '',
          'Cargo': d.rol || 'Conductor',
          'Teléfono': d.telefono || '',
          'Tipo Licencia': d.detalles?.tipoLicencia || '',
          'Venc. Licencia Conducir': d.detalles?.vencimientoLicencia || 'No registrado',
          'Estado Médico': licenciaActivaStr,
          'Venc. Exámenes': d.detalles?.vencimientoExamenes || 'No registrado',
          'Fecha Vacaciones': d.detalles?.fechaVacaciones || 'No registrado',
          'Estado Documental': stats.status,
          'Observaciones': stats.reasons.join(', ')
        };
      });
      const wsDrivers = XLSX.utils.json_to_sheet(driversData);
      XLSX.utils.book_append_sheet(wb, wsDrivers, 'Conductores');

      // Exportar Vehículos
      const vehiclesData = vehicles.map(v => {
        const stats = checkVehicleStatus(v);
        return {
          'Patente': v.patente || '',
          'N° Interno': v.numero_interno || '',
          'Tipo': v.tipo || '',
          'Marca': v.marca || '',
          'Modelo': v.modelo || '',
          'Año': v.anio || '',
          'Tipo Uso': v.detalles?.tipoUso || '',
          'Inscripción': v.detalles?.fechaInscripcion || '',
          'Venc. Rev. Técnica': v.detalles?.vencimientoRev || 'No registrado',
          'Venc. Seguro': v.detalles?.vencimientoSeguro || 'No registrado',
          'Venc. Permiso Circ.': v.detalles?.vencimientoPermisoCirculacion || 'No registrado',
          'Estado Documental': stats.status,
          'Observaciones': stats.reasons.join(', ')
        };
      });
      const wsVehicles = XLSX.utils.json_to_sheet(vehiclesData);
      XLSX.utils.book_append_sheet(wb, wsVehicles, 'Vehículos');

      XLSX.writeFile(wb, 'Control_Documental.xlsx');
    });
  };

  const getVidaUtil = (tipoUso: string) => {
    switch(tipoUso) {
      case 'Carga Peligrosa': return 10;
      case 'Minería': return 5;
      case 'Pasajeros': return 12;
      default: return 15;
    }
  };

  const checkVehicleStatus = (vehicle: any) => {
    const det = vehicle.detalles || {};
    
    const docRev = checkDocument(det.vencimientoRev, alertConfig.diasAvisoRevision);
    const docSeguro = checkDocument(det.vencimientoSeguro, alertConfig.diasAvisoSeguro);
    const docPermiso = checkDocument(det.vencimientoPermisoCirculacion, 30);
    
    let docVidaUtil = { status: 'EN ORDEN', text: 'Vigente' };
    const vidaUtilMax = getVidaUtil(det.tipoUso);
    if (det.fechaInscripcion) {
      const yearInscripcion = new Date(det.fechaInscripcion).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - yearInscripcion;
      if (age >= vidaUtilMax) docVidaUtil = { status: 'VENCIDO', text: `Excedida (${age}/${vidaUtilMax} años)` };
      else if (age === vidaUtilMax - 1) docVidaUtil = { status: 'PROXIMO', text: 'Último año' };
      else docVidaUtil.text = `${age}/${vidaUtilMax} años`;
    } else {
      docVidaUtil = { status: 'FALTANTE', text: 'Sin fecha insc.' };
    }

    let status = 'EN ORDEN';
    let reasons: string[] = [];

    if (docRev.status === 'VENCIDO') reasons.push('Rev. Técnica Vencida');
    if (docSeguro.status === 'VENCIDO') reasons.push('Seguro Vencido');
    if (docPermiso.status === 'VENCIDO') reasons.push('Permiso Circulación Vencido');
    if (docVidaUtil.status === 'VENCIDO') reasons.push(docVidaUtil.text);

    if (reasons.length > 0) {
      status = 'VENCIDO';
    } else {
      if (docRev.status === 'PROXIMO') reasons.push(`Revisión próxima (< ${alertConfig.diasAvisoRevision} días)`);
      if (docSeguro.status === 'PROXIMO') reasons.push(`Seguro próximo (< ${alertConfig.diasAvisoSeguro} días)`);
      if (docPermiso.status === 'PROXIMO') reasons.push(`Permiso próximo (< 30 días)`);
      if (docVidaUtil.status === 'PROXIMO') reasons.push(docVidaUtil.text);
      if (reasons.length > 0) status = 'PROXIMO';
    }

    return { 
      status, 
      reasons,
      docs: { rev: docRev, seguro: docSeguro, permiso: docPermiso, vida: docVidaUtil }
    };
  };

  // ----- CRUD HANDLERS -----
  const handleEditDriver = (driver: any) => {
    const det = driver.detalles || {};
    setDriverForm({
      rut: driver.rut || '',
      nombre: driver.nombre || '',
      rol: driver.rol || '',
      telefono: driver.telefono || '',
      vencimientoLicencia: det.vencimientoLicencia || '',
      archivoLicencia: det.archivoLicencia || '',
      vencimientoSalud: det.vencimientoSalud || '',
      archivoSalud: det.archivoSalud || '',
      vencimientoExamenes: det.vencimientoExamenes || '',
      archivoExamenes: det.archivoExamenes || '',
      fechaVacaciones: det.fechaVacaciones || ''
    });
    setEditingId(driver.id);
    setIsEditing(true);
    setShowDriverModal(true);
  };

  const handleEditVehicle = (vehicle: any) => {
    const det = vehicle.detalles || {};
    setVehicleForm({
      patente: vehicle.patente || '',
      marca: vehicle.marca || '',
      modelo: vehicle.modelo || '',
      tipo: vehicle.tipo || 'Camión',
      anio: vehicle.anio || new Date().getFullYear(),
      fechaInscripcion: det.fechaInscripcion || '',
      tipoUso: det.tipoUso || 'Carga General',
      vencimientoRev: det.vencimientoRev || '',
      archivoRev: det.archivoRev || '',
      vencimientoSeguro: det.vencimientoSeguro || '',
      archivoSeguro: det.archivoSeguro || '',
      vencimientoPermisoCirculacion: det.vencimientoPermisoCirculacion || '',
      archivoPermisoCirculacion: det.archivoPermisoCirculacion || ''
    });
    setEditingId(vehicle.id);
    setIsEditing(true);
    setShowVehicleModal(true);
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveCompanyId) return;
    const payload = {
      empresa_id: saveCompanyId,
      rut: driverForm.rut,
      nombre: driverForm.nombre,
      rol: driverForm.rol,
      telefono: driverForm.telefono,
      detalles: {
        vencimientoLicencia: driverForm.vencimientoLicencia,
        archivoLicencia: driverForm.archivoLicencia,
        vencimientoSalud: driverForm.vencimientoSalud,
        archivoSalud: driverForm.archivoSalud,
        vencimientoExamenes: driverForm.vencimientoExamenes,
        archivoExamenes: driverForm.archivoExamenes,
        fechaVacaciones: driverForm.fechaVacaciones
      }
    };

    try {
      if (isEditing && editingId) {
        await supabase.from('colaborador').update(payload).eq('id', editingId);
        Swal.fire('Actualizado', 'Ficha de conductor actualizada', 'success');
      } else {
        await supabase.from('colaborador').insert([payload]);
        Swal.fire('Registrado', 'Conductor registrado', 'success');
      }
      setShowDriverModal(false);
      fetchData();
    } catch(err) {
      Swal.fire('Error', 'Hubo un error al guardar', 'error');
    }
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveCompanyId) return;
    const payload = {
      empresa_id: saveCompanyId,
      patente: vehicleForm.patente,
      marca: vehicleForm.marca,
      modelo: vehicleForm.modelo,
      tipo: vehicleForm.tipo,
      anio: vehicleForm.anio,
      detalles: {
        fechaInscripcion: vehicleForm.fechaInscripcion,
        tipoUso: vehicleForm.tipoUso,
        vencimientoRev: vehicleForm.vencimientoRev,
        archivoRev: vehicleForm.archivoRev,
        vencimientoSeguro: vehicleForm.vencimientoSeguro,
        archivoSeguro: vehicleForm.archivoSeguro,
        vencimientoPermisoCirculacion: vehicleForm.vencimientoPermisoCirculacion,
        archivoPermisoCirculacion: vehicleForm.archivoPermisoCirculacion
      }
    };

    try {
      if (isEditing && editingId) {
        await supabase.from('vehiculo').update(payload).eq('id', editingId);
        Swal.fire('Actualizado', 'Ficha de vehículo actualizada', 'success');
      } else {
        await supabase.from('vehiculo').insert([payload]);
        Swal.fire('Registrado', 'Vehículo registrado', 'success');
      }
      setShowVehicleModal(false);
      fetchData();
    } catch(err) {
      Swal.fire('Error', 'Hubo un error al guardar', 'error');
    }
  };

  const handleDelete = async (table: string, id: string) => {
    if(!confirm("¿Estás seguro de eliminar este registro?")) return;
    try {
      await supabase.from(table).delete().eq('id', id);
      fetchData();
    } catch(err) {}
  };

  // ----- RENDER COMPONENTS -----
  const renderStatusDot = (status: string) => {
    if (status === 'EN ORDEN') return <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>;
    if (status === 'PROXIMO') return <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse"></div>;
    if (status === 'VENCIDO') return <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse"></div>;
    return <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>; // FALTANTE
  };

  const renderFileAction = (url: string, type: 'driver'|'vehicle', field: string) => {
    if (url) {
      return (
        <div className="flex gap-1">
          <a href={url} target="_blank" rel="noreferrer" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-blue-500" title="Ver Documento">
            <Eye className="w-4 h-4" />
          </a>
          <button type="button" onClick={(e) => { e.stopPropagation(); triggerUpload(type, field); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500" title="Reemplazar">
            <UploadCloud className="w-4 h-4" />
          </button>
        </div>
      );
    }
    return (
      <button type="button" onClick={(e) => { e.stopPropagation(); triggerUpload(type, field); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400" title="Subir Documento PDF">
        <UploadCloud className="w-4 h-4" />
      </button>
    );
  };

  const renderDocRow = (label: string, docObj: any, url: string | undefined, type: 'driver'|'vehicle', uploadField: string) => (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex items-center gap-2">
        {renderStatusDot(docObj.status)}
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}:</span>
        <span className={`text-xs font-bold ${docObj.status === 'VENCIDO' ? 'text-red-600' : docObj.status === 'PROXIMO' ? 'text-amber-600' : 'text-slate-800 dark:text-white'}`}>
          {docObj.date ? `${docObj.date} (${docObj.text})` : docObj.text}
        </span>
      </div>
      {uploadField && renderFileAction(url || '', type, uploadField)}
    </div>
  );

  return (
    <div className="p-6 w-full max-w-[1600px] mx-auto space-y-6">
      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileUpload} />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <FileCheck className="w-8 h-8 text-indigo-500" />
            Control de Ciclo de Vida y Documental
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
            Sistema centralizado de vigencias, certificaciones y documentos legales.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2 transition-all shadow-sm">
              <Download className="w-4 h-4" /> Exportar
            </button>
            <button onClick={() => { setDriverForm({rut:'', nombre:'', rol:'', telefono:'', vencimientoLicencia:'', archivoLicencia:'', licenciasMedicas:[], vencimientoExamenes:'', archivoExamenes:'', fechaVacaciones:''}); setIsEditing(false); setShowDriverModal(true); }} className="bg-white dark:bg-slate-900 text-indigo-600 border border-indigo-200 dark:border-indigo-900 px-4 py-2 rounded-xl font-bold hover:bg-indigo-50 flex items-center gap-2 transition-all shadow-sm">
            <Users className="w-4 h-4" /> Registrar Conductor
          </button>
          <button onClick={() => { setVehicleForm({patente:'', marca:'', modelo:'', tipo:'Camión', anio:new Date().getFullYear(), fechaInscripcion:'', tipoUso:'Carga General', vencimientoRev:'', archivoRev:'', vencimientoSeguro:'', archivoSeguro:'', vencimientoPermisoCirculacion:'', archivoPermisoCirculacion:''}); setIsEditing(false); setShowVehicleModal(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 transition-all shadow-sm">
            <Truck className="w-4 h-4" /> Registrar Vehículo
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        <button onClick={() => setActiveTab('personal')} className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'personal' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Users className="w-4 h-4" /> Personal Operativo
        </button>
        <button onClick={() => setActiveTab('unidades')} className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'unidades' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Truck className="w-4 h-4" /> Unidades Motrices
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {activeTab === 'personal' && drivers.map(d => {
          const { status, reasons, docs } = checkDriverStatus(d);
          const det = d.detalles || {};
          return (
            <div key={d.id} className={`bg-white dark:bg-slate-900 border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all ${status === 'VENCIDO' ? 'border-red-300 dark:border-red-900/50' : status === 'PROXIMO' ? 'border-amber-300 dark:border-amber-900/50' : 'border-slate-200 dark:border-slate-800'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{d.nombre}</h4>
                  <p className="text-xs text-slate-500 mt-1">{d.rut} • {d.rol || 'Conductor'}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleEditDriver(d)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400"><Edit className="w-4 h-4"/></button>
                  <button onClick={() => handleDelete('colaborador', d.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-400"><X className="w-4 h-4"/></button>
                </div>
              </div>

              <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {renderDocRow('Licencia', docs.licencia, det.archivoLicencia, 'driver', 'archivoLicencia')}
                {(() => {
                    const hasActive = det.licenciasMedicas && det.licenciasMedicas.some((lm:any) => {
                      const h = new Date(); h.setHours(0,0,0,0);
                      const d = new Date(lm.desde); d.setHours(0,0,0,0);
                      const t = new Date(lm.hasta); t.setHours(23,59,59,999);
                      return h >= d && h <= t;
                    });
                    const color = hasActive ? 'bg-red-500' : 'bg-emerald-500';
                    const text = hasActive ? 'Con Licencia Médica' : 'Apto para trabajar';
                    return (
                      <div className="flex items-center justify-between p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Licencias Médicas</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-500">{text}</span>
                          <div className={`w-3 h-3 rounded-full ${color} shadow-sm border border-white dark:border-slate-800`}></div>
                        </div>
                      </div>
                    );
                  })()}
                {renderDocRow('Examen Med.', docs.examen, det.archivoExamenes, 'driver', 'archivoExamenes')}
                {renderDocRow('Vacaciones', docs.vacaciones, null, 'driver', '')}
              </div>

              {status !== 'EN ORDEN' && (
                <div className={`mt-3 p-3 rounded-xl border text-xs font-bold ${status === 'VENCIDO' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-4 h-4" /> Alertas:
                  </div>
                  <ul className="pl-5 list-disc font-medium opacity-90 space-y-0.5">
                    {reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )
        })}

        {activeTab === 'unidades' && vehicles.map(v => {
          const { status, reasons, docs } = checkVehicleStatus(v);
          const det = v.detalles || {};
          return (
            <div key={v.id} className={`bg-white dark:bg-slate-900 border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all ${status === 'VENCIDO' ? 'border-red-300 dark:border-red-900/50' : status === 'PROXIMO' ? 'border-amber-300 dark:border-amber-900/50' : 'border-slate-200 dark:border-slate-800'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-xl tracking-wide uppercase">{v.patente}</h4>
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded inline-block mt-1">
                    {det.tipoUso || 'Carga General'} • Año {v.anio}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleEditVehicle(v)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400"><Edit className="w-4 h-4"/></button>
                  <button onClick={() => handleDelete('vehiculo', v.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-400"><X className="w-4 h-4"/></button>
                </div>
              </div>

              <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {renderDocRow('Rev. Técnica', docs.rev, det.archivoRev, 'vehicle', 'archivoRev')}
                {renderDocRow('Seguro', docs.seguro, det.archivoSeguro, 'vehicle', 'archivoSeguro')}
                {renderDocRow('Permiso', docs.permiso, det.archivoPermisoCirculacion, 'vehicle', 'archivoPermisoCirculacion')}
                {renderDocRow('Vida Útil', docs.vida, null, 'vehicle', '')}
              </div>

              {status !== 'EN ORDEN' && (
                <div className={`mt-3 p-3 rounded-xl border text-xs font-bold ${status === 'VENCIDO' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-4 h-4" /> Alertas:
                  </div>
                  <ul className="pl-5 list-disc font-medium opacity-90 space-y-0.5">
                    {reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showDriverModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                {isEditing ? 'Editar Ficha de Conductor' : 'Registrar Nuevo Conductor'}
              </h2>
              <button type="button" onClick={() => setShowDriverModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveDriver} className="p-6 h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">RUT</label>
                  <input required value={driverForm.rut} onChange={e=>setDriverForm({...driverForm, rut: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg" placeholder="12.345.678-9"/>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nombre Completo</label>
                  <input required value={driverForm.nombre} onChange={e=>setDriverForm({...driverForm, nombre: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Rol / Cargo</label>
                  <input required value={driverForm.rol} onChange={e=>setDriverForm({...driverForm, rol: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Teléfono</label>
                  <input value={driverForm.telefono} onChange={e=>setDriverForm({...driverForm, telefono: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg" />
                </div>
                
                <div className="col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-4">Fechas de Vencimiento</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Venc. Licencia</label>
                      <input type="date" required value={driverForm.vencimientoLicencia} onChange={e=>setDriverForm({...driverForm, vencimientoLicencia: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg" />
                    </div>
                    
                    <div className="space-y-2 col-span-1 md:col-span-2">
                      <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Historial de Licencias Médicas</label>
                        <button type="button" onClick={() => setDriverForm({...driverForm, licenciasMedicas: [...(driverForm.licenciasMedicas||[]), {desde: '', hasta: '', archivo: '', motivo: ''}]})} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Agregar Licencia
                        </button>
                      </div>
                      
                      {(driverForm.licenciasMedicas || []).map((lic: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 relative group">
                          <button type="button" onClick={() => { const nl = [...driverForm.licenciasMedicas]; nl.splice(idx, 1); setDriverForm({...driverForm, licenciasMedicas: nl}); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Desde</label>
                            <input type="date" value={lic.desde} onChange={(e) => { const nl = [...driverForm.licenciasMedicas]; nl[idx].desde = e.target.value; setDriverForm({...driverForm, licenciasMedicas: nl}); }} className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border rounded" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Hasta</label>
                            <input type="date" value={lic.hasta} onChange={(e) => { const nl = [...driverForm.licenciasMedicas]; nl[idx].hasta = e.target.value; setDriverForm({...driverForm, licenciasMedicas: nl}); }} className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border rounded" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Motivo (Opcional)</label>
                            <input type="text" value={lic.motivo || ''} placeholder="Ej: Reposo" onChange={(e) => { const nl = [...driverForm.licenciasMedicas]; nl[idx].motivo = e.target.value; setDriverForm({...driverForm, licenciasMedicas: nl}); }} className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border rounded" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Certificado PDF</label>
                            <div className="flex items-center gap-1">
                                {lic.archivo ? (
                                  <div className="flex items-center gap-1 w-full">
                                    <a href={lic.archivo} target="_blank" rel="noreferrer" className="flex-1 truncate text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1.5 rounded border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                                      <Eye className="w-3 h-3" /> Ver
                                    </a>
                                    <button type="button" onClick={() => { const nl = [...driverForm.licenciasMedicas]; nl[idx].archivo = ''; setDriverForm({...driverForm, licenciasMedicas: nl}); }} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded border border-red-200 dark:border-red-800 transition-colors">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button type="button" onClick={() => triggerUpload('driver', 'licencia_medica_' + idx)} className="w-full cursor-pointer flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                    <UploadCloud className="w-3 h-3" />
                                    <span>Subir PDF</span>
                                  </button>
                                )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!driverForm.licenciasMedicas || driverForm.licenciasMedicas.length === 0) && (
                        <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 border border-dashed rounded-lg text-sm text-slate-500">
                          Sin historial de licencias médicas.
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Venc. Examen Médico/Preocupacional</label>
                      <input type="date" value={driverForm.vencimientoExamenes} onChange={e=>setDriverForm({...driverForm, vencimientoExamenes: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Fecha Límite Vacaciones</label>
                      <input type="date" value={driverForm.fechaVacaciones} onChange={e=>setDriverForm({...driverForm, fechaVacaciones: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowDriverModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 flex items-center gap-2">
                  <Save className="w-4 h-4"/> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVehicleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-500" />
                {isEditing ? 'Editar Ficha de Vehículo' : 'Registrar Nuevo Vehículo'}
              </h2>
              <button type="button" onClick={() => setShowVehicleModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveVehicle} className="p-6 h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Patente</label>
                  <input required value={vehicleForm.patente} onChange={e=>setVehicleForm({...vehicleForm, patente: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg font-mono uppercase" placeholder="ABCD-12"/>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
                  <select required value={vehicleForm.tipo} onChange={e=>setVehicleForm({...vehicleForm, tipo: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg">
                    <option>Camión</option>
                    <option>Tractocamión</option>
                    <option>Remolque</option>
                    <option>Semiremolque</option>
                    <option>Furgón</option>
                    <option>Camioneta</option>
                    <option>Bus</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Marca / Modelo</label>
                  <input value={vehicleForm.marca + (vehicleForm.modelo ? ' ' + vehicleForm.modelo : '')} onChange={e=>{
                    const parts = e.target.value.split(' ');
                    setVehicleForm({...vehicleForm, marca: parts[0] || '', modelo: parts.slice(1).join(' ')})
                  }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg" placeholder="Ej: Mercedes Benz Actros"/>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Año Fabricación</label>
                  <input type="number" required value={vehicleForm.anio} onChange={e=>setVehicleForm({...vehicleForm, anio: parseInt(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg" />
                </div>
                <div className="space-y-1 col-span-2 md:col-span-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Uso (Operación)</label>
                  <select required value={vehicleForm.tipoUso} onChange={e=>setVehicleForm({...vehicleForm, tipoUso: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg">
                    <option>Carga General</option>
                    <option>Carga Peligrosa</option>
                    <option>Pasajeros</option>
                    <option>Minería</option>
                  </select>
                </div>
                
                <div className="col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-4">Fechas de Ciclo de Vida y Legal</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-500">Fecha Primera Inscripción</label>
                      <input type="date" required value={vehicleForm.fechaInscripcion} onChange={e=>setVehicleForm({...vehicleForm, fechaInscripcion: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg" />
                    </div>
                    <div className="space-y-1 col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-500">Venc. Rev. Técnica</label>
                      <input type="date" required value={vehicleForm.vencimientoRev} onChange={e=>setVehicleForm({...vehicleForm, vencimientoRev: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg" />
                    </div>
                    <div className="space-y-1 col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-500">Venc. Seguro Obligatorio</label>
                      <input type="date" required value={vehicleForm.vencimientoSeguro} onChange={e=>setVehicleForm({...vehicleForm, vencimientoSeguro: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg" />
                    </div>
                    <div className="space-y-1 col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-500">Venc. Permiso Circulación</label>
                      <input type="date" required value={vehicleForm.vencimientoPermisoCirculacion} onChange={e=>setVehicleForm({...vehicleForm, vencimientoPermisoCirculacion: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowVehicleModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 flex items-center gap-2">
                  <Save className="w-4 h-4"/> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-white font-bold text-xl">Subiendo documento a la nube...</h2>
        </div>
      )}

    </div>
  );
}



