import React, { useState } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { Building, Users, Truck, Plus, Shield, Calendar, Filter, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function SuperAdminEmpresas() {
  const { companies, setActiveCompanyId, activeCompanyId, addCompany, expirationOptions, addExpirationOption } = useCompany();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    razonSocial: '',
    joinDate: new Date().toISOString().split('T')[0],
    usersCount: 1,
    expirationDate: '6m',
    customExpirationValue: ''
  });
  
  // Filter out the "Global" view from the management list to display only real companies
  const managedCompanies = companies.filter(c => c.id !== 'GLOBAL');

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    
    let expirationText = '';
    const selectedOption = expirationOptions.find(opt => opt.value === formData.expirationDate);
    
    if (formData.expirationDate === 'custom' && formData.customExpirationValue.trim() !== '') {
      const days = parseInt(formData.customExpirationValue, 10);
      expirationText = `${days} día${days !== 1 ? 's' : ''}`;
      
      const newOptionValue = `custom-${days}-days`;
      addExpirationOption({
        value: newOptionValue,
        label: expirationText
      });
    } else {
      expirationText = selectedOption ? selectedOption.label : '';
    }

    addCompany({
      name: formData.name,
      razonSocial: formData.razonSocial,
      joinDate: formData.joinDate,
      usersCount: Number(formData.usersCount),
      fleetSize: 0, // defaults to 0
      status: 'Activo',
      expirationDate: expirationText
    });
    
    setIsModalOpen(false);
    // Reset form
    setFormData({
      name: '',
      razonSocial: '',
      joinDate: new Date().toISOString().split('T')[0],
      usersCount: 1,
      expirationDate: '6m',
      customExpirationValue: ''
    });
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
                <th className="px-6 py-3 font-medium">Ingreso</th>
                <th className="px-6 py-3 font-medium">Usuarios</th>
                <th className="px-6 py-3 font-medium">Flota</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {managedCompanies.map((company) => {
                return (
                  <tr 
                    key={company.id} 
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{company.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{company.id}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {company.joinDate}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {company.usersCount}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium">
                        <Truck className="h-3.5 w-3.5 text-slate-400" />
                        {company.fleetSize}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                        company.status === 'Activo' 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50" 
                          : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50"
                      )}>
                        {company.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {activeCompanyId === company.id ? (
                        <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed">
                          Sesión Activa
                        </span>
                      ) : (
                        <button 
                          onClick={() => setActiveCompanyId(company.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white transition-colors"
                        >
                          Entrar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
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
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Fecha de Ingreso</label>
                  <input 
                    required
                    type="date" 
                    value={formData.joinDate}
                    onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Nº de Usuarios</label>
                  <input 
                    required
                    type="number" 
                    min="1"
                    value={formData.usersCount}
                    onChange={(e) => setFormData({...formData, usersCount: Number(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 dark:text-slate-300">Expiración de Sesión</label>
                <select 
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({...formData, expirationDate: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {expirationOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                  <option value="custom">Personalizado...</option>
                </select>
                
                {formData.expirationDate === 'custom' && (
                  <div className="flex items-center gap-2 mt-2">
                    <input 
                      required
                      type="number" 
                      min="1"
                      value={formData.customExpirationValue}
                      onChange={(e) => setFormData({...formData, customExpirationValue: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Cantidad de días"
                    />
                    <span className="text-slate-600 dark:text-slate-400 font-medium">días</span>
                  </div>
                )}
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
