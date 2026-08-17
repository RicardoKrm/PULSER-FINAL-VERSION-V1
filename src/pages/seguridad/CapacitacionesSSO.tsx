import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Search, Filter, BookOpen, GraduationCap, Award, Clock } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

const mockCursos: any[] = [];

const CapacitacionesSSO = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'Vigente':
        return <Badge variant="success" className="flex items-center gap-1"><Award className="w-3 h-3" /> Vigente</Badge>;
      case 'Próximo a Vencer':
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Próximo a Vencer</Badge>;
      case 'Vencido':
        return <Badge variant="error" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Vencido</Badge>;
      default:
        return <Badge variant="neutral">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Capacitaciones y Competencias</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Control de cursos, certificaciones y habilitaciones por competencias.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Registrar Curso
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Cursos (Año)</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">0</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Trabajadores Habilitados</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">0</p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Próximos a Vencer (30d)</p>
                <p className="text-3xl font-bold text-orange-500 mt-1">0</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cursos Vencidos</p>
                <p className="text-3xl font-bold text-red-500 mt-1">0</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-red-600 dark:text-red-400" />
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
                placeholder="Buscar por curso o trabajador..."
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Curso / Competencia</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Trabajador</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Organismo / Relator</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Fecha Realización</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Vencimiento</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Estado</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 text-right">Certificado</th>
                </tr>
              </thead>
              <tbody>
                {mockCursos.map((curso) => (
                  <tr key={curso.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-300 font-medium">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-blue-500" />
                        {curso.curso}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{curso.trabajador}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{curso.relator}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{curso.fecha}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{curso.vencimiento}</td>
                    <td className="py-3 px-4 text-sm">
                      {getStatusBadge(curso.estado)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <Button variant="ghost" size="sm" className="text-blue-600">
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CapacitacionesSSO;
