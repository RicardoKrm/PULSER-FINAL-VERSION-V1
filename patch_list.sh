cat << 'INNER' > src/pages/produccion/ListaPorTurnos.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Users, User, Shield, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Trabajador {
  nombre: string;
  cargo: string;
}

interface TurnoInfo {
  id: string;
  nombre: string;
  supervisor: string;
  trabajadores: Trabajador[];
}

export default function ListaPorTurnos() {
  const [turnos, setTurnos] = useState<TurnoInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('produccion_registro_diario')
          .select('fecha, turno, chofer, supervisor');

        if (error) {
          console.error("Error fetching data:", error);
          setLoading(false);
          return;
        }

        const groups: Record<string, TurnoInfo> = {
          'A': { id: 'A', nombre: 'Turno A', supervisor: '', trabajadores: [] },
          'B': { id: 'B', nombre: 'Turno B', supervisor: '', trabajadores: [] },
          'C': { id: 'C', nombre: 'Turno C', supervisor: '', trabajadores: [] },
          'D': { id: 'D', nombre: 'Turno D', supervisor: '', trabajadores: [] },
        };

        const trabajadoresSet = new Set<string>();

        // Reference date: July 1, 2026 (Wednesday)
        const refDate = new Date('2026-07-01T00:00:00');

        data.forEach(row => {
          if (!row.fecha || !row.chofer) return;

          const rowDate = new Date(row.fecha + 'T00:00:00');
          const diffTime = rowDate.getTime() - refDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          const weekIndex = Math.floor(diffDays / 7);

          const isEvenWeek = weekIndex % 2 === 0;
          const isDia = row.turno?.toLowerCase().includes('día') || row.turno?.toLowerCase().includes('dia');

          let turnoId = '';
          if (isEvenWeek && isDia) turnoId = 'A';
          else if (isEvenWeek && !isDia) turnoId = 'B';
          else if (!isEvenWeek && isDia) turnoId = 'C';
          else if (!isEvenWeek && !isDia) turnoId = 'D';

          if (turnoId) {
            // Assign supervisor if not yet assigned or if this row has one
            if (row.supervisor && !groups[turnoId].supervisor) {
              groups[turnoId].supervisor = row.supervisor;
            }

            // Assign driver
            if (!trabajadoresSet.has(row.chofer)) {
              trabajadoresSet.add(row.chofer);
              groups[turnoId].trabajadores.push({ nombre: row.chofer, cargo: 'Chofer' });
            }
          }
        });

        setTurnos([groups['A'], groups['B'], groups['C'], groups['D']]);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-3 text-slate-600 font-medium">Cargando turnos...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-fade-in">
      {turnos.map(turno => (
        <Card key={turno.id} className="overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              {turno.nombre}
            </h3>
            <div className="mt-3 flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
              <Shield className="w-4 h-4 text-emerald-500" />
              <div className="text-sm">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-bold block uppercase tracking-wider">Supervisor</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{turno.supervisor || 'No asignado'}</span>
              </div>
            </div>
          </div>
          <div className="p-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Trabajadores ({turno.trabajadores.length})</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {turno.trabajadores.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">No hay trabajadores registrados en este turno.</p>
              ) : (
                turno.trabajadores.map((trabajador, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{trabajador.nombre}</p>
                      <p className="text-xs font-medium text-slate-500">{trabajador.cargo}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
INNER
