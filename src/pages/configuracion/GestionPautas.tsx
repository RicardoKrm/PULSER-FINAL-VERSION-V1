import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Edit3,
  FileText,
  Activity,
  Car,
  Settings
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import Swal from 'sweetalert2';

interface Pauta {
  id: string;
  nombre: string;
  modeloVehiculo: string;
  kmAplicacion: number;
  tipo: string;
  color: string;
  estado: 'Activo' | 'Inactivo';
}

const INITIAL_DATA: Pauta[] = [
  { id: '1', nombre: 'Pauta Preventiva 15K', modeloVehiculo: 'Volvo FH16', kmAplicacion: 15000, tipo: 'PREVENTIVA', color: 'bg-emerald-500', estado: 'Activo' },
  { id: '2', nombre: 'Revisión General 50K', modeloVehiculo: 'Scania R500', kmAplicacion: 50000, tipo: 'GENERAL', color: 'bg-blue-500', estado: 'Activo' },
  { id: '3', nombre: 'Cambio de Componentes 100K', modeloVehiculo: 'Todos', kmAplicacion: 100000, tipo: 'MAYOR', color: 'bg-rose-500', estado: 'Activo' },
  { id: '4', nombre: 'Inspección de Sistemas', modeloVehiculo: 'Sprinter 315', kmAplicacion: 5000, tipo: 'INSPECCIÓN', color: 'bg-amber-500', estado: 'Inactivo' },
];

export default function GestionPautas() {
  const [pautas, setPautas] = useState<Pauta[]>(INITIAL_DATA);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [nombre, setNombre] = useState('');
  const [modeloVehiculo, setModeloVehiculo] = useState('Todos');
  const [kmAplicacion, setKmAplicacion] = useState(10000);
  const [tipo, setTipo] = useState('PREVENTIVA');
  const [color, setColor] = useState('bg-emerald-500');

  const filteredPautas = pautas.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.modeloVehiculo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre) return;

    const newPauta: Pauta = {
      id: Date.now().toString(),
      nombre,
      modeloVehiculo,
      kmAplicacion,
      tipo,
      color,
      estado: 'Activo'
    };

    setPautas([newPauta, ...pautas]);
    
    Swal.fire({
      title: '¡Guardado!', 
      text: 'La pauta ha sido registrada exitosamente.', 
      icon: 'success',
      confirmButtonColor: '#4f46e5'
    });
    
    setIsModalOpen(false);
    setNombre('');
    setModeloVehiculo('Todos');
    setKmAplicacion(10000);
    setTipo('PREVENTIVA');
    setColor('bg-emerald-500');
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
    }).then((result) => {
      if (result.isConfirmed) {
        setPautas(pautas.filter(p => p.id !== id));
        Swal.fire('Eliminado!', 'La pauta fue borrada exitosamente.', 'success');
      }
    });
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
                  <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
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
                <span>{pauta.kmAplicacion.toLocaleString()} KM</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-auto">
               <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tipo:</span>
                  <span className={`text-[11px] font-black uppercase tracking-wider ${
                     pauta.tipo === 'PREVENTIVA' ? 'text-emerald-600 dark:text-emerald-500' :
                     pauta.tipo === 'GENERAL' ? 'text-blue-600 dark:text-blue-500' :
                     pauta.tipo === 'MAYOR' ? 'text-rose-600 dark:text-rose-500' :
                     'text-amber-600 dark:text-amber-500'
                  }`}>{pauta.tipo}</span>
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
        onClose={() => setIsModalOpen(false)}
        title="Crear Pauta de Mantenimiento"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
           <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Nombre de la Pauta *</label>
              <input 
                type="text" 
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all" 
                placeholder="Ej. Cambio de Aceite y Filtros 10K" 
              />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Modelo de Vehículo</label>
                 <input 
                   type="text"
                   value={modeloVehiculo}
                   onChange={(e) => setModeloVehiculo(e.target.value)}
                   className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all"
                   placeholder="Ej. Volvo FH16"
                 />
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">KMs de Aplicación</label>
                 <input 
                   type="number"
                   value={kmAplicacion}
                   onChange={(e) => setKmAplicacion(Number(e.target.value))}
                   className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all"
                 />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Tipo de Mantenimiento</label>
                 <select 
                   value={tipo}
                   onChange={(e) => setTipo(e.target.value)}
                   className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all"
                 >
                    <option value="PREVENTIVA">Preventiva</option>
                    <option value="GENERAL">General</option>
                    <option value="MAYOR">Mayor</option>
                    <option value="INSPECCIÓN">Inspección</option>
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Color Base</label>
                 <div className="flex gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex-wrap justify-between items-center h-[42px]">
                    {colors.slice(0, 7).map(c => (
                       <button
                         key={c}
                         type="button"
                         onClick={() => setColor(c)}
                         className={`w-5 h-5 rounded-full ${c} ${color === c ? 'ring-2 ring-offset-1 ring-slate-800 dark:ring-white dark:ring-offset-slate-900' : ''}`}
                       />
                    ))}
                 </div>
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
             <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
             <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-sm shadow-indigo-600/20">
               Crear Pauta
             </Button>
           </div>
        </form>
      </Modal>
    </div>
  );
}
