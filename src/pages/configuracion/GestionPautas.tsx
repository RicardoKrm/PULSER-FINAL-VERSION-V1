import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { 
  Plus, 
  Trash2, 
  Search, 
  Edit3,
  FileText,
  Activity,
  Car,
  Settings,
  X
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import Swal from 'sweetalert2';

interface Pauta {
  id: string;
  nombre: string;
  modeloVehiculo: string;
  kilometrajeInicial: number;
  intervalo1: number;
  intervalo2?: number;
  tareas: string[]; // now an array of task IDs or descriptions
  archivoPdf?: string;
  tipoAplicacion: string;
  tipoAceite: string;
  color: string;
  estado: 'Activo' | 'Inactivo';
}

interface ModeloVehiculo {
  id: string;
  nombre: string;
  marca: string;
  anio: number;
}

interface Tarea {
  id: string;
  descripcion: string;
}

export default function GestionPautas() {
  const { currentCompany } = useCompany();
  const [pautas, setPautas] = useState<Pauta[]>([]);
  const [modelos, setModelos] = useState<ModeloVehiculo[]>([]);
  const [tareasDisponibles, setTareasDisponibles] = useState<Tarea[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModeloModalOpen, setIsModeloModalOpen] = useState(false);
  const [editingPautaId, setEditingPautaId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state Pauta
  const [nombre, setNombre] = useState('');
  const [modeloVehiculoId, setModeloVehiculoId] = useState('');
  const [kilometrajeInicial, setKilometrajeInicial] = useState<number | ''>('');
  const [intervalo1, setIntervalo1] = useState<number | ''>('');
  const [intervalo2, setIntervalo2] = useState<number | ''>('');
  const [selectedTareas, setSelectedTareas] = useState<string[]>([]);
  const [archivoPdf, setArchivoPdf] = useState<File | null>(null);
  const [tipoAplicacion, setTipoAplicacion] = useState('');
  const [tipoAceite, setTipoAceite] = useState('');

  // Form state Modelo
  const [nombreModelo, setNombreModelo] = useState('');
  const [marcaModelo, setMarcaModelo] = useState('');
  const [anioModelo, setAnioModelo] = useState<number | ''>('');

  useEffect(() => {
    fetchData();
  }, [currentCompany?.id]);

  const fetchData = async () => {
    if (!currentCompany?.id) return;
    try {
      const [pautasRes, modelosRes, tareasRes] = await Promise.all([
        supabase.from('mantenimiento_pauta').select('*, modelo:mantenimiento_modelo_vehiculo(nombre)').eq('empresa_id', currentCompany.id),
        supabase.from('mantenimiento_modelo_vehiculo').select('*').eq('empresa_id', currentCompany.id),
        supabase.from('mantenimiento_tarea').select('id, descripcion').eq('empresa_id', currentCompany.id).eq('estado', 'Activo')
      ]);

      if (modelosRes.data) {
        setModelos(modelosRes.data.map(m => ({
          id: m.id, nombre: m.nombre, marca: m.marca || '', anio: m.anio || 0
        })));
      }

      if (tareasRes.data) {
        setTareasDisponibles(tareasRes.data.map(t => ({
          id: t.id, descripcion: t.descripcion
        })));
      }

      if (pautasRes.data) {
        setPautas(pautasRes.data.map(p => ({
          id: p.id,
          nombre: p.nombre,
          modeloVehiculo: p.modelo?.nombre || 'Desconocido',
          kilometrajeInicial: p.kilometraje_inicial,
          intervalo1: p.intervalo_1,
          intervalo2: p.intervalo_2,
          tareas: Array.isArray(p.tareas) ? p.tareas : [],
          archivoPdf: p.archivo_pdf,
          tipoAplicacion: p.tipo_aplicacion || '',
          tipoAceite: p.tipo_aceite || '',
          color: p.color,
          estado: p.estado as any
        })));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const filteredPautas = pautas.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.modeloVehiculo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !modeloVehiculoId || !currentCompany?.id) return;

    try {
      let archivoPdfUrl = undefined;

      if (archivoPdf) {
        const fileExt = archivoPdf.name.split('.').pop();
        const fileName = `${currentCompany.id}_${Date.now()}.${fileExt}`;
        const filePath = `pautas/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('pautas_documentos')
          .upload(filePath, archivoPdf);

        if (uploadError) {
           console.error("Upload error", uploadError);
           Swal.fire('Advertencia', 'Pauta guardada, pero hubo un error al subir el PDF. Asegúrate de que el bucket "pautas_documentos" esté creado de forma pública en Supabase.', 'warning');
        } else {
           const { data: publicUrlData } = supabase.storage
             .from('pautas_documentos')
             .getPublicUrl(filePath);
             
           archivoPdfUrl = publicUrlData.publicUrl;
        }
      }

      const payload: any = {
        empresa_id: currentCompany.id,
        nombre,
        modelo_vehiculo_id: modeloVehiculoId,
        kilometraje_inicial: Number(kilometrajeInicial) || 0,
        intervalo_1: Number(intervalo1) || 0,
        intervalo_2: intervalo2 ? Number(intervalo2) : null,
        tareas: selectedTareas,
        tipo_aplicacion: tipoAplicacion,
        tipo_aceite: tipoAceite,
        color: 'bg-blue-500',
        estado: 'Activo'
      };

      if (archivoPdfUrl) {
        payload.archivo_pdf = archivoPdfUrl;
      }

      if (editingPautaId) {
        const { error } = await supabase.from('mantenimiento_pauta').update(payload).eq('id', editingPautaId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('mantenimiento_pauta').insert([payload]);
        if (error) throw error;
      }
      
      Swal.fire({
        title: '¡Guardado!', 
        text: 'La pauta ha sido guardada exitosamente.', 
        icon: 'success',
        confirmButtonColor: '#4f46e5'
      });
      
      setIsModalOpen(false);
      resetPautaForm();
      fetchData();
    } catch (err: any) {
      console.error('Error saving pauta:', err);
      Swal.fire('Error', 'No se pudo guardar la pauta.', 'error');
    }
  };

  const handleEditPauta = (pauta: Pauta) => {
    const selectedModel = modelos.find(m => m.nombre === pauta.modeloVehiculo);
    if (selectedModel) setModeloVehiculoId(selectedModel.id);
    
    setEditingPautaId(pauta.id);
    setNombre(pauta.nombre);
    setKilometrajeInicial(pauta.kilometrajeInicial);
    setIntervalo1(pauta.intervalo1);
    setIntervalo2(pauta.intervalo2 || '');
    setSelectedTareas(pauta.tareas || []);
    setTipoAplicacion(pauta.tipoAplicacion);
    setTipoAceite(pauta.tipoAceite);
    
    setIsModalOpen(true);
  };

  const handleSubmitModelo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreModelo || !currentCompany?.id) return;

    try {
      const { data, error } = await supabase.from('mantenimiento_modelo_vehiculo').insert([{
        empresa_id: currentCompany.id,
        nombre: nombreModelo,
        marca: marcaModelo,
        anio: Number(anioModelo) || null
      }]);

      if (error) throw error;

      Swal.fire('Guardado', 'Modelo creado correctamente', 'success');
      setIsModeloModalOpen(false);
      setNombreModelo('');
      setMarcaModelo('');
      setAnioModelo('');
      fetchData();
    } catch (err) {
      console.error('Error creating modelo:', err);
      Swal.fire('Error', 'No se pudo crear el modelo.', 'error');
    }
  };

  const resetPautaForm = () => {
    setEditingPautaId(null);
    setNombre('');
    setModeloVehiculoId('');
    setKilometrajeInicial('');
    setIntervalo1('');
    setIntervalo2('');
    setSelectedTareas([]);
    setArchivoPdf(null);
    setTipoAplicacion('');
    setTipoAceite('');
  };

  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: '¿Confirmar eliminación?',
      text: `Se eliminará permanentemente la pauta: "${name}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { error } = await supabase.from('mantenimiento_pauta').delete().eq('id', id);
          if (error) throw error;
          setPautas(pautas.filter(p => p.id !== id));
          Swal.fire('Eliminado!', 'La pauta fue borrada exitosamente.', 'success');
        } catch (err) {
          console.error("Error deleting pauta", err);
          Swal.fire('Error', 'Hubo un error', 'error');
        }
      }
    });
  };

  const toggleTarea = (tareaId: string) => {
    setSelectedTareas(prev => 
      prev.includes(tareaId) ? prev.filter(t => t !== tareaId) : [...prev, tareaId]
    );
  };

  const colors = [
    'bg-slate-500', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
    'bg-emerald-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-fuchsia-500', 'bg-rose-500'
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
             <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-500" />
             Pautas de Mantenimiento
          </h1>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-sm">Configuración de ciclos preventivos y servicios por kilometraje.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button 
            className="flex items-center gap-2 font-bold px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-5 h-5" /> Nueva Pauta
          </Button>
        </div>
      </div>

      {/* Toolbox */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o modelo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all dark:text-white"
            />
         </div>
         <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <div className="px-4 py-1.5 text-sm font-bold text-slate-500 dark:text-slate-400">Total: <span className="text-indigo-600 dark:text-indigo-400">{pautas.length}</span></div>
         </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPautas.map((pauta) => (
          <div key={pauta.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden flex flex-col h-full">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${pauta.color}`}></div>
            
            <div className="flex justify-between items-start mb-4">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                     <div className={`w-3 h-3 rounded-full ${pauta.color} shadow-sm border border-white dark:border-slate-800`}></div>
                     <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">ID: {pauta.id.slice(0, 5)}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight pr-4">{pauta.nombre}</h3>
               </div>
               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditPauta(pauta)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                     <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(pauta.id, pauta.nombre)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                     <Trash2 className="w-4 h-4" />
                  </button>
               </div>
            </div>

            <div className="space-y-3 mb-6 flex-1">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                <Car className="w-4 h-4 text-slate-400" />
                <span>{pauta.modeloVehiculo}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Intervalo: {pauta.intervalo1.toLocaleString()} KM</span>
              </div>
              {pauta.archivoPdf && (
                <div className="flex items-center gap-2 mt-2">
                  <a 
                    href={pauta.archivoPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                  >
                    <FileText className="w-3 h-3" />
                    Ver PDF Adjunto
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-auto">
               <div className="flex items-center gap-2 max-w-[60%]">
                  <Activity className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className={`text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-500 truncate`} title={pauta.tipoAplicacion}>
                     {pauta.tipoAplicacion || 'N/A'}
                  </span>
               </div>
               <div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                     pauta.estado === 'Activo' 
                     ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
                     : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                     {pauta.estado}
                  </span>
               </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPautas.length === 0 && (
         <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-700 dark:text-slate-200 mb-1">No hay pautas de mantenimiento</h3>
            <p className="text-slate-500 text-sm font-medium">No se encontraron resultados para tu búsqueda.</p>
         </div>
      )}

      {/* Modal - Nueva Pauta */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          resetPautaForm();
        }}
        title={editingPautaId ? "Editar Pauta de Mantenimiento" : "Crear Nueva Pauta de Mantenimiento"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
              <input 
                type="text" 
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:text-white transition-all" 
              />
           </div>

           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Modelo vehiculo</label>
              <div className="flex gap-2">
                 <select 
                   value={modeloVehiculoId}
                   onChange={(e) => setModeloVehiculoId(e.target.value)}
                   required
                   className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:text-white transition-all"
                 >
                    <option value="">---------</option>
                    {modelos.map(m => (
                       <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                 </select>
                 <button 
                   type="button"
                   onClick={() => setIsModeloModalOpen(true)}
                   title="Crear Nuevo Modelo"
                   className="px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-md transition-colors flex items-center justify-center"
                 >
                    <Plus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                 </button>
              </div>
           </div>

           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kilometraje Inicial</label>
              <input 
                type="number"
                value={kilometrajeInicial}
                onChange={(e) => setKilometrajeInicial(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:text-white transition-all"
              />
           </div>

           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Intervalo 1 (KM)</label>
              <input 
                type="number"
                value={intervalo1}
                required
                onChange={(e) => setIntervalo1(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:text-white transition-all"
              />
           </div>

           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Intervalo 2 (KM) - Opcional</label>
              <input 
                type="number"
                value={intervalo2}
                onChange={(e) => setIntervalo2(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:text-white transition-all"
              />
           </div>

           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tareas</label>
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md max-h-48 overflow-y-auto p-2">
                 {tareasDisponibles.length === 0 ? (
                    <p className="text-xs text-slate-500 p-2 text-center">No hay tareas disponibles. Crea tareas en Gestión de Tareas.</p>
                 ) : (
                    tareasDisponibles.map(t => (
                       <label key={t.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={selectedTareas.includes(t.id)}
                            onChange={() => toggleTarea(t.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700" 
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{t.descripcion}</span>
                       </label>
                    ))
                 )}
              </div>
           </div>

           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Archivo pdf</label>
              <input 
                type="file"
                accept=".pdf"
                onChange={(e) => setArchivoPdf(e.target.files && e.target.files.length > 0 ? e.target.files[0] : null)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:text-white transition-all file:mr-4 file:py-1 file:px-3 file:rounded file:border file:border-slate-300 file:bg-slate-100 dark:file:bg-slate-800 dark:file:border-slate-700 file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-200"
              />
           </div>

           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo aplicacion</label>
              <input 
                type="text"
                value={tipoAplicacion}
                onChange={(e) => setTipoAplicacion(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:text-white transition-all"
              />
           </div>

           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo aceite</label>
              <input 
                type="text"
                value={tipoAceite}
                onChange={(e) => setTipoAceite(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:text-white transition-all"
              />
           </div>

           <div className="flex justify-end gap-3 pt-4">
             <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                Cancelar
             </button>
             <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md shadow-sm transition-colors">
               Guardar Pauta
             </button>
           </div>
        </form>
      </Modal>

      {/* Modal - Nuevo Modelo */}
      <Modal 
        isOpen={isModeloModalOpen} 
        onClose={() => setIsModeloModalOpen(false)}
        title="Crear Nuevo Modelo de Vehículo"
      >
        <form onSubmit={handleSubmitModelo} className="space-y-4">
           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Modelo</label>
              <input 
                type="text" 
                required
                value={nombreModelo}
                onChange={(e) => setNombreModelo(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:text-white transition-all" 
              />
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Marca (Opcional)</label>
              <input 
                type="text" 
                value={marcaModelo}
                onChange={(e) => setMarcaModelo(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:text-white transition-all" 
              />
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Año (Opcional)</label>
              <input 
                type="number" 
                value={anioModelo}
                onChange={(e) => setAnioModelo(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:text-white transition-all" 
              />
           </div>
           <div className="flex justify-end gap-3 pt-4">
             <button type="button" onClick={() => setIsModeloModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                Cancelar
             </button>
             <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md shadow-sm transition-colors">
               Guardar Modelo
             </button>
           </div>
        </form>
      </Modal>
    </div>
  );
}
