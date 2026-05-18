import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Building, Users, Truck, Plus, Shield, Calendar, Filter, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

interface Empresa {
  id: string;
  nombre: string;
  razon_social: string | null;
  rut: string;
  estado: string;
  created_at: string;
}

export default function SuperAdminEmpresas() {
  const { profile } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    razonSocial: '',
    rut: '',
  });

  const fetchEmpresas = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('empresa').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setEmpresas(data || []);
    } catch (error) {
      console.error('Error al cargar empresas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('empresa').insert([
        {
          nombre: formData.nombre,
          razon_social: formData.razonSocial,
          rut: formData.rut,
          estado: 'Activo'
        }
      ]);
      if (error) throw error;
      
      setIsModalOpen(false);
      setFormData({
        nombre: '',
        razonSocial: '',
        rut: '',
      });
      fetchEmpresas();
    } catch (error) {
      console.error('Error al crear empresa:', error);
      alert('Error al crear la empresa. Verifica los datos.');
    }
  };

  const toggleCompanyStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Activo' ? 'Inactivo' : 'Activo';
    try {
      const { error } = await supabase.from('empresa').update({ estado: newStatus }).eq('id', id);
      if (error) throw error;
      fetchEmpresas();
    } catch (error) {
      console.error('Error al cambiar estado de empresa:', error);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-500" />
            Gestión de Empresas (Súper Administrador)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Administra el estado y acceso a todas las instancias del sistema.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4" /> Nueva Empresa
          </button>
        </div>
      </div>

      {/* Lista de Empresas (Tabla) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Building className="h-5 w-5 text-slate-400" />
            Empresas Activas
          </h2>
          <button className="text-sm flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
            <Filter className="h-4 w-4" /> Filtrar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3 font-medium">Empresa</th>
                <th className="px-6 py-3 font-medium">RUT</th>
                <th className="px-6 py-3 font-medium">Ingreso</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Cargando...
                  </td>
                </tr>
              ) : empresas.length > 0 ? (
                empresas.map((company) => {
                  return (
                    <tr 
                      key={company.id} 
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{company.nombre}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{company.razon_social}</p>
                      </td>
                      <td className="px-6 py-4">
                        {company.rut}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(company.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                          company.estado === 'Activo' 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50" 
                            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50"
                        )}>
                          {company.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => toggleCompanyStatus(company.id, company.estado)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                            company.estado === 'Activo'
                              ? "bg-white border-red-200 text-red-600 hover:bg-red-50 dark:bg-slate-800 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                              : "bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:bg-slate-800 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                          )}
                        >
                          {company.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        
                        {profile?.empresa_id === company.id ? (
                          <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed border border-transparent">
                            Actual
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Building className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No hay empresas registradas aún.</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500">Haz clic en "Nueva Empresa" para agregar una.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Empresa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-500" />
                Nueva Empresa
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md transition-colors"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCompany} className="p-5 space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 dark:text-slate-300">Nombre Comercial</label>
                <input 
                  required
                  type="text" 
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Ej: Logística Sur"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 dark:text-slate-300">Razón Social</label>
                <input 
                  required
                  type="text" 
                  value={formData.razonSocial}
                  onChange={(e) => setFormData({...formData, razonSocial: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Ej: Logística del Sur S.A."
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 dark:text-slate-300">RUT</label>
                <input 
                  required
                  type="text" 
                  value={formData.rut}
                  onChange={(e) => setFormData({...formData, rut: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Ej: 76.123.456-7"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-200 dark:border-slate-800 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Confirmar y Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

