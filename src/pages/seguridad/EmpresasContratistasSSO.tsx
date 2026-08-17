import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Search, Filter, Briefcase, Building2, ChevronRight, Activity, Users, Shield } from 'lucide-react';

const mockContratistas: any[] = [];

const ContratistasSSO = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Empresas Contratistas</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestión y control de empresas colaboradoras.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Empresa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Empresas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cumplimiento Global</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Dotación Contratista</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por RUT o Razón Social..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {mockContratistas.map(empresa => (
              <Card key={empresa.id} className="border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{empresa.nombre}</h3>
                      <p className="text-sm text-gray-500">{empresa.rut}</p>
                    </div>
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <Briefcase className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Rubro</span>
                      <span className="font-medium text-gray-900 dark:text-gray-300">{empresa.rubro}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Dotación SSO</span>
                      <span className="font-medium text-gray-900 dark:text-gray-300">{empresa.dotacion} trabajadores</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-500">Cumplimiento</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${empresa.cumplimiento >= 90 ? 'text-green-600' : empresa.cumplimiento >= 80 ? 'text-orange-500' : 'text-red-600'}`}>
                          {empresa.cumplimiento}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                    <div 
                      className={`h-2 rounded-full ${empresa.cumplimiento >= 90 ? 'bg-green-500' : empresa.cumplimiento >= 80 ? 'bg-orange-500' : 'bg-red-500'}`}
                      style={{ width: `${empresa.cumplimiento}%` }}
                    ></div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-md ${empresa.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {empresa.estado}
                    </span>
                    <Button variant="ghost" size="sm" className="text-blue-600 flex items-center gap-1">
                      Ver Ficha <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContratistasSSO;
