import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import HistorialTrazabilidad from '../operaciones/produccion/HistorialTrazabilidad';
import { Loader2 } from 'lucide-react';

export default function TrazabilidadPage() {
  const { currentCompany } = useCompany();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (currentCompany?.id) fetchTrazabilidad();
  }, [currentCompany]);

  const fetchTrazabilidad = async () => {
    setLoading(true);
    try {
      const { data: minaData } = await supabase
        .from('produccion_registro_diario_mina').select('*').eq('empresa_id', currentCompany?.id || '');

      const { data: transporteData } = await supabase
        .from('produccion_registro_diario').select('*').eq('empresa_id', currentCompany?.id || '');

      const unifiedHistory: any[] = [];

      if (minaData) {
        minaData.forEach((row: any) => {
          unifiedHistory.push({
            id: `mina-${row.id}`,
            area: 'Mina',
            fecha: row.fecha || '',
            hora: row.created_at ? new Date(row.created_at).toLocaleTimeString() : '',
            timestamp: row.created_at ? new Date(row.created_at).getTime() : 0,
            unidad: row.equipo || '-',
            vuelta: row.vueltas || 0,
            toneladas: row.tonelaje || 0,
            chofer: row.operador || '-',
            supervisor: row.supervisor || 'No registrado',
            suceso: row.turno || 'Normal',
            notas: `Reporte de Extracción - Turno ${row.turno}`,
            tipoSal: 'Caliche'
          });
        });
      }

      if (transporteData) {
        transporteData.forEach((row: any) => {
          unifiedHistory.push({
            id: `trans-${row.id}`,
            area: 'Transporte',
            fecha: row.fecha || '',
            hora: row.created_at ? new Date(row.created_at).toLocaleTimeString() : '',
            timestamp: row.created_at ? new Date(row.created_at).getTime() : 0,
            unidad: row.camion || '-',
            vuelta: row.vueltas || 0,
            toneladas: row.tonelaje || 0,
            chofer: row.chofer || '-',
            supervisor: row.supervisor || 'No registrado',
            suceso: row.suceso || 'Normal',
            notas: `Reporte de Transporte - Turno ${row.turno}`,
            tipoSal: row.tipo || 'No especificado'
          });
        });
      }

      // Sort by latest first
      unifiedHistory.sort((a, b) => b.timestamp - a.timestamp);
      
      setHistory(unifiedHistory);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HistorialTrazabilidad history={history} />
    </div>
  );
}
