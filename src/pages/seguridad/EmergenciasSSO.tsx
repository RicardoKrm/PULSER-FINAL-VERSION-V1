import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Plus, Search, Filter, Siren, FileText, Calendar, Users, Clock, AlertTriangle } from 'lucide-react';

const mockPlanes: any[] = [];

const mockSimulacros: any[] = [];

const EmergenciasSSO = () => {
  const [activeTab, setActiveTab] = useState<'planes' | 'simulacros'>('planes');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'Vigente': return <Badge variant="success">Vigente</Badge>;
      case 'En Revisión': return <Badge variant="warning">En Revisión</Badge>;
      case 'Exitoso': return <Badge variant="success">Exitoso</Badge>;
      case 'Con Observaciones': return <Badge variant="warning">Con Observaciones</Badge>;
      default: return <Badge variant="neutral">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Emergencias y Simulacros</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestión de planes de respuesta y registro de ejercicios de simulacro.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {activeTab === 'planes' ? 'Nuevo Plan' : 'Registrar Simulacro'}
        </Button>
      </div>

      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 mb-6">
        <button
          onClick={() => setActiveTab('planes')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'planes'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Planes de Emergencia
        </button>
        <button
          onClick={() => setActiveTab('simulacros')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'simulacros'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Registro de Simulacros
        </button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={activeTab === 'planes' ? "Buscar planes..." : "Buscar simulacros..."}
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

          <div className="overflow-x-auto">
            {activeTab === 'planes' ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Plan de Emergencia</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Área de Alcance</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Última Actualización</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Responsable</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Estado</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPlanes.map((plan) => (
                    <tr key={plan.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-red-500" />
                          {plan.nombre}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{plan.area}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{plan.actualizacion}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{plan.responsable}</td>
                      <td className="py-3 px-4 text-sm">{getStatusBadge(plan.estado)}</td>
                      <td className="py-3 px-4 text-sm text-right">
                        <Button variant="ghost" size="sm" className="text-blue-600">Ver Plan</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Tipo de Simulacro</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Fecha</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Área</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 text-center">Participantes</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Tiempo Respuesta</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Resultado</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 text-right">Informe</th>
                  </tr>
                </thead>
                <tbody>
                  {mockSimulacros.map((simulacro) => (
                    <tr key={simulacro.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <Siren className="w-4 h-4 text-orange-500" />
                          {simulacro.tipo}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {simulacro.fecha}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{simulacro.area}</td>
                      <td className="py-3 px-4 text-sm text-center font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-400" /> {simulacro.participantes}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" /> {simulacro.tiempoEvacuacion}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{getStatusBadge(simulacro.resultado)}</td>
                      <td className="py-3 px-4 text-sm text-right">
                        <Button variant="ghost" size="sm" className="text-blue-600">Ver Informe</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergenciasSSO;
