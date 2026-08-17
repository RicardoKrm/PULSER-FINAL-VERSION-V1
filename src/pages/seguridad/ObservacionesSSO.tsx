import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Plus, Search, Filter, Eye, Camera, MapPin, Clock } from 'lucide-react';

const mockObservaciones: any[] = [];

const ObservacionesSSO = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Observaciones Preventivas</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Registro rápido en terreno de actos y condiciones subestándar.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Observación
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por área o descripción..."
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockObservaciones.map((obs) => (
              <Card key={obs.id} className="border border-gray-200 dark:border-gray-800 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant={obs.tipo === 'Acto Inseguro' ? 'warning' : 'error'}>{obs.tipo}</Badge>
                    <span className="text-xs font-medium text-gray-400">{obs.id}</span>
                  </div>
                  
                  <p className="text-gray-900 dark:text-gray-100 font-medium mb-4 text-sm">
                    "{obs.descripcion}"
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      {obs.fecha}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <MapPin className="w-3.5 h-3.5" />
                      {obs.area}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 mb-4">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Acción Inmediata:</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{obs.accion}</p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <div className="flex items-center text-gray-400">
                      {obs.foto ? <Camera className="w-4 h-4 text-blue-500" title="Contiene fotografía" /> : <Camera className="w-4 h-4 opacity-30" />}
                    </div>
                    <Button variant="ghost" size="sm" className="text-blue-600 flex items-center gap-1 h-8">
                      <Eye className="w-4 h-4" /> Detalle
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

export default ObservacionesSSO;
