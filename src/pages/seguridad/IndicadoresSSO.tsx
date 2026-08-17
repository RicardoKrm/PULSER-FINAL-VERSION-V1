import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Download, TrendingUp, TrendingDown, Activity, ShieldAlert, HeartPulse } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const dataAccidentabilidad: any[] = [];

const dataPreventivos: any[] = [];

const IndicadoresSSO = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Indicadores SSO</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Dashboard gerencial de métricas reactivas y proactivas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar Datos
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasa Accidentabilidad (IF)</p>
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">0</h3>
              <div className="flex items-center text-sm text-green-500 font-medium mb-1">
                <TrendingDown className="w-4 h-4 mr-1" />
                -0.3 vs mes ant.
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasa Gravedad (IG)</p>
              <HeartPulse className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">0</h3>
              <div className="flex items-center text-sm text-red-500 font-medium mb-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +14 vs mes ant.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Índice Preventivo</p>
              <ShieldAlert className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">0</h3>
              <div className="flex items-center text-sm text-green-500 font-medium mb-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12 vs mes ant.
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Suma de inspecciones, obs. y charlas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cierre de Hallazgos</p>
              <TrendingUp className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">0</h3>
              <div className="flex items-center text-sm text-green-500 font-medium mb-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +4%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gestión Preventiva Histórica (2026)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataPreventivos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="observaciones" name="Observaciones" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="inspecciones" name="Inspecciones" stackId="a" fill="#8b5cf6" />
                  <Bar dataKey="charlas" name="Charlas" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tasa de Accidentabilidad (Frecuencia)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataAccidentabilidad} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="tasa" 
                    name="Índice Frecuencia" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IndicadoresSSO;
