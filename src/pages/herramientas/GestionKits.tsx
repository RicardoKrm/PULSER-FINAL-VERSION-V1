import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Trash, Plus } from 'lucide-react';

export default function GestionKits() {
  const { kitsRepuesto, crearKitRepuesto, eliminarKitRepuesto } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    crearKitRepuesto({ id: Math.random().toString(36).substr(2, 9), nombre });
    setNombre('');
    setIsModalOpen(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Kits de Repuestos</h1>
        <Button onClick={() => setIsModalOpen(true)} className="bg-cyan-600">
           <Plus className="w-4 h-4 mr-2" /> Agregar Kit
        </Button>
      </div>
      
      <Card className="p-4">
        <table className="w-full">
            <thead>
                <tr className="text-left border-b dark:border-slate-800">
                    <th className="p-2">Nombre</th>
                    <th className="p-2">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {kitsRepuesto.map(kr => (
                    <tr key={kr.id} className="border-b dark:border-slate-800">
                        <td className="p-2">{kr.nombre}</td>
                        <td className="p-2">
                           <Button variant="ghost" onClick={() => eliminarKitRepuesto(kr.id)}><Trash className="w-4 h-4 text-red-500" /></Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </Card>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agregar Kit de Repuesto">
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium">Nombre</label>
                <input type="text" className="w-full p-2 border rounded-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-cyan-600 dark:bg-cyan-600">Guardar</Button>
        </form>
      </Modal>
    </div>
  );
}
