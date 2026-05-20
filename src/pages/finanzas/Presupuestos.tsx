import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Target, TrendingDown, AlertCircle, CheckCircle, Plus, X, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import Swal from 'sweetalert2';

export default function Presupuestos() {
  const { activeCompanyId } = useCompany();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form
  const [newNombre, setNewNombre] = useState('');
  const [newTotal, setNewTotal] = useState('');
  const [newPeriod, setNewPeriod] = useState('Mensual');
  const [newCategory, setNewCategory] = useState('Operaciones y Servicios');
  const [newAlert, setNewAlert] = useState('80');

  useEffect(() => {
    if (activeCompanyId) {
      fetchData();
    }
  }, [activeCompanyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: empData, error: empErr } = await supabase.from('empresa').select('id, detalles').eq('id', activeCompanyId).single();
      const { data: vehData, error: vehErr } = await supabase.from('vehiculo').select('id, patente, detalles').eq('empresa_id', activeCompanyId);

      // Cargar presupuestos de empresa
      const empBudgets = empData?.detalles?.presupuestos || [];
      setBudgets(empBudgets);

      // Cargar gastos para calcular consumo
      let allGastos: any[] = [];
      if (empData && empData.detalles?.registros_financieros) {
         allGastos = allGastos.concat(empData.detalles.registros_financieros.filter((r:any) => r.tipo === 'Costo/Egreso'));
      }
      if (vehData) {
         vehData.forEach(v => {
            if (v.detalles?.registros_financieros) {
               allGastos = allGastos.concat(v.detalles.registros_financieros.filter((r:any) => r.tipo === 'Costo/Egreso'));
            }
         });
      }
      setGastos(allGastos);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPresupuesto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre || !newTotal) return;
    
    const newBudget = {
       id: crypto.randomUUID(),
       name: newNombre,
       total: parseFloat(newTotal),
       period: newPeriod,
       category: newCategory,
       alertThreshold: parseInt(newAlert, 10),
       created_at: new Date().toISOString()
    };

    try {
      // Obtenemos de nuevo la empresa para actualizar seguro
      const { data: empData } = await supabase.from('empresa').select('detalles').eq('id', activeCompanyId).single();
      const currentDetalles = empData?.detalles || {};
      const currentBudgets = currentDetalles.presupuestos || [];
      const newDetalles = { ...currentDetalles, presupuestos: [...currentBudgets, newBudget] };

      const { error } = await supabase.from('empresa').update({ detalles: newDetalles }).eq('id', activeCompanyId);
      
      if (!error) {
         Swal.fire('Éxito', 'Presupuesto guardado correctamente', 'success');
         setBudgets([...currentBudgets, newBudget]);
         setIsModalOpen(false);
         setNewNombre('');
         setNewTotal('');
         setNewCategory('Operaciones y Servicios');
         setNewAlert('80');
      } else {
         throw error;
      }
    } catch(err) {
       console.error(err);
       Swal.fire('Error', 'No se pudo guardar el presupuesto', 'error');
    }
  };

  const handleDeletePresupuesto = async (id: string) => {
    Swal.fire({
      title: '¿Eliminar Presupuesto?',
      text: "Se borrará este objetivo presupuestario permanentemente. (No afectará los registros financieros).",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { data: empData } = await supabase.from('empresa').select('detalles').eq('id', activeCompanyId).single();
          const currentDetalles = empData?.detalles || {};
          const currentBudgets = currentDetalles.presupuestos || [];
          const newBudgets = currentBudgets.filter((b: any) => b.id !== id);
          
          const newDetalles = { ...currentDetalles, presupuestos: newBudgets };

          const { error } = await supabase.from('empresa').update({ detalles: newDetalles }).eq('id', activeCompanyId);
          
          if (!error) {
            Swal.fire('Eliminado', 'El presupuesto ha sido eliminado', 'success');
            setBudgets(newBudgets);
          } else {
             throw error;
          }
        } catch(err) {
          Swal.fire('Error', 'No se pudo eliminar', 'error');
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden gap-4">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Target className="w-6 h-6 text-blue-400" /> Presupuestos Operacionales</h1>
          <p className="text-slate-400 mt-1">Comparativa real vs presupuesto y control de gasto estructural (Datos Reales).</p>
        </div>
        <div className="relative z-10">
           <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold">
              <Plus className="w-5 h-5 mr-2" /> Agregar Presupuesto
           </Button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500 font-bold">Cargando presupuestos...</div>
        ) : budgets.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 font-bold">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg">No hay presupuestos</p>
            <p className="text-sm">Agrega un presupuesto para comenzar a controlar tus gastos en la nube.</p>
          </div>
        ) : (
          budgets.map(budget => {
            // Calcular gasto real basado en categoria
            const realSpend = gastos.filter(g => g.categoria === budget.category).reduce((acc, g) => acc + g.monto, 0);
            const totalNormal = typeof budget.total === 'string' ? parseFloat(budget.total) : budget.total;
            const targetMonto = budget.total < 1000 ? totalNormal * 1000000 : totalNormal; // si subió "3" asume 3 millones (antiguo), si subió grande asume real
            const computedTarget = totalNormal < 10000 ? totalNormal * 1000000 : totalNormal;

            const percentage = computedTarget > 0 ? (realSpend / computedTarget) * 100 : 0;
            const displayPercentage = Math.round(percentage);
            const isWarning = displayPercentage >= (budget.alertThreshold || 80);

            return (
              <Card key={budget.id} className="bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 flex flex-col">
                 <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                   <div className="flex justify-between items-start mb-2">
                     <h3 className="font-bold text-slate-800 dark:text-slate-200">{budget.name}</h3>
                     <div className="flex items-center gap-2">
                        <Badge variant="secondary">{budget.period}</Badge>
                        <button onClick={() => handleDeletePresupuesto(budget.id)} className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-900/30">
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                   </div>
                   <Badge variant="outline" className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                      {budget.category}
                   </Badge>
                 </div>
                 <CardContent className="p-5 flex-1 flex flex-col">
                   <div className="flex justify-between items-end mb-2">
                      <span className="text-2xl font-black font-mono text-slate-800 dark:text-white">${realSpend.toLocaleString('es-CL')} <span className="text-sm text-slate-400 font-normal">/ {computedTarget.toLocaleString('es-CL')}</span></span>
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
                      <p className={`text-xs font-bold ${isWarning ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'}`}>
                         {isWarning ? 'Límite de alerta superado o cerca según registros.' : 'Gasto controlado según los registros financieros.'}
                      </p>
                   </div>
                 </CardContent>
              </Card>
            );
          })
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
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Categoría Asociada</label>
                  <select 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="Operaciones y Servicios">Operaciones y Servicios</option>
                    <option value="Gestión de Flota">Gestión de Flota</option>
                    <option value="Logística y Suministros">Logística y Suministros</option>
                    <option value="Compras y Proveedores">Compras y Proveedores</option>
                    <option value="Finanzas">Finanzas</option>
                    <option value="Administración / Otros">Administración / Otros</option>
                    <option value="Combustible">Combustible</option>
                    <option value="Mantenimiento y Reparaciones">Mantenimiento y Reparaciones</option>
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
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Alerta (%)</label>
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

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Monto Presupuestado ($ CLP)</label>
                <input 
                  type="number" 
                  value={newTotal}
                  onChange={(e) => setNewTotal(e.target.value)}
                  placeholder="Ej: 5000000" 
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 outline-none focus:border-blue-500" 
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 mt-4 rounded-xl transition-colors">
                Guardar Presupuesto
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
