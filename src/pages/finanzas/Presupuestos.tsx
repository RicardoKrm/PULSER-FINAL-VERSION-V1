import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Target, TrendingDown, AlertCircle, CheckCircle, Plus, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function Presupuestos() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newTotal, setNewTotal] = useState('');
  const [newPeriod, setNewPeriod] = useState('Mensual');
  const [newCategory, setNewCategory] = useState('Operacional');
  const [newAlert, setNewAlert] = useState('80');

  const handleAddPresupuesto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre || !newTotal) return;
    
    setBudgets([
      ...budgets,
      {
        id: Date.now(),
        name: newNombre,
        spent: 0,
        total: parseFloat(newTotal),
        period: newPeriod,
        category: newCategory,
        alertThreshold: parseInt(newAlert, 10),
        alert: 'Presupuesto recién creado. Aún no hay gastos registrados.',
        status: 'success'
      }
    ]);
    setIsModalOpen(false);
    setNewNombre('');
    setNewTotal('');
    setNewPeriod('Mensual');
    setNewCategory('Operacional');
    setNewAlert('80');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden gap-4">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Target className="w-6 h-6 text-blue-400" /> Presupuestos Operacionales</h1>
          <p className="text-slate-400 mt-1">Comparativa real vs presupuesto y control de gasto estructural.</p>
        </div>
        <div className="relative z-10">
           <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold">
              <Plus className="w-5 h-5 mr-2" /> Agregar Presupuesto
           </Button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map(budget => {
          const percentage = budget.total > 0 ? (budget.spent / budget.total) * 100 : 0;
          const displayPercentage = Math.round(percentage);
          const isWarning = displayPercentage > 80 || budget.status === 'warning';

          return (
            <Card key={budget.id} className="bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 flex flex-col">
               <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="font-bold text-slate-800 dark:text-slate-200">{budget.name}</h3>
                   <Badge variant="secondary">{budget.period}</Badge>
                 </div>
                 <Badge variant="outline" className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                    {budget.category}
                 </Badge>
               </div>
               <CardContent className="p-5 flex-1 flex flex-col">
                 <div className="flex justify-between items-end mb-2">
                    <span className="text-3xl font-black font-mono text-slate-800 dark:text-white">${budget.spent.toFixed(1)}M <span className="text-sm text-slate-400 font-normal">/ {budget.total}M</span></span>
                    <span className={isWarning ? "text-rose-500 font-bold" : "text-emerald-500 font-bold"}>{displayPercentage}%</span>
                 </div>
                 <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden mb-1">
                    <div className={isWarning ? "bg-amber-500 h-full" : "bg-emerald-500 h-full"} style={{ width: `${Math.min(displayPercentage, 100)}%` }}></div>
                 </div>
                 <div className="flex justify-end mb-4">
                    <span className="text-[10px] text-slate-400 font-medium">Límite de alerta: {budget.alertThreshold}%</span>
                 </div>
                 <div className={`mt-auto flex items-start gap-2 p-3 rounded-lg border ${isWarning ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30'}`}>
                    {isWarning ? (
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 min-w-[16px]" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 min-w-[16px]" />
                    )}
                    <p className={`text-xs ${isWarning ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'}`}>{budget.alert}</p>
                 </div>
               </CardContent>
            </Card>
          );
        })}
        {budgets.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No hay presupuestos</p>
            <p className="text-sm">Agrega un presupuesto para comenzar a controlar tus gastos.</p>
          </div>
        )}
      </div>

      {/* Modal Crear Presupuesto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold flex items-center gap-2"><Target className="w-5 h-5 text-blue-500" /> Nuevo Presupuesto</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleAddPresupuesto} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre / Concepto</label>
                <input 
                  type="text" 
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Ej: Combustible Flota Norte" 
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 outline-none focus:border-blue-500" 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                  <select 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="Operacional">Operacional</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Combustible">Combustible</option>
                    <option value="Remuneraciones">Remuneraciones</option>
                    <option value="Administrativo">Administrativo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Periodicidad</label>
                  <select 
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="Mensual">Mensual</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Anual">Anual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Monto (Millones CLP)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={newTotal}
                    onChange={(e) => setNewTotal(e.target.value)}
                    placeholder="Ej: 5.5" 
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 outline-none focus:border-blue-500" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Alerta Límite (%)</label>
                  <input 
                    type="number" 
                    min="1"
                    max="100"
                    value={newAlert}
                    onChange={(e) => setNewAlert(e.target.value)}
                    placeholder="80" 
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 outline-none focus:border-blue-500" 
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <p className="text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Se te notificará cuando el consumo supere el {newAlert}%.
                </p>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 mt-4 rounded-xl transition-colors">
                Crear Presupuesto
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
