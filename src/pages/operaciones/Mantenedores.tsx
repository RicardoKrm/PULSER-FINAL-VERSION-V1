import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function Mantenedores() {
  const [activeTab, setActiveTab] = useState('empresas');

  const [empresas, setEmpresas] = useState([{id:1, nombre: 'TransCompany S.A.'}]);
  const [tiposCliente, setTiposCliente] = useState([{id:1, nombre: 'Particular'}, {id:2, nombre: 'Corporativo'}]);
  const [origenes, setOrigenes] = useState([{id:1, ruta: 'Hotel Sheraton'}]);

  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if(!newItem) return;
    if(activeTab === 'empresas') setEmpresas([...empresas, {id: Date.now(), nombre: newItem}]);
    if(activeTab === 'tiposCliente') setTiposCliente([...tiposCliente, {id: Date.now(), nombre: newItem}]);
    if(activeTab === 'origenes') setOrigenes([...origenes, {id: Date.now(), ruta: newItem}]);
    setNewItem('');
  };

  const handleDelete = (id: number) => {
    if(activeTab === 'empresas') setEmpresas(empresas.filter(e => e.id !== id));
    if(activeTab === 'tiposCliente') setTiposCliente(tiposCliente.filter(e => e.id !== id));
    if(activeTab === 'origenes') setOrigenes(origenes.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold dark:text-white">Mantenedores y Tablas Maestras</h1>
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
         <button onClick={() => setActiveTab('empresas')} className={`px-4 py-2 text-sm font-medium \${activeTab === 'empresas' ? 'border-b-2 border-blue-600 font-bold dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>Empresas (Clientes)</button>
         <button onClick={() => setActiveTab('tiposCliente')} className={`px-4 py-2 text-sm font-medium \${activeTab === 'tiposCliente' ? 'border-b-2 border-blue-600 font-bold dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>Tipos de Cliente</button>
         <button onClick={() => setActiveTab('origenes')} className={`px-4 py-2 text-sm font-medium \${activeTab === 'origenes' ? 'border-b-2 border-blue-600 font-bold dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>Orígenes y Destinos</button>
      </div>
      
      <div className="p-6 bg-white dark:bg-slate-800/50 rounded-lg shadow min-h-[400px] max-w-2xl">
        <div className="flex gap-4 mb-6">
           <input 
             className="flex-1 px-3 py-2 border rounded-lg dark:border-slate-700 bg-transparent dark:text-white" 
             placeholder={activeTab === 'origenes' ? 'Añadir Ruta...' : 'Añadir Registro...'} 
             value={newItem}
             onChange={(e) => setNewItem(e.target.value)}
           />
           <Button onClick={handleAdd}>Crear Nuevo</Button>
        </div>

        <Card>
          <CardContent className="p-0">
             <table className="w-full text-left bg-white dark:bg-slate-800/50 rounded-lg overflow-hidden border dark:border-slate-800">
               <thead className="bg-slate-50 dark:bg-slate-800">
                 <tr>
                   <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400">ID</th>
                   <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400">NOMBRE / DESCRIPCIÓN</th>
                   <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 text-right">ACCIONES</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {activeTab === 'empresas' && empresas.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                       <td className="py-3 px-4 text-sm text-slate-500">{e.id}</td>
                       <td className="py-3 px-4 text-sm font-bold dark:text-slate-100">{e.nombre}</td>
                       <td className="py-3 px-4 text-right">
                          <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700 text-sm font-bold">Eliminar</button>
                       </td>
                    </tr>
                 ))}
                 {activeTab === 'tiposCliente' && tiposCliente.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                       <td className="py-3 px-4 text-sm text-slate-500">{e.id}</td>
                       <td className="py-3 px-4 text-sm font-bold dark:text-slate-100">{e.nombre}</td>
                       <td className="py-3 px-4 text-right">
                          <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700 text-sm font-bold">Eliminar</button>
                       </td>
                    </tr>
                 ))}
                 {activeTab === 'origenes' && origenes.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                       <td className="py-3 px-4 text-sm text-slate-500">{e.id}</td>
                       <td className="py-3 px-4 text-sm font-bold dark:text-slate-100">{e.ruta}</td>
                       <td className="py-3 px-4 text-right">
                          <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700 text-sm font-bold">Eliminar</button>
                       </td>
                    </tr>
                 ))}
               </tbody>
             </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
