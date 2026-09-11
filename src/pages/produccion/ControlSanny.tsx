import React, { useState, useMemo, useEffect } from 'react';
import { read, utils } from 'xlsx';
import { 
  Upload, 
  FileSpreadsheet, 
  Calendar, 
  BarChart3, 
  Truck,
  Table as TableIcon,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import Swal from 'sweetalert2';

// Utility for parsing the excel rows
interface ExcelRow {
  "Número de serie": number;
  "Capacidad de carga": number;
  "Tiempo": string | number | Date; 
  "Fecha": string | number | Date;
}

interface Trip {
  id: number;
  capacity: number;
  time: string;
  date: string;
  shift: 'Día' | 'Noche';
}

interface TruckData {
  s6: Trip[];
  s7: Trip[];
  s8: Trip[];
}

interface DailySummary {
  date: string;
  s6DiaTons: number;
  s6DiaVueltas: number;
  s6NocheTons: number;
  s6NocheVueltas: number;
  s7DiaTons: number;
  s7DiaVueltas: number;
  s7NocheTons: number;
  s7NocheVueltas: number;
  s8DiaTons: number;
  s8DiaVueltas: number;
  s8NocheTons: number;
  s8NocheVueltas: number;
}

export default function ControlSanny() {
  const { currentCompany } = useCompany();
  const [data, setData] = useState<TruckData>({ s6: [], s7: [], s8: [] });
  const [activeTab, setActiveTab] = useState<'resumen' | 'diario'>('resumen');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Fetch data from DB
  const fetchTrips = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      let allData: any[] = [];
      let fetchMore = true;
      let from = 0;
      const step = 1000;

      while (fetchMore) {
        const { data: dbData, error } = await supabase
          .from('produccion_sanny')
          .select('*')
          .eq('empresa_id', currentCompany.id)
          .order('fecha', { ascending: true })
          .order('hora', { ascending: true })
          .range(from, from + step - 1);

        if (error) throw error;
        
        if (dbData && dbData.length > 0) {
          allData = [...allData, ...dbData];
          from += step;
        }
        
        if (!dbData || dbData.length < step) {
          fetchMore = false;
        }
      }

      const s6Trips: Trip[] = [];
      const s7Trips: Trip[] = [];
      const s8Trips: Trip[] = [];
      
      allData.forEach(row => {
        const trip: Trip = {
          id: row.numero_serie,
          capacity: Number(row.capacidad),
          time: row.hora,
          date: row.fecha,
          shift: row.turno as 'Día' | 'Noche'
        };
        if (row.equipo === 's6') s6Trips.push(trip);
        else if (row.equipo === 's7') s7Trips.push(trip);
        else if (row.equipo === 's8') s8Trips.push(trip);
      });

      setData({ s6: s6Trips, s7: s7Trips, s8: s8Trips });
    } catch (err: any) {
      console.error('Error fetching sanny trips', err);
    } finally {
      setLoading(false);
    }
  };

  
  // Temporary Migration Hook
  useEffect(() => {
    if (currentCompany?.id) {
      supabase.from('produccion_sanny')
        .update({ empresa_id: currentCompany.id })
        .is('empresa_id', null)
        .then(() => {
           console.log("Migration produccion_sanny completed");
           fetchTrips();
        });
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    fetchTrips();
  }, [currentCompany?.id]);

  const availableMonths = useMemo(() => {
    const allDates = [...data.s6, ...data.s7, ...data.s8].map(t => t.date.substring(0, 7));
    return Array.from(new Set(allDates)).sort().reverse();
  }, [data]);

  const formatMonth = (yyyyMM: string) => {
    if (!yyyyMM) return '';
    const parts = yyyyMM.split(yyyyMM.includes('-') ? '-' : '/');
    if (parts.length < 2) return yyyyMM;
    const year = parts[0];
    const month = parts[1];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${months[parseInt(month, 10) - 1]} ${year}`.toUpperCase();
  };

  React.useEffect(() => {
    if (availableMonths.length > 0 && (!selectedMonth || !availableMonths.includes(selectedMonth))) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, truck: 's6' | 's7' | 's8') => {
    if (!currentCompany?.id) {
      Swal.fire('Error', 'No se ha seleccionado una empresa', 'error');
      return;
    }
    
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = read(bstr, { type: 'binary', cellDates: true, dateNF: 'yyyy/mm/dd' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = utils.sheet_to_json<ExcelRow>(ws);

        const parsedTrips = rawData.map((row) => {
          // Handle date formats
          let dateStr = '';
          if (row.Fecha instanceof Date) {
            const yyyy = row.Fecha.getFullYear();
            const mm = String(row.Fecha.getMonth() + 1).padStart(2, '0');
            const dd = String(row.Fecha.getDate()).padStart(2, '0');
            dateStr = `${yyyy}-${mm}-${dd}`; // use YYYY-MM-DD for DB
          } else if (typeof row.Fecha === 'string') {
            // Replace slashes with dashes if it's YYYY/MM/DD
            dateStr = row.Fecha.replace(/\//g, '-');
          }

          // Handle time formats (sometimes parsed as fraction of day if numeric)
          let timeStr = '';
          if (typeof row.Tiempo === 'number') {
             const totalSeconds = Math.round(row.Tiempo * 24 * 3600);
             const hours = Math.floor(totalSeconds / 3600);
             const minutes = Math.floor((totalSeconds % 3600) / 60);
             const seconds = totalSeconds % 60;
             timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
          } else if (row.Tiempo instanceof Date) {
             timeStr = `${String(row.Tiempo.getHours()).padStart(2, '0')}:${String(row.Tiempo.getMinutes()).padStart(2, '0')}:${String(row.Tiempo.getSeconds()).padStart(2, '0')}`;
          } else {
             timeStr = row.Tiempo || '00:00:00';
          }

          // Determine shift: Día is 08:00 to 19:59. Noche is otherwise
          const hour = parseInt(timeStr.split(':')[0] || '0', 10);
          const shift: 'Día' | 'Noche' = (hour >= 8 && hour < 20) ? 'Día' : 'Noche';

          return {
            empresa_id: currentCompany.id,
            equipo: truck,
            numero_serie: Number(row["Número de serie"]) || 0,
            capacidad: Number(row["Capacidad de carga"]) || 0,
            fecha: dateStr,
            hora: timeStr,
            turno: shift
          };
        }).filter(t => t.fecha && t.hora); // Filter out empty rows

        // Upload in chunks to avoid large payload errors
        const CHUNK_SIZE = 500;
        let successCount = 0;
        
        for (let i = 0; i < parsedTrips.length; i += CHUNK_SIZE) {
          const chunk = parsedTrips.slice(i, i + CHUNK_SIZE);
          
          const { error } = await supabase
            .from('produccion_sanny')
            .upsert(chunk, { 
              onConflict: 'empresa_id,equipo,fecha,hora',
              ignoreDuplicates: true // We can ignore true duplicates or update them. 
            });
            
          if (error) throw error;
          successCount += chunk.length;
        }

        Swal.fire('Éxito', `Se han sincronizado ${successCount} registros de ${truck.toUpperCase()} en la base de datos.`, 'success');
        
        // Refresh data from DB
        await fetchTrips();
        
      } catch (error: any) {
        console.error('Error in file upload', error);
        Swal.fire('Error', error.message || 'No se pudo procesar el archivo Excel', 'error');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
    
    // Reset file input
    e.target.value = '';
  };

  // Process data for summaries
  const summaries = useMemo(() => {
    const dailyMap = new Map<string, DailySummary>();
    const allDates = new Set<string>();

    const getDay = (date: string) => {
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          s6DiaTons: 0, s6DiaVueltas: 0, s6NocheTons: 0, s6NocheVueltas: 0,
            s8DiaTons: 0, s8DiaVueltas: 0, s8NocheTons: 0, s8NocheVueltas: 0,
          s7DiaTons: 0, s7DiaVueltas: 0, s7NocheTons: 0, s7NocheVueltas: 0
        });
      }
      return dailyMap.get(date)!;
    };

    if (selectedMonth) {
      data.s6.forEach(trip => {
        if (trip.date.startsWith(selectedMonth)) {
          allDates.add(trip.date);
          const day = getDay(trip.date);
          if (trip.shift === 'Día') {
            day.s6DiaTons += trip.capacity;
            day.s6DiaVueltas += 1;
          } else {
            day.s6NocheTons += trip.capacity;
            day.s6NocheVueltas += 1;
          }
        }
      });

      data.s7.forEach(trip => {
        if (trip.date.startsWith(selectedMonth)) {
          allDates.add(trip.date);
          const day = getDay(trip.date);
          if (trip.shift === 'Día') {
            day.s7DiaTons += trip.capacity;
            day.s7DiaVueltas += 1;
          } else {
            day.s7NocheTons += trip.capacity;
            day.s7NocheVueltas += 1;
          }
        }
      });
      data.s8.forEach(trip => {
        let day = dailyMap.get(trip.date);
        if (day) {
          if (trip.shift === 'Día') {
            day.s8DiaTons += trip.capacity;
            day.s8DiaVueltas += 1;
          } else {
            day.s8NocheTons += trip.capacity;
            day.s8NocheVueltas += 1;
          }
        }
      });

    }

    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [data, selectedMonth]);

  const uniqueDates = useMemo(() => summaries.map(s => s.date), [summaries]);
  
  // Set initial selected date if not set
  React.useEffect(() => {
    if (uniqueDates.length > 0 && !selectedDate) {
      setSelectedDate(uniqueDates[0]);
    }
  }, [uniqueDates, selectedDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control Sanny</h1>
          <p className="text-gray-500">Reporte operacional y rendimiento por turno de equipos Sanny</p>
        </div>
        <Button onClick={() => setShowImportModal(true)} className="flex items-center gap-2">
          <Upload className="w-4 h-4" /> Importar Excel
        </Button>
      </div>

      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Importar Datos Sanny">
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600 mb-4">Sube los archivos Excel extraídos directamente de los equipos Sanny. Los datos se procesarán y guardarán automáticamente en la base de datos.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => handleFileUpload(e, 's6')}
                    disabled={loading}
                  />
                  {loading ? (
                    <Loader2 className="w-10 h-10 text-blue-600 mb-3 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-10 h-10 text-blue-600 mb-3" />
                  )}
                  <h3 className="text-lg font-medium text-gray-900">{loading ? 'Procesando...' : 'Cargar Sanny 06'}</h3>
                  <p className="text-sm text-gray-500 text-center mt-1">
                    Sube el archivo Excel extraído del equipo
                  </p>
                  {data.s6.length > 0 && !loading && (
                    <div className="mt-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center">
                      <CheckIcon className="w-4 h-4 mr-1" />
                      {data.s6.length} registros en base de datos
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => handleFileUpload(e, 's7')}
                    disabled={loading}
                  />
                  {loading ? (
                    <Loader2 className="w-10 h-10 text-indigo-600 mb-3 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-10 h-10 text-indigo-600 mb-3" />
                  )}
                  <h3 className="text-lg font-medium text-gray-900">{loading ? 'Procesando...' : 'Cargar Sanny 07'}</h3>
                  <p className="text-sm text-gray-500 text-center mt-1">
                    Sube el archivo Excel extraído del equipo
                  </p>
                  {data.s7.length > 0 && !loading && (
                    <div className="mt-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center">
                      <CheckIcon className="w-4 h-4 mr-1" />
                      {data.s7.length} registros en base de datos
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    accept=".xlsx,.xls" 
                    onChange={(e) => handleFileUpload(e, 's8')}
                    disabled={loading}
                  />
                  {loading ? (
                    <Loader2 className="w-10 h-10 text-emerald-600 mb-3 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-10 h-10 text-emerald-600 mb-3" />
                  )}
                  <h3 className="text-lg font-medium text-gray-900">{loading ? 'Procesando...' : 'Cargar Sanny 08'}</h3>
                  <p className="text-sm text-gray-500 text-center mt-1">
                    Sube el archivo Excel extraído del equipo
                  </p>
                  {data.s8 && data.s8.length > 0 && !loading && (
                    <div className="mt-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center">
                      <CheckIcon className="w-4 h-4 mr-1" />
                      {data.s8.length} registros en base de datos
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setShowImportModal(false)}>Cerrar</Button>
          </div>
        </div>
      </Modal>

      
      {(data.s6.length > 0 || data.s7.length > 0 || data.s8.length > 0) && (
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-2 rounded-lg border gap-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('resumen')}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${activeTab === 'resumen' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Resumen Mensual
            </button>
            <button
              onClick={() => setActiveTab('diario')}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${activeTab === 'diario' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <TableIcon className="w-4 h-4 mr-2" />
              Detalle por Día
            </button>
          </div>
          {availableMonths.length > 0 && (
            <div className="flex items-center space-x-2 px-2">
              <span className="text-sm font-medium text-gray-700 flex items-center"><Calendar className="w-4 h-4 mr-1"/> Mes:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>{formatMonth(m)}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {activeTab === 'resumen' && summaries.length > 0 && (
        <ResumenMensual summaries={summaries} monthName={formatMonth(selectedMonth)} />
      )}

      {activeTab === 'diario' && summaries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Seleccionar Día:</span>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {uniqueDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          {selectedDate && (
            <DetalleDiario 
              date={selectedDate} 
              s6Trips={data.s6.filter(t => t.date === selectedDate)}
              s7Trips={data.s7.filter(t => t.date === selectedDate)}
              s8Trips={data.s8.filter(t => t.date === selectedDate)}
              summary={summaries.find(s => s.date === selectedDate)!}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Subcomponents

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12"></polyline></svg>;
}

function ResumenMensual({ summaries, monthName }: { summaries: DailySummary[], monthName: string }) {
  // Aggregate Monthly Totals
  const totalS6DiaT = summaries.reduce((acc, curr) => acc + curr.s6DiaTons, 0);
  const totalS6NocheT = summaries.reduce((acc, curr) => acc + curr.s6NocheTons, 0);
  const totalS7DiaT = summaries.reduce((acc, curr) => acc + curr.s7DiaTons, 0);
  const totalS7NocheT = summaries.reduce((acc, curr) => acc + curr.s7NocheTons, 0);
  const totalS8DiaT = summaries.reduce((acc, curr) => acc + curr.s8DiaTons, 0);
  const totalS8NocheT = summaries.reduce((acc, curr) => acc + curr.s8NocheTons, 0);
  
  const totalMes = totalS6DiaT + totalS6NocheT + totalS7DiaT + totalS7NocheT + totalS8DiaT + totalS8NocheT;
  const diasTrabajados = summaries.length;
  const promToneladasDia = diasTrabajados > 0 ? totalMes / diasTrabajados : 0;
  const promDiaEquipo = promToneladasDia / 2;
  
  const totalViajes = summaries.reduce((acc, curr) => acc + curr.s6DiaVueltas + curr.s6NocheVueltas + curr.s7DiaVueltas + curr.s7NocheVueltas + curr.s8DiaVueltas + curr.s8NocheVueltas, 0);
  
  const promVHDia = summaries.reduce((acc, curr) => acc + ((curr.s6DiaVueltas/12 + curr.s7DiaVueltas/12 + curr.s8DiaVueltas/12)/3), 0) / (diasTrabajados || 1);
  const promVHNoche = summaries.reduce((acc, curr) => acc + ((curr.s6NocheVueltas/12 + curr.s7NocheVueltas/12 + curr.s8NocheVueltas/12)/3), 0) / (diasTrabajados || 1);

  return (
    <div className="space-y-6">
      {/* Monthly KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard title="Total Toneladas Mes" value={totalMes.toFixed(1)} />
        <MetricCard title="Turno Día (8 - 20)" value={(totalS6DiaT + totalS7DiaT + totalS8DiaT).toFixed(1)} />
        <MetricCard title="Turno Noche (20 - 8)" value={(totalS6NocheT + totalS7NocheT + totalS8NocheT).toFixed(1)} />
        <MetricCard title="Prom. Toneladas / Día" value={promToneladasDia.toFixed(1)} />
        <MetricCard title="Prom. Día / Equipo" value={promDiaEquipo.toFixed(1)} />
        <MetricCard title="Total Viajes Mes" value={totalViajes.toString()} />
      </div>

      <Card>
        <CardHeader className="bg-slate-900 text-white rounded-t-lg">
          <CardTitle className="text-center text-sm">CONSOLIDADO DIARIO DE PRODUCCIÓN Y RENDIMIENTO - {monthName}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead className="bg-slate-100 text-slate-700 text-xs font-semibold">
              <tr>
                <th className="p-2 border">Día / Fecha</th>
                <th className="p-2 border">S6 - Día (t)</th>
                <th className="p-2 border">S6 - Noche (t)</th>
                <th className="p-2 border">S6 - Total (t)</th>
                <th className="p-2 border">S6 - Vueltas/H Día</th>
                <th className="p-2 border">S6 - Vueltas/H Noche</th>
                <th className="p-2 border">S7 - Día (t)</th>
                <th className="p-2 border">S7 - Noche (t)</th>
                <th className="p-2 border">S7 - Total (t)</th>
                <th className="p-2 border">S7 - Vueltas/H Día</th>
                <th className="p-2 border">S7 - Vueltas/H Noche</th>
                <th className="p-2 border">S8 - Día (t)</th>
                <th className="p-2 border">S8 - Noche (t)</th>
                <th className="p-2 border">S8 - Total (t)</th>
                <th className="p-2 border">S8 - Vueltas/H Día</th>
                <th className="p-2 border">S8 - Vueltas/H Noche</th>
                <th className="p-2 border">Total Día (8-20)</th>
                <th className="p-2 border">Total Noche (20-8)</th>
                <th className="p-2 border">Toneladas Diarias</th>
                <th className="p-2 border">Total Viajes Día</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map(s => {
                const s6Tot = s.s6DiaTons + s.s6NocheTons;
                const s7Tot = s.s7DiaTons + s.s7NocheTons;
                const totalD = s.s6DiaTons + s.s7DiaTons + s.s8DiaTons;
                const totalN = s.s6NocheTons + s.s7NocheTons + s.s8NocheTons;
                return (
                  <tr key={s.date} className="border-b hover:bg-slate-50">
                    <td className="p-2 font-medium border-r">{s.date}</td>
                    <td className="p-2 border-r">{s.s6DiaTons.toFixed(1)}</td>
                    <td className="p-2 border-r">{s.s6NocheTons.toFixed(1)}</td>
                    <td className="p-2 font-semibold bg-slate-50 border-r">{s6Tot.toFixed(1)}</td>
                    <td className="p-2 border-r">{(s.s6DiaVueltas/12).toFixed(2)}</td>
                    <td className="p-2 border-r">{(s.s6NocheVueltas/12).toFixed(2)}</td>
                    <td className="p-2 border-r">{s.s7DiaTons.toFixed(1)}</td>
                    <td className="p-2 border-r">{s.s7NocheTons.toFixed(1)}</td>
                    <td className="p-2 font-semibold bg-slate-50 border-r">{s7Tot.toFixed(1)}</td>
                    <td className="p-2 border-r">{(s.s7DiaVueltas/12).toFixed(2)}</td>
                    <td className="p-2 border-r">{(s.s7NocheVueltas/12).toFixed(2)}</td>
                    <td className="p-2 border-r">{s.s8DiaTons.toFixed(1)}</td>
                    <td className="p-2 border-r">{s.s8NocheTons.toFixed(1)}</td>
                    <td className="p-2 font-semibold bg-slate-50 border-r">{(s.s8DiaTons + s.s8NocheTons).toFixed(1)}</td>
                    <td className="p-2 border-r">{(s.s8DiaVueltas/12).toFixed(2)}</td>
                    <td className="p-2 border-r">{(s.s8NocheVueltas/12).toFixed(2)}</td>
                    <td className="p-2 font-semibold bg-blue-50 border-r">{totalD.toFixed(1)}</td>
                    <td className="p-2 font-semibold bg-indigo-50 border-r">{totalN.toFixed(1)}</td>
                    <td className="p-2 font-bold bg-green-50 border-r">{(totalD + totalN).toFixed(1)}</td>
                    <td className="p-2 font-semibold">{s.s6DiaVueltas + s.s6NocheVueltas + s.s7DiaVueltas + s.s7NocheVueltas + s.s8DiaVueltas + s.s8NocheVueltas}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-slate-200 font-bold">
              <tr>
                <td className="p-2">TOTAL</td>
                <td className="p-2">{totalS6DiaT.toFixed(1)}</td>
                <td className="p-2">{totalS6NocheT.toFixed(1)}</td>
                <td className="p-2">{(totalS6DiaT + totalS6NocheT).toFixed(1)}</td>
                <td className="p-2">-</td>
                <td className="p-2">-</td>
                <td className="p-2">{totalS7DiaT.toFixed(1)}</td>
                <td className="p-2">{totalS7NocheT.toFixed(1)}</td>
                <td className="p-2">{(totalS7DiaT + totalS7NocheT).toFixed(1)}</td>
                <td className="p-2">-</td>
                <td className="p-2">-</td>
                <td className="p-2">{(totalS6DiaT + totalS7DiaT + totalS8DiaT).toFixed(1)}</td>
                <td className="p-2">{(totalS6NocheT + totalS7NocheT + totalS8NocheT).toFixed(1)}</td>
                <td className="p-2">{totalMes.toFixed(1)}</td>
                <td className="p-2">{totalViajes}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="bg-[#1e3a8a] text-white">
          <CardTitle className="text-sm">INDICADORES CLAVE SOLICITADOS (RESUMEN {monthName})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y text-sm font-medium">
            <li className="flex justify-between p-4">
              <span>1. TOTAL TONELADAS ACUMULADAS EN EL MES:</span>
              <span className="text-gray-900">{totalMes.toFixed(1)} t</span>
            </li>
            <li className="flex justify-between p-4">
              <span>2. PROMEDIO VUELTAS / HORA TRABAJADA EN TURNO DÍA (8 AM - 20 PM):</span>
              <span className="text-blue-700">{promVHDia.toFixed(2)} vueltas / hora por equipo</span>
            </li>
            <li className="flex justify-between p-4">
              <span>3. PROMEDIO VUELTAS / HORA TRABAJADA EN TURNO NOCHE (20 PM - 8 AM):</span>
              <span className="text-blue-700">{promVHNoche.toFixed(2)} vueltas / hora por equipo</span>
            </li>
            <li className="flex justify-between p-4">
              <span>4. PROMEDIO GLOBAL VUELTAS / HORA TRABAJADA EN FAENA:</span>
              <span className="text-green-700">{((promVHDia + promVHNoche)/2).toFixed(2)} vueltas / hora por equipo</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ title, value }: { title: string, value: string }) {
  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-col justify-center items-center text-center">
      <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">{title}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function DetalleDiario({ date, s6Trips, s7Trips, s8Trips, summary }: { date: string, s6Trips: Trip[], s7Trips: Trip[], s8Trips: Trip[], summary: DailySummary }) {
  
  const s6Dia = s6Trips.filter(t => t.shift === 'Día').sort((a,b) => a.time.localeCompare(b.time));
  const s6Noche = s6Trips.filter(t => t.shift === 'Noche').sort((a,b) => a.time.localeCompare(b.time));
  const s7Dia = s7Trips.filter(t => t.shift === 'Día').sort((a,b) => a.time.localeCompare(b.time));
  const s7Noche = s7Trips.filter(t => t.shift === 'Noche').sort((a,b) => a.time.localeCompare(b.time));
  const s8Dia = s8Trips.filter(t => t.shift === 'Día').sort((a,b) => a.time.localeCompare(b.time));
  const s8Noche = s8Trips.filter(t => t.shift === 'Noche').sort((a,b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-[#0f172a] text-white">
          <CardTitle className="text-center text-sm uppercase">Reporte Operacional y Rendimiento por Turno - {date}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-center text-sm">
            <thead className="bg-slate-100 text-xs font-semibold">
              <tr>
                <th className="p-2 border">MÉTRICA</th>
                <th className="p-2 border">S6 TURNO DÍA</th>
                <th className="p-2 border">S6 TURNO NOCHE</th>
                <th className="p-2 border bg-blue-50">S6 TOTAL</th>
                <th className="p-2 border">S7 TURNO DÍA</th>
                <th className="p-2 border">S7 TURNO NOCHE</th>
                <th className="p-2 border bg-indigo-50">S7 TOTAL</th>
                <th className="p-2 border">S8 TURNO DÍA</th>
                <th className="p-2 border">S8 TURNO NOCHE</th>
                <th className="p-2 border bg-emerald-50">S8 TOTAL</th>
                <th className="p-2 border bg-slate-200">TOTAL DÍA (8-20)</th>
                <th className="p-2 border bg-slate-200">TOTAL NOCHE (20-8)</th>
                <th className="p-2 border bg-slate-300">TOTAL DÍA (t)</th>
                <th className="p-2 border">PROM / EQUIPO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border font-bold">RESUMEN DÍA</td>
                <td className="p-2 border">{summary.s6DiaTons.toFixed(1)}</td>
                <td className="p-2 border">{summary.s6NocheTons.toFixed(1)}</td>
                <td className="p-2 border font-bold bg-blue-50">{(summary.s6DiaTons + summary.s6NocheTons).toFixed(1)}</td>
                <td className="p-2 border">{summary.s7DiaTons.toFixed(1)}</td>
                <td className="p-2 border">{summary.s7NocheTons.toFixed(1)}</td>
                <td className="p-2 border font-bold bg-indigo-50">{(summary.s7DiaTons + summary.s7NocheTons).toFixed(1)}</td>
                <td className="p-2 border font-bold bg-slate-200">{(summary.s6DiaTons + summary.s7DiaTons + summary.s8DiaTons).toFixed(1)}</td>
                <td className="p-2 border font-bold bg-slate-200">{(summary.s6NocheTons + summary.s7NocheTons + summary.s8NocheTons).toFixed(1)}</td>
                <td className="p-2 border font-bold bg-slate-300 text-lg">{(summary.s6DiaTons + summary.s6NocheTons + summary.s7DiaTons + summary.s7NocheTons + summary.s8DiaTons + summary.s8NocheTons).toFixed(1)}</td>
                <td className="p-2 border font-bold">{((summary.s6DiaTons + summary.s6NocheTons + summary.s7DiaTons + summary.s7NocheTons + summary.s8DiaTons + summary.s8NocheTons)/2).toFixed(1)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Turno Día */}
        <Card className="border-blue-200">
          <CardHeader className="bg-blue-600 text-white p-3">
            <CardTitle className="text-center text-sm">TURNO DÍA (08:00 AM - 20:00 PM)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex">
              <div className="flex-1 border-r">
                <div className="bg-[#1e3a8a] text-white text-xs text-center py-1 font-semibold">SANNY 06 - TURNO DÍA</div>
                <TripTable trips={s6Dia} />
              </div>
              <div className="flex-1">
                <div className="bg-[#15803d] text-white text-xs text-center py-1 font-semibold">SANNY 07 - TURNO DÍA</div>
                <TripTable trips={s7Dia} />
              </div>
              
              <div className="flex-1">
                <div className="bg-[#059669] text-white text-xs text-center py-1 font-semibold">SANNY 08 - TURNO DÍA</div>
                <TripTable trips={s8Dia} />
              </div>

            </div>
            {/* Resumen Footer */}
            <div className="bg-slate-100 p-2 text-xs flex justify-between">
              <div className="w-1/3 pr-2 space-y-1">
                <div className="flex justify-between font-bold border-b pb-1"><span>TOTAL S6 DÍA</span> <span>{summary.s6DiaTons.toFixed(1)}</span></div>
                <div className="flex justify-between"><span>VUELTAS S6 DÍA</span> <span>{summary.s6DiaVueltas}</span></div>
                <div className="flex justify-between"><span>PROM. S6 DÍA (t/vj)</span> <span>{summary.s6DiaVueltas ? (summary.s6DiaTons/summary.s6DiaVueltas).toFixed(2) : 0}</span></div>
                <div className="flex justify-between bg-purple-100 p-1 font-semibold"><span>VUELTAS / HORA S6 DÍA</span> <span>{(summary.s6DiaVueltas/12).toFixed(2)}</span></div>
              </div>
              <div className="w-1/3 pl-2 space-y-1 border-l">
                <div className="flex justify-between font-bold border-b pb-1"><span>TOTAL S7 DÍA</span> <span>{summary.s7DiaTons.toFixed(1)}</span></div>
                <div className="flex justify-between"><span>VUELTAS S7 DÍA</span> <span>{summary.s7DiaVueltas}</span></div>
                <div className="flex justify-between"><span>PROM. S7 DÍA (t/vj)</span> <span>{summary.s7DiaVueltas ? (summary.s7DiaTons/summary.s7DiaVueltas).toFixed(2) : 0}</span></div>
                <div className="flex justify-between bg-purple-100 p-1 font-semibold"><span>VUELTAS / HORA S7 DÍA</span> <span>{(summary.s7DiaVueltas/12).toFixed(2)}</span></div>
              </div>
              <div className="w-1/3 pl-2 space-y-1 border-l">
                <div className="flex justify-between font-bold border-b pb-1"><span>TOTAL S8 NOCHE</span> <span>{summary.s8NocheTons.toFixed(1)}</span></div>
                <div className="flex justify-between"><span>VUELTAS S8 NOCHE</span> <span>{summary.s8NocheVueltas}</span></div>
                <div className="flex justify-between"><span>PROM. S8 NOCHE (t/vj)</span> <span>{summary.s8NocheVueltas ? (summary.s8NocheTons/summary.s8NocheVueltas).toFixed(2) : 0}</span></div>
                <div className="flex justify-between bg-emerald-100 p-1 font-semibold"><span>VUELTAS / HORA S8 NOCHE</span> <span>{(summary.s8NocheVueltas/12).toFixed(2)}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Turno Noche */}
        <Card className="border-indigo-200">
          <CardHeader className="bg-[#312e81] text-white p-3">
            <CardTitle className="text-center text-sm">TURNO NOCHE (20:00 PM - 08:00 AM)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex">
              <div className="flex-1 border-r">
                <div className="bg-[#1e3a8a] text-white text-xs text-center py-1 font-semibold">SANNY 06 - TURNO NOCHE</div>
                <TripTable trips={s6Noche} />
              </div>
              <div className="flex-1">
                <div className="bg-[#15803d] text-white text-xs text-center py-1 font-semibold">SANNY 07 - TURNO NOCHE</div>
                <TripTable trips={s7Noche} />
              </div>
              
              <div className="flex-1">
                <div className="bg-[#059669] text-white text-xs text-center py-1 font-semibold">SANNY 08 - TURNO NOCHE</div>
                <TripTable trips={s8Noche} />
              </div>

            </div>
            {/* Resumen Footer */}
            <div className="bg-slate-100 p-2 text-xs flex justify-between">
              <div className="w-1/3 pr-2 space-y-1">
                <div className="flex justify-between font-bold border-b pb-1"><span>TOTAL S6 NOCHE</span> <span>{summary.s6NocheTons.toFixed(1)}</span></div>
                <div className="flex justify-between"><span>VUELTAS S6 NOCHE</span> <span>{summary.s6NocheVueltas}</span></div>
                <div className="flex justify-between"><span>PROM. S6 NOCHE (t/vj)</span> <span>{summary.s6NocheVueltas ? (summary.s6NocheTons/summary.s6NocheVueltas).toFixed(2) : 0}</span></div>
                <div className="flex justify-between bg-purple-100 p-1 font-semibold"><span>VUELTAS / HORA S6 NOCHE</span> <span>{(summary.s6NocheVueltas/12).toFixed(2)}</span></div>
              </div>
              <div className="w-1/3 pl-2 space-y-1 border-l">
                <div className="flex justify-between font-bold border-b pb-1"><span>TOTAL S7 NOCHE</span> <span>{summary.s7NocheTons.toFixed(1)}</span></div>
                <div className="flex justify-between"><span>VUELTAS S7 NOCHE</span> <span>{summary.s7NocheVueltas}</span></div>
                <div className="flex justify-between"><span>PROM. S7 NOCHE (t/vj)</span> <span>{summary.s7NocheVueltas ? (summary.s7NocheTons/summary.s7NocheVueltas).toFixed(2) : 0}</span></div>
                <div className="flex justify-between bg-purple-100 p-1 font-semibold"><span>VUELTAS / HORA S7 NOCHE</span> <span>{(summary.s7NocheVueltas/12).toFixed(2)}</span></div>
              </div>
              <div className="w-1/3 pl-2 space-y-1 border-l">
                <div className="flex justify-between font-bold border-b pb-1"><span>TOTAL S8 NOCHE</span> <span>{summary.s8NocheTons.toFixed(1)}</span></div>
                <div className="flex justify-between"><span>VUELTAS S8 NOCHE</span> <span>{summary.s8NocheVueltas}</span></div>
                <div className="flex justify-between"><span>PROM. S8 NOCHE (t/vj)</span> <span>{summary.s8NocheVueltas ? (summary.s8NocheTons/summary.s8NocheVueltas).toFixed(2) : 0}</span></div>
                <div className="flex justify-between bg-emerald-100 p-1 font-semibold"><span>VUELTAS / HORA S8 NOCHE</span> <span>{(summary.s8NocheVueltas/12).toFixed(2)}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}

function TripTable({ trips }: { trips: Trip[] }) {
  return (
    <table className="w-full text-center text-xs">
      <thead className="bg-gray-100 border-b">
        <tr>
          <th className="p-1 border-r w-16">Nº Viaje</th>
          <th className="p-1 border-r">Hora</th>
          <th className="p-1">Capacidad (t)</th>
        </tr>
      </thead>
      <tbody>
        {trips.length === 0 ? (
          <tr><td colSpan={3} className="p-4 text-gray-400">Sin datos</td></tr>
        ) : (
          trips.map((t, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              <td className="p-1 border-r text-gray-500">{idx + 1}</td>
              <td className="p-1 border-r">{t.time}</td>
              <td className="p-1">{t.capacity.toFixed(1)}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}
