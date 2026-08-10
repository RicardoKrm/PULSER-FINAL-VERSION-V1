import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Calendar, Truck, TrendingUp, AlertCircle, Droplet, FileSpreadsheet, Loader2, Plus, MessageSquarePlus, Edit2, Trash2, CheckSquare, Square } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { Modal } from '../../components/ui/Modal';

type TurnoDetalle = {
  id?: string;
  camion: string;
  chofer: string;
  tonelaje: number;
  vueltas: number;
  petroleo?: number;
  vueltas_detalle?: number[];
};

type Turno = {
  nombre: string;
  supervisor?: string;
  totalVueltas: number;
  totalToneladas: number;
  novedades: string[];
  transfer?: string;
  detalles: TurnoDetalle[];
};

type ReporteDia = {
  id: string;
  fechaStr: string;
  turnos: Turno[];
};

export default function ReporteDiarioPanel() {
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [reportes, setReportes] = useState<ReporteDia[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedDetalle, setExpandedDetalle] = useState<string | null>(null);
  const [selectedDetalleIds, setSelectedDetalleIds] = useState<string[]>([]);

  const [isProduccionModalOpen, setIsProduccionModalOpen] = useState(false);
  const [isNovedadModalOpen, setIsNovedadModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const [prodForm, setProdForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    turno: 'Día',
    camion: '',
    chofer: '',
    vueltas: '',
    tonelaje: '',
    petroleo: '',
    supervisor: ''
  });

  const [novForm, setNovForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    turno: 'Día',
    novedad: '',
    supervisor: ''
  });

  const handleOpenProduccionModal = (data: any = null, fechaContext?: string, turnoContext?: string) => {
    if (data) {
      setEditData(data);
      setProdForm({
        fecha: fechaContext || data.fecha || new Date().toISOString().split('T')[0],
        turno: turnoContext || data.turno || 'Día',
        camion: data.camion || '',
        chofer: data.chofer || '',
        vueltas: data.vueltas?.toString() || '',
        tonelaje: data.tonelaje?.toString() || '',
        petroleo: data.petroleo?.toString() || '',
        supervisor: ''
      });
    } else {
      setEditData(null);
      setProdForm({
        fecha: fechaContext || activeReport?.id || new Date().toISOString().split('T')[0],
        turno: turnoContext || 'Día',
        camion: '',
        chofer: '',
        vueltas: '',
        tonelaje: '',
        petroleo: '',
        supervisor: ''
      });
    }
    setIsProduccionModalOpen(true);
  };

  const handleSaveProduccion = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const payload: any = {
        fecha: prodForm.fecha,
        turno: prodForm.turno,
        camion: prodForm.camion,
        chofer: prodForm.chofer,
        vueltas: parseFloat(prodForm.vueltas) || 0,
        tonelaje: parseFloat(prodForm.tonelaje) || 0,
        petroleo: prodForm.petroleo ? parseFloat(prodForm.petroleo) : null
      };

      if (prodForm.supervisor) {
        payload.novedades = `Firma (Ingreso Manual): ${prodForm.supervisor}`;
      }

      if (editData && editData.id) {
        const { error } = await supabase
          .from('produccion_registro_diario')
          .update(payload)
          .eq('id', editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('produccion_registro_diario')
          .insert([payload]);
        if (error) throw error;
      }
      setIsProduccionModalOpen(false);
      fetchReportes();
    } catch (err: any) {
      alert(`Error al guardar: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveNovedad = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const novedadStr = `${novForm.novedad} | Supervisor: ${novForm.supervisor}`;
      const payload = {
        fecha: novForm.fecha,
        turno: novForm.turno,
        novedades: novedadStr
      };
      const { error } = await supabase
        .from('produccion_registro_diario')
        .insert([payload]);
      if (error) throw error;
      setIsNovedadModalOpen(false);
      setNovForm({ ...novForm, novedad: '', supervisor: '' });
      fetchReportes();
    } catch (err: any) {
      alert(`Error al guardar novedad: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const fetchReportes = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('produccion_registro_diario')
        .select('*');
        
      if (error) {
         if (error.code === '42P01') {
             throw new Error("La tabla 'produccion_registro_diario' no existe en la base de datos.");
         }
         throw new Error(error.message || "Error al cargar los reportes");
      }
      
      if (!Array.isArray(data)) {
         throw new Error("Formato de respuesta inválido");
      }

      // Group by date, then by turno
      const grouped: Record<string, Record<string, any[]>> = {};
      
      data.forEach(row => {
        const dateStr = row.fecha; // YYYY-MM-DD
        if (!grouped[dateStr]) grouped[dateStr] = {};
        
        const turno = row.turno;
        if (!grouped[dateStr][turno]) grouped[dateStr][turno] = [];
        
        grouped[dateStr][turno].push(row);
      });

      const parsedReportes: ReporteDia[] = Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map(dateStr => {
         const dateObj = new Date(dateStr + "T00:00:00");
         const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
         const formattedDate = `${days[dateObj.getDay()]} ${dateStr.split('-').reverse().join('-')}`;
         
         const turnos = Object.keys(grouped[dateStr]).map(turnoName => {
            const rows = grouped[dateStr][turnoName];
            
            let totalVueltas = 0;
            let totalToneladas = 0;
            let novedades = new Set<string>();
            let transfers = new Set<string>();
                  const detalles = rows.map(r => {
               totalVueltas += Number(r.vueltas) || 0;
               totalToneladas += Number(r.tonelaje) || 0;
               
               if (r.novedades) {
                 r.novedades.split('|').forEach((n: string) => {
                   if (n.trim()) novedades.add(n.trim());
                 });
               }
               
               if (r.transfer) {
                 transfers.add(r.transfer);
               }
               
               return {
                 id: r.id,
                 camion: r.camion,
                 chofer: r.chofer,
                 tonelaje: Number(r.tonelaje) || 0,
                 vueltas: Number(r.vueltas) || 0,
                 petroleo: r.petroleo ? Number(r.petroleo) : undefined,
                 vueltas_detalle: r.vueltas_detalle
               };
            });
            
            // Extract the supervisor from the first row of this shift that has it in novedades
            let supervisor = '';
            for (const r of rows) {
              if (r.novedades) {
                const novs = r.novedades.split('|');
                for (const nov of novs) {
                  if (nov.includes('Firma (Ingreso Manual):')) {
                    supervisor = nov.split('Firma (Ingreso Manual):')[1]?.trim();
                    break;
                  } else if (nov.includes('Supervisor:')) {
                    supervisor = nov.split('Supervisor:')[1]?.trim();
                    break;
                  }
                }
              }
              if (supervisor) break;
            }

            return {
               nombre: turnoName,
               supervisor,
               totalVueltas,
               totalToneladas,
               novedades: Array.from(novedades),
               transfer: Array.from(transfers).join(' | '),
               detalles
            };
         });
         
         return {
           id: dateStr,
           fechaStr: formattedDate,
           turnos
         };
      });

      setReportes(parsedReportes);
      if (parsedReportes.length > 0 && !selectedDateId) {
        setSelectedDateId(parsedReportes[0].id);
      }
      
      const allMonths = Array.from(new Set(parsedReportes.map(r => r.id.substring(0, 7)))).sort((a, b) => b.localeCompare(a));
      if (allMonths.length > 0 && !selectedMonth) {
         setSelectedMonth(allMonths[0]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectDetalle = (id: string) => {
    setSelectedDetalleIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllTurno = (turno: Turno) => {
    const turnoIds = turno.detalles.map(d => d.id).filter((id): id is string => !!id);
    const allSelected = turnoIds.every(id => selectedDetalleIds.includes(id));
    if (allSelected) {
      setSelectedDetalleIds(prev => prev.filter(id => !turnoIds.includes(id)));
    } else {
      setSelectedDetalleIds(prev => {
        const otherIds = prev.filter(id => !turnoIds.includes(id));
        return [...otherIds, ...turnoIds];
      });
    }
  };

  const handleDeleteSelectedDetalles = async (turno: Turno) => {
    const turnoIds = turno.detalles.map(d => d.id).filter((id): id is string => !!id && selectedDetalleIds.includes(id));
    if (turnoIds.length === 0) return;
    
    const result = await Swal.fire({
      title: '¿Confirmar eliminación?',
      text: `¿Está seguro de que desea eliminar los ${turnoIds.length} registros seleccionados de producción de este turno?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('produccion_registro_diario')
          .delete()
          .in('id', turnoIds);
        if (error) throw error;
        setSelectedDetalleIds(prev => prev.filter(id => !turnoIds.includes(id)));
        await fetchReportes();
        Swal.fire('Eliminado', 'Los registros han sido eliminados con éxito.', 'success');
      } catch (err: any) {
        console.error(err);
        Swal.fire('Error', `Error al eliminar: ${err.message}`, 'error');
        setLoading(false);
      }
    }
  };

  const handleDeleteDetalle = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Confirmar eliminación?',
      text: '¿Está seguro de que desea eliminar este registro de producción?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('produccion_registro_diario')
          .delete()
          .eq('id', id);
        if (error) throw error;
        setSelectedDetalleIds(prev => prev.filter(x => x !== id));
        await fetchReportes();
        Swal.fire('Eliminado', 'El registro ha sido eliminado con éxito.', 'success');
      } catch (err: any) {
        console.error(err);
        Swal.fire('Error', `Error al eliminar: ${err.message}`, 'error');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchReportes();
  }, []);

  const formatNumber = (num: number) => {
    return num.toLocaleString('es-CL', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  const activeReport = useMemo(() => reportes.find(r => r.id === selectedDateId), [reportes, selectedDateId]);

  const availableMonths = useMemo(() => {
    const months = new Set(reportes.map(r => r.id.substring(0, 7)));
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [reportes]);

  const filteredReportes = useMemo(() => {
    if (!selectedMonth) return reportes;
    return reportes.filter(r => r.id.startsWith(selectedMonth));
  }, [reportes, selectedMonth]);

  useEffect(() => {
    if (availableMonths.length > 0 && (!selectedMonth || !availableMonths.includes(selectedMonth))) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  // Update selectedDateId if it's not in the currently filtered month
  useEffect(() => {
    if (filteredReportes.length > 0) {
      if (!selectedDateId || !filteredReportes.find(r => r.id === selectedDateId)) {
        setSelectedDateId(filteredReportes[0].id);
      }
    } else {
      setSelectedDateId(null);
    }
  }, [filteredReportes, selectedDateId]);

  // Total accumulators
  const monthlyTotals = useMemo(() => {
    let totalVueltas = 0;
    let totalToneladas = 0;
    
    filteredReportes.forEach(reporte => {
      reporte.turnos.forEach(turno => {
        totalVueltas += turno.totalVueltas;
        totalToneladas += turno.totalToneladas;
      });
    });

    return { totalVueltas, totalToneladas };
  }, [filteredReportes]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        throw new Error("El archivo Excel está vacío");
      }

      // Format data for DB
      const formattedData = data.map((row, index) => {
        // Find keys dynamically to handle variations in whitespace or casing
        const getVal = (searchStr: string) => {
           const key = Object.keys(row).find(k => k.toLowerCase().includes(searchStr.toLowerCase()));
           return key ? row[key] : undefined;
        };

        // Handle dates
        let fecha = new Date();
        const fechaVal = getVal('fecha');
        if (fechaVal) {
           const fechaStr = fechaVal;
           if (typeof fechaStr === 'number') {
             fecha = new Date(Math.round((fechaStr - 25569) * 86400 * 1000));
           } else {
             const str = String(fechaStr).trim();
             const cleanStr = str.replace(/\//g, '-');
             
             const dateMatch = cleanStr.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
             if (dateMatch) {
               const [_, d, m, y] = dateMatch;
               fecha = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T12:00:00Z`);
             } else {
               const dateMatchRev = cleanStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
               if (dateMatchRev) {
                 const [_, y, m, d] = dateMatchRev;
                 fecha = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T12:00:00Z`);
               } else {
                 fecha = new Date(str);
               }
             }
           }
        }

        let fechaString = new Date().toISOString().split('T')[0];
        if (!isNaN(fecha.getTime())) {
          fechaString = fecha.toISOString().split('T')[0];
        }

        const parseNumber = (val: any) => {
          if (typeof val === 'number') return val;
          if (!val) return 0;
          let str = String(val).trim();
          
          if (str.includes('.') && str.includes(',')) {
             const lastDot = str.lastIndexOf('.');
             const lastComma = str.lastIndexOf(',');
             if (lastComma > lastDot) {
                 str = str.replace(/\./g, '').replace(',', '.');
             } else {
                 str = str.replace(/,/g, '');
             }
          } else if (str.includes(',')) {
             str = str.replace(',', '.');
          }
          
          const num = parseFloat(str);
          return isNaN(num) ? 0 : num;
        };

        const camionVal = getVal('cami');
        const choferVal = getVal('chofer');
        const turnoVal = getVal('turno');
        const tonelajeVal = getVal('tonela');
        const vueltasVal = getVal('vuelta');
        const petroleoVal = getVal('petr');
        const novedadesVal = getVal('novedad') || getVal('totales');
        const supervisorVal = getVal('supervis');
        
        let nStr = String(novedadesVal || '');
        if (supervisorVal) {
           nStr = nStr ? `${nStr} | Supervisor: ${supervisorVal}` : `Supervisor: ${supervisorVal}`;
        }
        const transferVal = getVal('transfer');

        return {
          fecha: fechaString,
          turno: String(turnoVal || 'Día'),
          camion: String(camionVal || ''),
          chofer: String(choferVal || ''),
          tonelaje: parseNumber(tonelajeVal),
          vueltas: parseNumber(vueltasVal),
          petroleo: petroleoVal ? parseNumber(petroleoVal) : null,
          novedades: nStr,
          transfer: String(transferVal || '')
        };
      }).filter(r => r.camion);

      if (formattedData.length === 0) {
        throw new Error("No se encontraron filas válidas en el Excel");
      }

      // Delete existing data for the same fecha and turno before inserting
      const turnosAEliminar = Array.from(new Set(formattedData.map(d => `${d.fecha}|${d.turno}`)));
      for (const combo of turnosAEliminar) {
         const [fecha, turno] = combo.split('|');
         await supabase
           .from('produccion_registro_diario')
           .delete()
           .eq('fecha', fecha)
           .eq('turno', turno);
      }

      // Bulk insert
      const { data: insertedData, error } = await supabase
        .from('produccion_registro_diario')
        .insert(formattedData)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      alert(`Carga exitosa. ${formattedData.length} registros insertados.`);
      await fetchReportes();
    } catch (err: any) {
      alert(`Error al subir el archivo: ${err.message}`);
    } finally {
      setUploading(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleFileUploadDiario = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length === 0) throw new Error("El archivo Excel está vacío");

      let globalDate = new Date().toISOString().split('T')[0];
      let globalTurno = "Día";

      for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i];
        if (!row) continue;
        for (let j = 0; j < row.length; j++) {
           const cell = String(row[j]).trim().toLowerCase();
           if (cell.includes('turno')) {
             if (cell.includes('noche')) globalTurno = 'Noche';
             else globalTurno = 'Día';
           }
           if (/^\d{2}\.\d{2}\.\d{2}$/.test(cell)) {
              const [d, m, y] = cell.split('.');
              globalDate = `20${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
           }
        }
      }

      let headerRowIndex = -1;
      let supervisorColIndex = -1;
      for (let i = 0; i < data.length; i++) {
        if (data[i] && data[i].some(cell => String(cell).toUpperCase().includes('NOMBRE') || String(cell).toUpperCase().includes('CONDUCTOR'))) {
           headerRowIndex = i;
           supervisorColIndex = data[i].findIndex(cell => String(cell).toUpperCase().includes('SUPERVISOR'));
           break;
        }
      }

      if (headerRowIndex === -1) {
         throw new Error("No se encontraron las cabeceras del reporte (buscando 'CONDUCTOR')");
      }
      
      const payloadData: any[] = [];
      for (let i = headerRowIndex + 2; i < data.length; i++) {
         const row = data[i];
         if (!row || row.length === 0) continue;
         const n_camion = row[0];
         const conductor = row[1];
         
         if (String(n_camion).toUpperCase().includes('TONS TRANSPORTADAS') || String(conductor).toUpperCase().includes('TONS TRANSPORTADAS')) {
            break;
         }
         
         if (!n_camion && !conductor) continue;

         const vueltas_detalle = [];
         for (let col = 2; col <= 7; col++) {
             const val = row[col];
             if (val !== undefined && val !== null && val !== '') {
                 let num = parseFloat(String(val).replace(',', '.'));
                 if (!isNaN(num)) {
                    if (num > 1000) num = num / 1000;
                    vueltas_detalle.push(Number(num.toFixed(3)));
                 }
             }
         }
         
         let totalTons = row[8];
         if (totalTons !== undefined) {
             let num = parseFloat(String(totalTons).replace(',', '.'));
             if (!isNaN(num)) {
                if (num > 1000) num = num / 1000;
                totalTons = num;
             }
         } else {
             totalTons = vueltas_detalle.reduce((a,b) => a+b, 0);
         }
         
         let totalVueltas = row[9];
         if (totalVueltas === undefined || isNaN(parseInt(String(totalVueltas)))) {
             totalVueltas = vueltas_detalle.length;
         } else {
             totalVueltas = parseInt(String(totalVueltas));
         }
         
         let supervisorVal = '';
         if (supervisorColIndex !== -1 && row[supervisorColIndex]) {
             supervisorVal = String(row[supervisorColIndex]);
         }

         payloadData.push({
             fecha: globalDate,
             turno: globalTurno,
             camion: String(n_camion || ''),
             chofer: String(conductor || ''),
             tonelaje: totalTons || 0,
             vueltas: totalVueltas || 0,
             vueltas_detalle: vueltas_detalle,
             petroleo: null,
             novedades: supervisorVal ? `Supervisor: ${supervisorVal}` : ''
         });
      }

      if (payloadData.length === 0) {
        throw new Error("No se encontraron registros de producción válidos en el archivo.");
      }
      
      // Delete existing data for the same fecha and turno before inserting
      const turnosAEliminar = Array.from(new Set(payloadData.map(d => `${d.fecha}|${d.turno}`)));
      for (const combo of turnosAEliminar) {
         const [fecha, turno] = combo.split('|');
         await supabase
           .from('produccion_registro_diario')
           .delete()
           .eq('fecha', fecha)
           .eq('turno', turno);
      }

      const { error } = await supabase
        .from('produccion_registro_diario')
        .insert(payloadData);

      if (error) throw error;
      
      await fetchReportes();
      alert(`Se importaron ${payloadData.length} registros de forma masiva.`);
      setIsProduccionModalOpen(false);
      
    } catch (err: any) {
      console.error(err);
      alert(`Error al procesar excel: ${err.message}`);
    } finally {
      setUploading(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Totals Section */}
      <div className="bg-gradient-to-br from-blue-900 to-slate-800 rounded-xl p-6 text-white shadow-lg relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-xl font-semibold text-blue-100 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Total Acumulado del Mes
          </h2>
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <button
              onClick={() => handleOpenProduccionModal()}
              className="flex items-center bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium border border-white/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Producción
            </button>
            <button
              onClick={() => setIsNovedadModalOpen(true)}
              className="flex items-center bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium border border-white/20"
            >
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              Novedades
            </button>
            <label className={`flex items-center ${uploading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-500'} text-white py-2 px-4 rounded-md transition-colors text-sm font-medium border border-blue-400 cursor-pointer`}>
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 mr-2" />
              )}
              {uploading ? 'Subiendo...' : 'Importar Excel'}
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 rounded-lg p-4 border border-white/20">
            <p className="text-sm text-blue-200 mb-1 font-medium">Total Toneladas (Mes)</p>
            <p className="text-3xl font-bold">{formatNumber(monthlyTotals.totalToneladas)} Ton</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 border border-white/20">
            <p className="text-sm text-blue-200 mb-1 font-medium">Total Vueltas (Mes)</p>
            <p className="text-3xl font-bold">{monthlyTotals.totalVueltas} Vueltas</p>
          </div>
        </div>
      </div>

      {loading ? (
        <Card className="p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </Card>
      ) : errorMsg ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-red-50 text-red-500 p-4 rounded-full mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error de Conexión</h3>
          <p className="text-gray-500 dark:text-slate-500 max-w-md">{errorMsg}</p>
        </Card>
      ) : reportes.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-blue-50 text-blue-500 p-4 rounded-full mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No hay datos de producción</h3>
          <p className="text-gray-500 dark:text-slate-500 max-w-md">
            El módulo de reportes diarios está listo. Utiliza el botón "Importar Excel" en la parte superior para realizar la carga masiva de los datos de este mes.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Date Selector Sidebar */}
          <Card className="p-4 lg:w-64 shrink-0 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Filtro y Selección
            </h3>
            
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                Mes del Reporte
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full text-sm rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-1.5 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
              >
                {availableMonths.length === 0 && <option value="">Sin datos</option>}
                {availableMonths.map(month => {
                  const [year, m] = month.split('-');
                  const date = new Date(parseInt(year), parseInt(m) - 1, 1);
                  const monthName = date.toLocaleString('es-CL', { month: 'long', year: 'numeric' });
                  return (
                    <option key={month} value={month}>
                      {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">
              Días disponibles:
            </div>
            <div className="space-y-2 overflow-y-auto flex-1 max-h-[600px] pr-1">
              {filteredReportes.map(reporte => (
                <button
                  key={reporte.id}
                  onClick={() => setSelectedDateId(reporte.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedDateId === reporte.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800/50'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  {reporte.fechaStr}
                </button>
              ))}
              {filteredReportes.length === 0 && (
                <div className="text-sm text-gray-500 italic text-center py-4">No hay días en este mes</div>
              )}
            </div>
          </Card>

          {/* Daily Report Detail */}
          <div className="flex-1 space-y-6">
            {activeReport?.turnos.map((turno, idx) => (
              <Card key={idx} className="p-6">
              <div className="border-b border-gray-200 dark:border-slate-700 pb-4 mb-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Fecha: <span className="font-normal text-gray-600 dark:text-slate-400">{activeReport.fechaStr}</span>
                  </h3>
                  <div className="flex flex-col items-end">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200">
                      Turno: {turno.nombre}
                    </span>
                    {turno.supervisor && (
                      <div className="mt-2 flex flex-col items-end">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Supervisor de Turno</span>
                        <div className="mt-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">{turno.supervisor}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-md text-gray-700 dark:text-slate-300 font-medium">
                  Totales del turno:{' '}
                  <span className="text-blue-600">{turno.totalVueltas} Vueltas</span> |{' '}
                  <span className="text-blue-600">{formatNumber(turno.totalToneladas)} Toneladas</span>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Novedades:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {turno.novedades.map((novedad, nIdx) => (
                    <li key={nIdx} className="text-sm text-gray-600 dark:text-slate-400">{novedad}</li>
                  ))}
                </ul>
              </div>

              {turno.transfer && (
                <div className="mb-6 bg-yellow-50 dark:bg-amber-900/20 p-3 rounded-md border border-yellow-200 dark:border-amber-800/50 text-sm text-yellow-800 dark:text-amber-400">
                  <span className="font-bold">Transfer:</span> {turno.transfer}
                </div>
              )}

              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Detalle por Camión y Chofer:</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleSelectAllTurno(turno)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                      {turno.detalles.length > 0 && turno.detalles.map(d => d.id).filter(id => !!id).every(id => selectedDetalleIds.includes(id!)) ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                    </button>
                    {turno.detalles.some(d => d.id && selectedDetalleIds.includes(d.id)) && (
                      <button
                        onClick={() => handleDeleteSelectedDetalles(turno)}
                        className="text-xs bg-red-100 hover:bg-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 px-2.5 py-1 rounded font-semibold transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar Seleccionados ({turno.detalles.filter(d => d.id && selectedDetalleIds.includes(d.id)).length})
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider w-10">Sel.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Camión</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Chofer</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Tonelaje</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Vueltas</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Petróleo</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                      {(() => {
                        const maxTonelaje = Math.max(...turno.detalles.map(d => d.tonelaje), 0.01);
                        return turno.detalles.map((detalle, dIdx) => (
                          <React.Fragment key={dIdx}>
                          <tr className={`hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer ${expandedDetalle === detalle.id ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''}`} onClick={() => setExpandedDetalle(expandedDetalle === detalle.id ? null : (detalle.id || null))}>
                            <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              {detalle.id ? (
                                <input
                                  type="checkbox"
                                  checked={selectedDetalleIds.includes(detalle.id)}
                                  onChange={() => toggleSelectDetalle(detalle.id!)}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                />
                              ) : null}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white flex items-center">
                              <Truck className="w-4 h-4 mr-2 text-gray-400" />
                              {detalle.camion}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 hover:underline">{detalle.chofer}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                              <div className="flex flex-col items-end">
                                <span className="font-medium mb-1">{formatNumber(detalle.tonelaje)}</span>
                                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500 rounded-full" 
                                    style={{ width: `${Math.min(100, (detalle.tonelaje / maxTonelaje) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">{detalle.vueltas}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400 text-right">
                              {detalle.petroleo ? (
                                <span className="flex items-center justify-end">
                                  {formatNumber(detalle.petroleo)}
                                  <Droplet className="w-3 h-3 ml-1 text-blue-400" />
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400 text-right">
                              <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleOpenProduccionModal(detalle, activeReport.id, turno.nombre)}
                                  className="text-blue-600 hover:text-blue-900 p-1"
                                  title="Editar fila"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                {detalle.id && (
                                  <button
                                    onClick={() => handleDeleteDetalle(detalle.id!)}
                                    className="text-red-600 hover:text-red-900 p-1"
                                    title="Eliminar fila"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandedDetalle === detalle.id && (
                            <tr>
                              <td colSpan={7} className="px-4 py-4 bg-gray-50 dark:bg-slate-800/80 border-b border-gray-100">
                                <div className="text-sm text-gray-700 dark:text-slate-300">
                                   <span className="font-semibold block mb-2 text-gray-900 dark:text-white">Detalle de Vueltas (Toneladas):</span>
                                   {detalle.vueltas_detalle && detalle.vueltas_detalle.length > 0 ? (
                                     <div className="flex flex-wrap gap-2">
                                        {detalle.vueltas_detalle.map((ton, idx) => (
                                           <div key={idx} className="bg-white dark:bg-slate-800 px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-md shadow-sm flex flex-col items-center min-w-[70px]">
                                             <span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase font-semibold">Vuelta {idx + 1}</span>
                                             <span className="font-mono font-medium text-blue-700 dark:text-blue-400">{formatNumber(ton)}</span>
                                           </div>
                                        ))}
                                     </div>
                                   ) : (
                                     <span className="text-gray-500 dark:text-slate-500 italic">No hay detalles por vuelta registrados para este conductor.</span>
                                   )}
                                </div>
                              </td>
                            </tr>
                          )}
                          </React.Fragment>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          ))}
        </div>
        </div>
      )}

      <Modal isOpen={isProduccionModalOpen} onClose={() => setIsProduccionModalOpen(false)} title={editData ? "Editar Producción" : "Agregar Producción"}>
        {!editData && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
            <span className="text-sm text-blue-800 dark:text-blue-300 font-medium">¿Tienes el reporte diario en Excel (Formato Vueltas)?</span>
            <label className={`flex items-center justify-center ${uploading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-500'} text-white py-1.5 px-3 rounded-md transition-colors text-sm font-medium cursor-pointer shadow-sm`}>
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
              {uploading ? 'Importando...' : 'Importar Excel Diario'}
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUploadDiario} disabled={uploading} />
            </label>
          </div>
        )}
        <form onSubmit={handleSaveProduccion} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Fecha</label>
              <input type="date" required value={prodForm.fecha} onChange={e => setProdForm({...prodForm, fecha: e.target.value})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 shadow-md px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Turno</label>
              <select required value={prodForm.turno} onChange={e => setProdForm({...prodForm, turno: e.target.value})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 shadow-md px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500">
                <option value="Día">Día</option>
                <option value="Noche">Noche</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Camión</label>
              <input type="text" required value={prodForm.camion} onChange={e => setProdForm({...prodForm, camion: e.target.value})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 shadow-md px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Chofer</label>
              <input type="text" required value={prodForm.chofer} onChange={e => setProdForm({...prodForm, chofer: e.target.value})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 shadow-md px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Vueltas</label>
              <input type="number" step="1" required value={prodForm.vueltas} onChange={e => setProdForm({...prodForm, vueltas: e.target.value})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 shadow-md px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tonelaje</label>
              <input type="number" step="0.01" required value={prodForm.tonelaje} onChange={e => setProdForm({...prodForm, tonelaje: e.target.value})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 shadow-md px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Petróleo</label>
              <input type="number" step="0.01" value={prodForm.petroleo} onChange={e => setProdForm({...prodForm, petroleo: e.target.value})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 shadow-md px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Supervisor a cargo (Firma)</label>
            <input type="text" placeholder="Ej: Juan Pérez" value={prodForm.supervisor} onChange={e => setProdForm({...prodForm, supervisor: e.target.value})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 shadow-md px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={() => setIsProduccionModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800">Cancelar</button>
            <button type="submit" disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {uploading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isNovedadModalOpen} onClose={() => setIsNovedadModalOpen(false)} title="Agregar Novedad">
        <form onSubmit={handleSaveNovedad} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Fecha</label>
              <input type="date" required value={novForm.fecha} onChange={e => setNovForm({...novForm, fecha: e.target.value})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 shadow-md px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Turno</label>
              <select required value={novForm.turno} onChange={e => setNovForm({...novForm, turno: e.target.value})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 shadow-md px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500">
                <option value="Día">Día</option>
                <option value="Noche">Noche</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Supervisor a cargo (Firma)</label>
            <input type="text" required placeholder="Ej: Juan Pérez" value={novForm.supervisor} onChange={e => setNovForm({...novForm, supervisor: e.target.value})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 shadow-md px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Novedad</label>
            <textarea required rows={4} placeholder="Describa la novedad del turno..." value={novForm.novedad} onChange={e => setNovForm({...novForm, novedad: e.target.value})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 shadow-md px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={() => setIsNovedadModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800">Cancelar</button>
            <button type="submit" disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {uploading ? 'Guardando...' : 'Confirmar Novedad'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
