import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { 
  FileSpreadsheet, 
  Upload, 
  Clock, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  Calendar, 
  Download, 
  Loader2, 
  RefreshCw, 
  Droplet, 
  Truck, 
  Percent, 
  TrendingUp,
  Database,
  ChevronLeft,
  ChevronRight,
  Info,
  Sun,
  Moon,
  FileText,
  CheckSquare,
  Square,
  ChevronDown,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { 
  HorasMaquinaRecord, 
  getAllHorasMaquina, 
  saveAllHorasMaquina, 
  addHorasMaquinaRecord, 
  updateHorasMaquinaRecord, 
  deleteHorasMaquinaRecord, 
  clearHorasMaquinaRecords, 
  generateSampleDataset 
} from '../../lib/horasMaquinaDB';
import { parseHorasMaquinaExcel } from '../../lib/excelHorasMaquinaParser';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  ComposedChart, 
  Area 
} from 'recharts';

export default function HorasMaquinaPage() {
  const [activeTab, setActiveTab] = useState<'registro' | 'disponibilidad'>('registro');
  const [records, setRecords] = useState<HorasMaquinaRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Pagination State for 6,000 rows
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Tab 1 Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilterType, setDateFilterType] = useState<'todos' | 'dia' | 'semana' | 'mes' | 'rango'>('todos');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedEquipo, setSelectedEquipo] = useState<string>('todos');
  const [selectedTurno, setSelectedTurno] = useState<string>('todos');

  // Tab 2 Filters
  const [dispoYear, setDispoYear] = useState<number>(2026);
  const [dispoMonth, setDispoMonth] = useState<string>('todos'); // 'todos' or '1'..'12'
  const [baseHorasMes, setBaseHorasMes] = useState<number>(720); // standard 720 hrs

  // Tab 2 Multi-Select Vehicles Filter
  const [selectedEquiposDispo, setSelectedEquiposDispo] = useState<string[]>([]);
  const [isVehicleFilterOpen, setIsVehicleFilterOpen] = useState<boolean>(false);
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState<string>('');
  const [isFilterInitialized, setIsFilterInitialized] = useState<boolean>(false);

  // Modals State
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<HorasMaquinaRecord | null>(null);

  // Multi-selection states
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [selectedDispoKeys, setSelectedDispoKeys] = useState<string[]>([]);

  // Form State
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    turno: 'b',
    equipo: '',
    horometroInicial: '',
    horometroFinal: '',
    horas: '',
    operador: '',
    vueltas: '',
    observacion: 'Disponible',
    checklist: 'OK',
    combustibleL: ''
  });

  // Load records from IndexedDB
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllHorasMaquina();
      // If records were generated mock data (REC-...), clear them so user starts completely clean
      const hasOnlyMockData = data.length > 0 && data.every(r => r.id.startsWith('REC-'));
      if (hasOnlyMockData) {
        await clearHorasMaquinaRecords();
        setRecords([]);
      } else {
        setRecords(data || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFilterJulio = () => {
    setDateFilterType('mes');
    setSelectedYear(2026);
    setSelectedMonth(7); // Julio
    setDispoYear(2026);
    setDispoMonth('7');
    setCurrentPage(1);
    setImportNotice('Filtro activado: Mostrando registros e indicadores del mes de Julio 2026.');
    setTimeout(() => setImportNotice(null), 5000);
  };

  // Handle Excel Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setImportNotice(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const result = parseHorasMaquinaExcel(buffer);

        if (result.records.length === 0) {
          alert('No se encontraron registros válidos en el archivo Excel.');
          setUploading(false);
          return;
        }

        // Save imported records (replace previous records with complete Excel dataset)
        await saveAllHorasMaquina(result.records);
        setRecords(result.records);

        const sheetsMsg = result.sheetsProcessed.length > 0 ? ` de ${result.sheetsProcessed.length} hoja(s) [${result.sheetsProcessed.join(', ')}]` : '';
        setImportNotice(`¡Importación Completa! Se cargaron exitosamente ${result.parsedCount.toLocaleString()} registros${sheetsMsg}.`);
        setTimeout(() => setImportNotice(null), 10000);
      } catch (err: any) {
        console.error('Error procesando Excel:', err);
        alert('Error al leer el archivo Excel. Verifique que el formato sea un archivo .xlsx o .xls válido.');
      } finally {
        setUploading(false);
        // Reset file input
        e.target.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Unique lists for dropdowns
  const uniqueEquipos = useMemo(() => {
    const setEq = new Set<string>();
    records.forEach(r => {
      if (r.equipo) setEq.add(r.equipo);
    });
    return Array.from(setEq).sort();
  }, [records]);

  // Auto-initialize selected vehicles with all uniqueEquipos when loaded
  useEffect(() => {
    if (uniqueEquipos.length > 0 && !isFilterInitialized) {
      setSelectedEquiposDispo(uniqueEquipos);
      setIsFilterInitialized(true);
    }
  }, [uniqueEquipos, isFilterInitialized]);

  const toggleEquipoDispo = (eq: string) => {
    setSelectedEquiposDispo(prev => 
      prev.includes(eq) ? prev.filter(item => item !== eq) : [...prev, eq]
    );
  };

  const selectAllEquiposDispo = () => {
    setSelectedEquiposDispo(uniqueEquipos);
  };

  const deselectAllEquiposDispo = () => {
    setSelectedEquiposDispo([]);
  };

  // Helper functions for turnos
  const isTurnoNoche = (t?: string) => {
    if (!t) return false;
    const clean = String(t).toLowerCase().trim();
    return clean === 'a' || clean.includes('noche') || clean.startsWith('a') || clean === '2';
  };

  const isTurnoDia = (t?: string) => {
    if (!t) return true;
    return !isTurnoNoche(t);
  };

  // Filtering for Tab 1
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchStr = `${rec.equipo} ${rec.operador} ${rec.observacion} ${rec.checklist} ${rec.fecha}`.toLowerCase();
        if (!matchStr.includes(term)) return false;
      }

      // Equipo filter
      if (selectedEquipo !== 'todos' && rec.equipo !== selectedEquipo) {
        return false;
      }

      // Turno filter
      if (selectedTurno !== 'todos') {
        if (selectedTurno === 'a' && !isTurnoNoche(rec.turno)) return false;
        if (selectedTurno === 'b' && !isTurnoDia(rec.turno)) return false;
      }

      // Date filter type
      if (dateFilterType === 'dia' && selectedDate) {
        if (rec.fecha !== selectedDate) return false;
      } else if (dateFilterType === 'mes') {
        const [y, m] = rec.fecha.split('-').map(Number);
        if (y !== selectedYear || m !== selectedMonth) return false;
      } else if (dateFilterType === 'semana') {
        // Calculate week number of rec.fecha
        const recDate = new Date(rec.fecha);
        const janFirst = new Date(recDate.getFullYear(), 0, 1);
        const weekNum = Math.ceil((((recDate.getTime() - janFirst.getTime()) / 86400000) + janFirst.getDay() + 1) / 7);
        if (recDate.getFullYear() !== selectedYear || weekNum !== selectedWeek) return false;
      } else if (dateFilterType === 'rango') {
        if (startDate && rec.fecha < startDate) return false;
        if (endDate && rec.fecha > endDate) return false;
      }

      return true;
    });
  }, [records, searchTerm, selectedEquipo, selectedTurno, dateFilterType, selectedDate, selectedYear, selectedMonth, selectedWeek, startDate, endDate]);

  // Pagination for Tab 1
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Tab 1 KPI Totals
  const totalHorasOperativas = useMemo(() => {
    return filteredRecords.reduce((acc, r) => acc + (r.horasOperativas || 0), 0);
  }, [filteredRecords]);

  const totalHorasDia = useMemo(() => {
    return filteredRecords
      .filter(r => isTurnoDia(r.turno))
      .reduce((acc, r) => acc + (r.horasOperativas || 0), 0);
  }, [filteredRecords]);

  const totalHorasNoche = useMemo(() => {
    return filteredRecords
      .filter(r => isTurnoNoche(r.turno))
      .reduce((acc, r) => acc + (r.horasOperativas || 0), 0);
  }, [filteredRecords]);

  const totalMaquinasFiltradas = useMemo(() => {
    return new Set(filteredRecords.map(r => r.equipo).filter(Boolean)).size;
  }, [filteredRecords]);

  const totalCombustibleL = useMemo(() => {
    return filteredRecords.reduce((acc, r) => acc + (r.combustibleL || 0), 0);
  }, [filteredRecords]);

  const totalVueltas = useMemo(() => {
    return filteredRecords.reduce((acc, r) => acc + (r.vueltas || 0), 0);
  }, [filteredRecords]);

  // Bulk Selection and Deletion Handlers
  const toggleSelectAllRegistro = () => {
    const filteredIds = filteredRecords.map(r => r.id);
    const allSelected = filteredIds.every(id => selectedRecordIds.includes(id));
    if (allSelected) {
      setSelectedRecordIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedRecordIds(prev => {
        const otherIds = prev.filter(id => !filteredIds.includes(id));
        return [...otherIds, ...filteredIds];
      });
    }
  };

  const handleDeleteSelectedRecords = async () => {
    if (selectedRecordIds.length === 0) return;
    
    const result = await Swal.fire({
      title: '¿Confirmar eliminación?',
      text: `¿Desea eliminar los ${selectedRecordIds.length} registros seleccionados de hora máquina de la base de datos?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        for (const id of selectedRecordIds) {
          await deleteHorasMaquinaRecord(id);
        }
        setRecords(prev => prev.filter(r => !selectedRecordIds.includes(r.id)));
        setSelectedRecordIds([]);
        Swal.fire('Eliminado', 'Los registros han sido eliminados con éxito.', 'success');
      } catch (err: any) {
        Swal.fire('Error', `Hubo un problema al eliminar: ${err.message}`, 'error');
      }
    }
  };

  const toggleSelectDispoRow = (equipo: string, mesNum: number) => {
    const key = `${equipo}|${mesNum}`;
    setSelectedDispoKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleSelectAllDispo = () => {
    const allKeys = monthlyStatsPerMachine.map(r => `${r.equipo}|${r.mesNum}`);
    const allSelected = allKeys.every(k => selectedDispoKeys.includes(k));
    if (allSelected) {
      setSelectedDispoKeys(prev => prev.filter(k => !allKeys.includes(k)));
    } else {
      setSelectedDispoKeys(prev => {
        const otherKeys = prev.filter(k => !allKeys.includes(k));
        return [...otherKeys, ...allKeys];
      });
    }
  };

  const handleDeleteSelectedDispoRecords = async () => {
    if (selectedDispoKeys.length === 0) return;
    
    const result = await Swal.fire({
      title: '¿Confirmar eliminación permanente?',
      text: `¿Desea eliminar de forma permanente TODOS los registros de horas máquina subyacentes que corresponden a las ${selectedDispoKeys.length} combinaciones de máquina y mes seleccionadas? Esto afectará los cálculos de disponibilidad.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar todo',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const idsToDelete: string[] = [];
      records.forEach(rec => {
        const [y, m] = rec.fecha.split('-').map(Number);
        if (y !== dispoYear) return;
        const key = `${rec.equipo}|${m}`;
        if (selectedDispoKeys.includes(key)) {
          idsToDelete.push(rec.id);
        }
      });

      if (idsToDelete.length === 0) {
        Swal.fire('Aviso', 'No se encontraron registros subyacentes para eliminar.', 'info');
        return;
      }

      try {
        for (const id of idsToDelete) {
          await deleteHorasMaquinaRecord(id);
        }
        setRecords(prev => prev.filter(r => !idsToDelete.includes(r.id)));
        setSelectedDispoKeys([]);
        Swal.fire('Eliminado', `Se eliminaron correctamente ${idsToDelete.length} registros de horas máquina.`, 'success');
      } catch (err: any) {
        Swal.fire('Error', `Hubo un problema al eliminar: ${err.message}`, 'error');
      }
    }
  };

  // Form submit for Save / Edit
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const inic = parseFloat(form.horometroInicial) || 0;
    const fin = parseFloat(form.horometroFinal) || 0;
    let horasOp = parseFloat(form.horas) || 0;

    // If horasOp wasn't explicitly entered but fin > inic, compute it
    if (!horasOp && fin > inic && inic > 0) {
      horasOp = Math.round((fin - inic) * 10) / 10;
    } else if (horasOp) {
      horasOp = Math.round(horasOp * 10) / 10;
    }

    // If fin is 0 and inic > 0 and horasOp > 0, calculate fin
    let finalFin = fin;
    if (finalFin === 0 && inic > 0 && horasOp > 0) {
      finalFin = Math.round((inic + horasOp) * 10) / 10;
    }

    const vueltas = parseInt(form.vueltas) || 0;
    const combustible = parseFloat(form.combustibleL) || Math.round(horasOp * 22);

    if (isEditModalOpen && editingRecord) {
      const updated: HorasMaquinaRecord = {
        ...editingRecord,
        fecha: form.fecha,
        turno: form.turno,
        equipo: form.equipo,
        horometroInicial: inic,
        horometroFinal: finalFin,
        operador: form.operador,
        vueltas,
        observacion: form.observacion,
        checklist: form.checklist,
        horasOperativas: horasOp,
        horasRedondeadas: Math.round(horasOp),
        combustibleL: combustible
      };
      await updateHorasMaquinaRecord(updated);
      setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
      setIsEditModalOpen(false);
    } else {
      const newRec: HorasMaquinaRecord = {
        id: `REC-${Date.now()}`,
        fecha: form.fecha,
        turno: form.turno,
        equipo: form.equipo,
        horometroInicial: inic,
        horometroFinal: finalFin,
        operador: form.operador,
        vueltas,
        observacion: form.observacion,
        checklist: form.checklist,
        horasOperativas: horasOp,
        horasRedondeadas: Math.round(horasOp),
        combustibleL: combustible,
        created_at: new Date().toISOString()
      };
      await addHorasMaquinaRecord(newRec);
      setRecords(prev => [newRec, ...prev]);
      setIsNewModalOpen(false);
    }
  };

  const handleEditClick = (rec: HorasMaquinaRecord) => {
    setEditingRecord(rec);
    setForm({
      fecha: rec.fecha,
      turno: rec.turno,
      equipo: rec.equipo,
      horometroInicial: rec.horometroInicial ? rec.horometroInicial.toString() : '',
      horometroFinal: rec.horometroFinal ? rec.horometroFinal.toString() : '',
      horas: rec.horasOperativas ? rec.horasOperativas.toString() : '',
      operador: rec.operador,
      vueltas: rec.vueltas ? rec.vueltas.toString() : '',
      observacion: rec.observacion,
      checklist: rec.checklist,
      combustibleL: rec.combustibleL ? rec.combustibleL.toString() : ''
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Confirmar eliminación?',
      text: '¿Desea eliminar este registro de hora máquina?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteHorasMaquinaRecord(id);
        setRecords(prev => prev.filter(r => r.id !== id));
        Swal.fire('Eliminado', 'El registro ha sido eliminado con éxito.', 'success');
      } catch (err: any) {
        Swal.fire('Error', `Hubo un problema al eliminar: ${err.message}`, 'error');
      }
    }
  };

  // Export Filtered Table to Excel
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      alert('No hay registros filtrados para exportar en este momento.');
      return;
    }

    const dataToExport = filteredRecords.map(r => ({
      'Fecha': r.fecha,
      'Turno': r.turno === 'a' ? 'Noche (a)' : 'Día (b)',
      'Equipo': r.equipo,
      'INICIA (Horóm. Ini)': r.horometroInicial,
      'FINAL (Horóm. Fin)': r.horometroFinal,
      'Operador': r.operador,
      'N° Vueltas/Pases': r.vueltas,
      'Observación / Estado': r.observacion,
      'Checklist': r.checklist,
      'Horas Máquina': r.horasOperativas,
      'Horas Redondeadas': r.horasRedondeadas,
      'Combustible (L)': r.combustibleL
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Horas_Maquina_Filtradas");
    XLSX.writeFile(wb, `Reporte_Horas_Maquina_Filtrado_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export Monthly Availability Summary to Excel
  const handleExportDisponibilidadExcel = () => {
    if (monthlyStatsPerMachine.length === 0) {
      alert('No hay datos de disponibilidad para exportar con los filtros seleccionados.');
      return;
    }

    const dataToExport = monthlyStatsPerMachine.map(r => ({
      'Equipo / Máquina': r.equipo,
      'Mes / Periodo': r.mesNombre,
      'Año': dispoYear,
      'Días Operados': r.diasTrabajados,
      'Horas Máquina (Uso)': r.horasUso,
      'Combustible Consumido (L)': r.combustibleL,
      'Base Horas Mes': r.baseHoras,
      'Disponibilidad Mensual (%)': `${r.disponibilidadPct}%`,
      'Vueltas Totales': r.vueltas
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resumen_Disponibilidad");
    XLSX.writeFile(wb, `Reporte_Disponibilidad_Flota_${dispoYear}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // -------------------------------------------------------------
  // TAB 2: CALCULOS MENSUALES Y DISPONIBILIDAD
  // -------------------------------------------------------------
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Group records by Equipment and Month
  const monthlyStatsPerMachine = useMemo(() => {
    // Structure: { equipo: { monthNum: { horas: number, combustible: number, vueltas: number, diasSet: Set<string> } } }
    const agg: { [equipo: string]: { [m: number]: { horas: number; combustible: number; vueltas: number; dias: Set<string> } } } = {};

    records.forEach(rec => {
      const [y, m] = rec.fecha.split('-').map(Number);
      if (y !== dispoYear) return;
      if (dispoMonth !== 'todos' && m !== parseInt(dispoMonth, 10)) return;

      // Filter by selected vehicles/equipos
      if (selectedEquiposDispo.length > 0 && !selectedEquiposDispo.includes(rec.equipo)) return;

      if (!agg[rec.equipo]) {
        agg[rec.equipo] = {};
      }
      if (!agg[rec.equipo][m]) {
        agg[rec.equipo][m] = { horas: 0, combustible: 0, vueltas: 0, dias: new Set() };
      }

      agg[rec.equipo][m].horas += rec.horasOperativas || 0;
      agg[rec.equipo][m].combustible += rec.combustibleL || 0;
      agg[rec.equipo][m].vueltas += rec.vueltas || 0;
      agg[rec.equipo][m].dias.add(rec.fecha);
    });

    // Flatten into array for table display
    const rows: {
      equipo: string;
      mesNum: number;
      mesNombre: string;
      horasUso: number;
      combustibleL: number;
      consumoPromedio: number;
      vueltas: number;
      diasTrabajados: number;
      baseHoras: number;
      disponibilidadPct: number;
    }[] = [];

    Object.keys(agg).sort().forEach(eq => {
      Object.keys(agg[eq]).map(Number).sort((a, b) => a - b).forEach(m => {
        const item = agg[eq][m];
        const horasUso = Math.round(item.horas * 10) / 10;
        const comb = Math.round(item.combustible);
        const dispoPct = Math.min(100, Math.round((horasUso / baseHorasMes) * 1000) / 10);
        const consumoProm = horasUso > 0 ? Math.round((comb / horasUso) * 10) / 10 : 0;

        rows.push({
          equipo: eq,
          mesNum: m,
          mesNombre: monthNames[m - 1] || `Mes ${m}`,
          horasUso,
          combustibleL: comb,
          consumoPromedio: consumoProm,
          vueltas: item.vueltas,
          diasTrabajados: item.dias.size,
          baseHoras: baseHorasMes,
          disponibilidadPct: dispoPct
        });
      });
    });

    return rows;
  }, [records, dispoYear, dispoMonth, baseHorasMes, selectedEquiposDispo]);

  // Aggregated totals by Machine across selected months
  const aggregatedByMachineTotal = useMemo(() => {
    const agg: { [equipo: string]: { horasUso: number; combustibleL: number; vueltas: number; countMeses: number } } = {};

    monthlyStatsPerMachine.forEach(row => {
      if (!agg[row.equipo]) {
        agg[row.equipo] = { horasUso: 0, combustibleL: 0, vueltas: 0, countMeses: 0 };
      }
      agg[row.equipo].horasUso += row.horasUso;
      agg[row.equipo].combustibleL += row.combustibleL;
      agg[row.equipo].vueltas += row.vueltas;
      agg[row.equipo].countMeses += 1;
    });

    return Object.keys(agg).map(eq => {
      const item = agg[eq];
      const totalBase = (item.countMeses || 1) * baseHorasMes;
      const dispoPct = Math.min(100, Math.round((item.horasUso / totalBase) * 1000) / 10);
      const consumoProm = item.horasUso > 0 ? Math.round((item.combustibleL / item.horasUso) * 10) / 10 : 0;

      return {
        equipo: eq,
        horasUso: Math.round(item.horasUso * 10) / 10,
        combustibleL: Math.round(item.combustibleL),
        vueltas: item.vueltas,
        countMeses: item.countMeses,
        baseTotal: totalBase,
        disponibilidadPct: dispoPct,
        consumoPromedio: consumoProm
      };
    }).sort((a, b) => b.horasUso - a.horasUso);
  }, [monthlyStatsPerMachine, baseHorasMes]);

  // Global Fleet Summary Metrics
  const globalFleetStats = useMemo(() => {
    const totalEquipos = aggregatedByMachineTotal.length;
    const totalHorasFlota = aggregatedByMachineTotal.reduce((sum, r) => sum + r.horasUso, 0);
    const totalCombustibleFlota = aggregatedByMachineTotal.reduce((sum, r) => sum + r.combustibleL, 0);
    const totalBaseHorasFlota = aggregatedByMachineTotal.reduce((sum, r) => sum + r.baseTotal, 0);

    const dispoGlobalPct = totalBaseHorasFlota > 0 
      ? Math.min(100, Math.round((totalHorasFlota / totalBaseHorasFlota) * 1000) / 10)
      : 0;

    const consumoPromFlota = totalHorasFlota > 0 ? Math.round((totalCombustibleFlota / totalHorasFlota) * 10) / 10 : 0;

    return {
      totalEquipos,
      totalHorasFlota: Math.round(totalHorasFlota * 10) / 10,
      totalCombustibleFlota: Math.round(totalCombustibleFlota),
      dispoGlobalPct,
      consumoPromFlota
    };
  }, [aggregatedByMachineTotal]);

  // Monthly trend for whole fleet across Enero - Diciembre
  const monthlyFleetTrend = useMemo(() => {
    return monthNames.map((name, idx) => {
      const monthNum = idx + 1;
      // Find all records for this month filtering selected vehicles
      const monthRecs = records.filter(r => {
        const [y, m] = r.fecha.split('-').map(Number);
        if (y !== dispoYear || m !== monthNum) return false;
        if (selectedEquiposDispo.length > 0 && !selectedEquiposDispo.includes(r.equipo)) return false;
        return true;
      });

      const horasMonth = monthRecs.reduce((s, r) => s + (r.horasOperativas || 0), 0);
      const combMonth = monthRecs.reduce((s, r) => s + (r.combustibleL || 0), 0);
      
      // Get unique machines that reported in this month
      const activeEqs = new Set(monthRecs.map(r => r.equipo)).size || 1;
      const baseTotalMonth = activeEqs * baseHorasMes;
      const dispoPct = baseTotalMonth > 0 ? Math.min(100, Math.round((horasMonth / baseTotalMonth) * 1000) / 10) : 0;

      return {
        mes: name.substring(0, 3),
        mesCompleto: name,
        horas: Math.round(horasMonth * 10) / 10,
        combustible: Math.round(combMonth),
        disponibilidad: dispoPct,
        equiposActivos: activeEqs
      };
    });
  }, [records, dispoYear, baseHorasMes, selectedEquiposDispo]);

  // PDF Export Report Generator
  const handleExportPDF = () => {
    if (monthlyStatsPerMachine.length === 0) {
      alert('No hay datos de disponibilidad para generar el informe PDF.');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 297, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORME DE DISPONIBILIDAD Y HORAS MÁQUINA DE FLOTA', 14, 11);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    const periodoLabel = dispoMonth === 'todos' ? 'Año Acumulado' : monthNames[parseInt(dispoMonth, 10) - 1];
    doc.text(`Año: ${dispoYear} | Periodo: ${periodoLabel} | Base Horas Mes: ${baseHorasMes} hrs`, 14, 18);

    doc.text(`Emisión: ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`, 220, 18);

    // KPI Summary Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 28, 269, 22, 2, 2, 'FD');

    // Stats Headers
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('DISPONIBILIDAD FLOTA', 25, 34);
    doc.text('TOTAL HORAS MÁQUINA', 95, 34);
    doc.text('COMBUSTIBLE CONSUMIDO', 165, 34);
    doc.text('EQUIPOS EVALUADOS', 230, 34);

    // Stats Values
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${globalFleetStats.dispoGlobalPct.toFixed(1)}%`, 25, 43);
    doc.text(`${globalFleetStats.totalHorasFlota.toLocaleString()} hrs`, 95, 43);
    doc.text(`${globalFleetStats.totalCombustibleFlota.toLocaleString()} L`, 165, 43);
    doc.text(`${globalFleetStats.totalEquipos} máquinas`, 230, 43);

    // Subtitle note
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(71, 85, 105);
    doc.text(`* Filtro de Flota Activo: ${selectedEquiposDispo.length} de ${uniqueEquipos.length} vehículos evaluados. Fórmula: (Horas Uso / ${baseHorasMes}h base) × 100`, 14, 55);

    // Table Data
    const tableData = monthlyStatsPerMachine.map(r => [
      r.equipo,
      `${r.mesNombre} ${dispoYear}`,
      `${r.diasTrabajados} días`,
      `${r.horasUso.toLocaleString(undefined, { minimumFractionDigits: 1 })} h`,
      `${r.combustibleL.toLocaleString()} L`,
      `${r.baseHoras} h`,
      `${r.disponibilidadPct.toFixed(1)}%`,
      r.vueltas.toLocaleString()
    ]);

    autoTable(doc, {
      startY: 58,
      head: [['Equipo / Máquina', 'Mes / Periodo', 'Días Operados', 'Horas Máquina Uso', 'Combustible (L)', 'Horas Base Mes', 'Disponibilidad (%)', 'Vueltas Totales']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'left' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'right', fontStyle: 'bold' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'center', fontStyle: 'bold' },
        7: { halign: 'center' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 6) {
          const valStr = data.cell.raw as string;
          const val = parseFloat(valStr.replace('%', ''));
          if (val >= 80) {
            data.cell.styles.textColor = [16, 185, 129];
          } else if (val >= 50) {
            data.cell.styles.textColor = [217, 119, 6];
          } else {
            data.cell.styles.textColor = [225, 29, 72];
          }
        }
      }
    });

    doc.save(`Informe_Disponibilidad_Horas_Maquina_${dispoYear}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportMonthlyReportExcel = () => {
    const dataToExport = monthlyStatsPerMachine.map(r => ({
      'Equipo / Máquina': r.equipo,
      'Mes': r.mesNombre,
      'Horas Máquina (Uso)': r.horasUso,
      'Combustible (L)': r.combustibleL,
      'Horas Base Mes': r.baseHoras,
      'Disponibilidad (%)': `${r.disponibilidadPct}%`,
      'Vueltas / Pases': r.vueltas,
      'Días Operados': r.diasTrabajados
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Disponibilidad_Mensual");
    XLSX.writeFile(wb, `Reporte_Disponibilidad_Maquinas_${dispoYear}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-bold text-xs uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            Producción & Control Operacional de Flota
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Reporte Operacional de Horas Máquina y Disponibilidad
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleQuickFilterJulio}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 font-bold border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100"
          >
            <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Ver Mes de Julio
          </Button>

          <label className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Procesando Excel...' : 'Importar Excel'}
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>

          <Button
            onClick={activeTab === 'disponibilidad' ? handleExportDisponibilidadExcel : handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            title="Exportar la información filtrada del sistema a un archivo Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar a Excel ({activeTab === 'disponibilidad' ? monthlyStatsPerMachine.length : filteredRecords.length})
          </Button>

          <Button
            onClick={() => {
              setForm({
                fecha: new Date().toISOString().split('T')[0],
                turno: 'b',
                equipo: uniqueEquipos[0] || '',
                horometroInicial: '',
                horometroFinal: '',
                horas: '',
                operador: '',
                vueltas: '',
                observacion: 'Disponible',
                checklist: 'OK',
                combustibleL: ''
              });
              setIsNewModalOpen(true);
            }}
            variant="default"
            size="sm"
            className="flex items-center gap-1.5 font-bold bg-slate-900 hover:bg-slate-800 text-white"
          >
            <Plus className="w-4 h-4" />
            Nuevo Registro
          </Button>
        </div>
      </div>

      {/* Notice Banner */}
      {importNotice && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 p-4 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-sm font-semibold">{importNotice}</span>
          </div>
          <button 
            onClick={() => setImportNotice(null)}
            className="text-xs font-bold hover:underline ml-4"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Top Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('registro')}
          className={`py-3 px-5 font-extrabold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'registro'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Registro Operacional
        </button>

        <button
          onClick={() => setActiveTab('disponibilidad')}
          className={`py-3 px-5 font-extrabold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'disponibilidad'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Cálculos Mensuales y Disponibilidad por Máquina (%)
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REGISTRO OPERACIONAL DE HORAS MAQUINA */}
      {/* ========================================================================= */}
      {activeTab === 'registro' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Total Máquinas</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {totalMaquinasFiltradas}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-xl">
                  <Truck className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs font-medium text-slate-500 mt-2">
                Registros filtrados: <span className="font-extrabold text-slate-800 dark:text-slate-200">{filteredRecords.length.toLocaleString()}</span>
              </p>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Horas Máquina Totales</p>
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                    {totalHorasOperativas.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} hrs
                  </p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Suma de (FINAL - INICIA)
              </p>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Horas Totales Día</p>
                  <p className="text-2xl font-black text-amber-500 dark:text-amber-300 mt-1">
                    {totalHorasDia.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} hrs
                  </p>
                </div>
                <div className="p-3 bg-amber-100/70 dark:bg-amber-950/70 text-amber-600 rounded-xl">
                  <Sun className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Turno Día (b)
              </p>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Horas Totales Noche</p>
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    {totalHorasNoche.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} hrs
                  </p>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
                  <Moon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Turno Noche (a)
              </p>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Total Vueltas / Pases</p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {totalVueltas.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
                  <Truck className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Reportadas en extracción
              </p>
            </Card>
          </div>

          {/* Filters Bar */}
          <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              <Filter className="w-4 h-4 text-amber-500" />
              Filtros Avanzados de Búsqueda y Fechas
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              {/* Filter Date Type */}
              <div>
                <label className="block text-slate-500 font-bold mb-1">Filtrar por Fecha</label>
                <select
                  value={dateFilterType}
                  onChange={(e) => {
                    setDateFilterType(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="todos">Todos los Datos</option>
                  <option value="dia">Por Día Específico</option>
                  <option value="semana">Por Semana del Año</option>
                  <option value="mes">Por Mes y Año</option>
                  <option value="rango">Rango de Fechas</option>
                </select>
              </div>

              {/* Conditional Date Control */}
              {dateFilterType === 'dia' && (
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Seleccionar Día</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>
              )}

              {dateFilterType === 'semana' && (
                <>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Año</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value={2026}>2026</option>
                      <option value={2025}>2025</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Semana N°</label>
                    <input
                      type="number"
                      min={1}
                      max={53}
                      value={selectedWeek}
                      onChange={(e) => {
                        setSelectedWeek(parseInt(e.target.value) || 1);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </>
              )}

              {dateFilterType === 'mes' && (
                <>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Año</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value={2026}>2026</option>
                      <option value={2025}>2025</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Mes</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(parseInt(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-slate-200"
                    >
                      {monthNames.map((name, idx) => (
                        <option key={idx + 1} value={idx + 1}>{name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {dateFilterType === 'rango' && (
                <>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Desde</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Hasta</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </>
              )}

              {/* Equipo Filter */}
              <div>
                <label className="block text-slate-500 font-bold mb-1">Equipo / Máquina</label>
                <select
                  value={selectedEquipo}
                  onChange={(e) => {
                    setSelectedEquipo(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="todos">Todos los Equipos</option>
                  {uniqueEquipos.map(eq => (
                    <option key={eq} value={eq}>{eq}</option>
                  ))}
                </select>
              </div>

              {/* Turno Filter */}
              <div>
                <label className="block text-slate-500 font-bold mb-1">Turno</label>
                <select
                  value={selectedTurno}
                  onChange={(e) => {
                    setSelectedTurno(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="todos">Todos los Turnos</option>
                  <option value="b">Día (Turno b)</option>
                  <option value="a">Noche (Turno a)</option>
                </select>
              </div>

              {/* Search input */}
              <div className="sm:col-span-2 md:col-span-2">
                <label className="block text-slate-500 font-bold mb-1">Buscar Texto (Operador, Obs, Equipo)</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar operador, observación..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-8 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-medium text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Table Container */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-500" />
                <p className="font-bold">Cargando base de datos de horas máquina...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-amber-500/80" />
                <p className="font-bold text-base text-slate-800 dark:text-slate-200">No se encontraron registros</p>
                <p className="text-xs mt-1">Pruebe ajustando los filtros o importe un nuevo archivo Excel.</p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Registros Filtrados en el Sistema ({filteredRecords.length.toLocaleString()})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Exporta únicamente los datos resultantes del filtro activo de fecha, equipo o turno.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedRecordIds.length > 0 && (
                      <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg px-3 py-1.5 text-xs">
                        <span className="font-bold text-amber-800 dark:text-amber-200">
                          {selectedRecordIds.length} seleccionados
                        </span>
                        <Button
                          onClick={handleDeleteSelectedRecords}
                          variant="destructive"
                          size="xs"
                          className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold h-7 px-2.5"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Eliminar Seleccionados
                        </Button>
                        <button
                          onClick={() => setSelectedRecordIds([])}
                          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold text-[11px] ml-1"
                        >
                          Deseleccionar
                        </button>
                      </div>
                    )}

                    <Button
                      onClick={toggleSelectAllRegistro}
                      variant="outline"
                      size="sm"
                      className="border-slate-300 dark:border-slate-700 font-bold text-xs"
                    >
                      <CheckSquare className="w-4 h-4 text-slate-500 mr-1.5" />
                      {filteredRecords.length > 0 && filteredRecords.every(r => selectedRecordIds.includes(r.id)) ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                    </Button>

                    <Button
                      onClick={handleExportExcel}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm"
                      title="Descargar tabla filtrada en formato Excel (.xlsx)"
                    >
                      <Download className="w-4 h-4" />
                      Descargar Excel Filtrado ({filteredRecords.length.toLocaleString()})
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300 border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-extrabold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-3 text-center w-10">Sel.</th>
                        <th className="py-3 px-3">Fecha</th>
                        <th className="py-3 px-2 text-center">Turno</th>
                        <th className="py-3 px-3">Equipo</th>
                        <th className="py-3 px-3 text-right">INICIA</th>
                        <th className="py-3 px-3 text-right">FINAL</th>
                        <th className="py-3 px-3">Operador</th>
                        <th className="py-3 px-3 text-center">#Vueltas/Pases</th>
                        <th className="py-3 px-3">Observación F/S o Disponible</th>
                        <th className="py-3 px-3">Checklist</th>
                        <th className="py-3 px-3 text-right bg-amber-100/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">Horas</th>
                        <th className="py-3 px-3 text-right">Redondear</th>
                        <th className="py-3 px-3 text-right">Combustible (L)</th>
                        <th className="py-3 px-2 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {paginatedRecords.map((rec) => {
                        const isFS = rec.observacion?.toLowerCase().includes('f/s') || rec.observacion?.toLowerCase().includes('falla');
                        return (
                          <tr 
                            key={rec.id} 
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                              isFS ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedRecordIds.includes(rec.id)}
                                onChange={() => {
                                  setSelectedRecordIds(prev =>
                                    prev.includes(rec.id) ? prev.filter(id => id !== rec.id) : [...prev, rec.id]
                                  );
                                }}
                                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-semibold whitespace-nowrap">
                              {rec.fecha}
                            </td>
                            <td className="py-2.5 px-2 text-center font-black">
                              <span className={`px-2 py-0.5 rounded text-[11px] ${
                                isTurnoNoche(rec.turno)
                                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' 
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}>
                                {isTurnoNoche(rec.turno) ? 'a (Noche)' : 'b (Día)'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              {rec.equipo}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                              {rec.horometroInicial ? rec.horometroInicial.toLocaleString(undefined, { minimumFractionDigits: 1 }) : '0.0'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                              {rec.horometroFinal ? rec.horometroFinal.toLocaleString(undefined, { minimumFractionDigits: 1 }) : '0.0'}
                            </td>
                            <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                              {rec.operador}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">
                              {rec.vueltas || 0}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded ${
                                isFS 
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200' 
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                              }`}>
                                {rec.observacion || 'Disponible'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-medium">
                              {rec.checklist || 'OK'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
                              {rec.horasOperativas ? rec.horasOperativas.toFixed(1) : '0.0'} hrs
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                              {rec.horasRedondeadas || Math.round(rec.horasOperativas || 0)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {rec.combustibleL ? `${rec.combustibleL.toLocaleString()} L` : '-'}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  onClick={() => handleEditClick(rec)}
                                  className="p-1 text-slate-400 hover:text-amber-600 transition-colors"
                                  title="Editar registro"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteClick(rec.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                  title="Eliminar registro"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-900/60">
                  <div className="flex items-center gap-3">
                    <span>
                      Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, filteredRecords.length)} de {filteredRecords.length.toLocaleString()} registros
                    </span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(parseInt(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs"
                    >
                      <option value={25}>25 por pág.</option>
                      <option value={50}>50 por pág.</option>
                      <option value={100}>100 por pág.</option>
                      <option value={250}>250 por pág.</option>
                      <option value={500}>500 por pág.</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </Button>
                    <span>
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5"
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CALCULOS MENSUALES Y DISPONIBILIDAD */}
      {/* ========================================================================= */}
      {activeTab === 'disponibilidad' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Año de Análisis</label>
                  <select
                    value={dispoYear}
                    onChange={(e) => setDispoYear(parseInt(e.target.value))}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Periodo / Mes</label>
                  <select
                    value={dispoMonth}
                    onChange={(e) => setDispoMonth(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="todos">Todos los Meses (Acumulado)</option>
                    {monthNames.map((mName, i) => (
                      <option key={i + 1} value={(i + 1).toString()}>{mName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Base Horas Mes (Stand. 720h)</label>
                  <input
                    type="number"
                    value={baseHorasMes}
                    onChange={(e) => setBaseHorasMes(parseFloat(e.target.value) || 720)}
                    className="w-28 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Multi-select Vehicle Filter */}
                <div className="relative">
                  <label className="block text-slate-500 font-bold mb-1">Equipos en KPI ({selectedEquiposDispo.length}/{uniqueEquipos.length})</label>
                  <button
                    type="button"
                    onClick={() => setIsVehicleFilterOpen(!isVehicleFilterOpen)}
                    className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 rounded-lg p-2 font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-2 hover:bg-amber-100/80 dark:hover:bg-amber-900/50 transition-colors shadow-xs"
                  >
                    <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="truncate max-w-[180px]">
                      {selectedEquiposDispo.length === uniqueEquipos.length 
                        ? `Todos (${uniqueEquipos.length} vehíc.)` 
                        : `${selectedEquiposDispo.length} Seleccionados`}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 ml-1 text-amber-600 dark:text-amber-400 shrink-0" />
                  </button>

                  {/* Multi-select Popover Dropdown */}
                  {isVehicleFilterOpen && (
                    <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                          Filtrar Vehículos en KPI
                        </span>
                        <button
                          onClick={() => setIsVehicleFilterOpen(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Search box inside popover */}
                      <div className="relative mb-2">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          placeholder="Buscar vehículo..."
                          value={vehicleSearchTerm}
                          onChange={(e) => setVehicleSearchTerm(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-8 pr-2 py-1 text-xs font-medium"
                        />
                      </div>

                      {/* Quick Select All / Deselect All */}
                      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold">
                        <button
                          onClick={selectAllEquiposDispo}
                          className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <CheckSquare className="w-3 h-3" /> Seleccionar Todos
                        </button>
                        <button
                          onClick={deselectAllEquiposDispo}
                          className="text-slate-500 dark:text-slate-400 hover:underline flex items-center gap-1"
                        >
                          <Square className="w-3 h-3" /> Deseleccionar Todos
                        </button>
                      </div>

                      {/* Equipment List Checkboxes */}
                      <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                        {uniqueEquipos
                          .filter(eq => eq.toLowerCase().includes(vehicleSearchTerm.toLowerCase()))
                          .map(eq => {
                            const isChecked = selectedEquiposDispo.includes(eq);
                            return (
                              <label
                                key={eq}
                                className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleEquipoDispo(eq)}
                                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                                />
                                <span className="truncate">{eq}</span>
                              </label>
                            );
                          })}
                        {uniqueEquipos.filter(eq => eq.toLowerCase().includes(vehicleSearchTerm.toLowerCase())).length === 0 && (
                          <div className="text-center py-4 text-xs text-slate-400 italic">
                            No se encontraron vehículos
                          </div>
                        )}
                      </div>

                      {/* Footer Info */}
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-500">
                        <span>{selectedEquiposDispo.length} seleccionados</span>
                        <Button
                          size="xs"
                          onClick={() => setIsVehicleFilterOpen(false)}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[11px]"
                        >
                          Listo
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleExportPDF}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm px-3.5 py-2 rounded-lg"
                  title="Generar informe profesional en formato PDF"
                >
                  <FileText className="w-4 h-4" />
                  Informe PDF
                </Button>

                <Button
                  onClick={exportMonthlyReportExcel}
                  variant="outline"
                  size="sm"
                  className="font-bold flex items-center gap-1.5 border-slate-300 dark:border-slate-700"
                  title="Exportar reporte de disponibilidad a Excel (.xlsx)"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  Exportar Excel
                </Button>
              </div>
            </div>
          </Card>

          {/* Global Fleet Availability Banner */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md border border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
                Disponibilidad Promedio Flota (%)
              </p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-black tracking-tight text-white">
                  {globalFleetStats.dispoGlobalPct.toFixed(1)}%
                </span>
                <span className="text-xs text-amber-300 font-semibold">
                  (Horas Op / (Equipos × {baseHorasMes}h) × 100)
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    globalFleetStats.dispoGlobalPct >= 80 ? 'bg-emerald-500' :
                    globalFleetStats.dispoGlobalPct >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, globalFleetStats.dispoGlobalPct)}%` }}
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                Total Horas Máquina Flota
              </p>
              <p className="text-3xl font-black mt-2 text-white">
                {globalFleetStats.totalHorasFlota.toLocaleString()} <span className="text-base font-semibold text-slate-400">hrs</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Operación reportada en {globalFleetStats.totalEquipos} equipos
              </p>
            </div>

            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                Equipos Evaluados
              </p>
              <p className="text-3xl font-black mt-2 text-amber-400">
                {globalFleetStats.totalEquipos} <span className="text-base font-semibold text-slate-400">máquinas</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                En periodo seleccionado ({dispoYear})
              </p>
            </div>
          </div>

          {/* Visual Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Horas Máquina y Disponibilidad por Equipo */}
            <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                Horas Máquina y Disponibilidad (%) por Equipo
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={aggregatedByMachineTotal}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="equipo" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
                    <YAxis yAxisId="left" label={{ value: 'Horas', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} label={{ value: '% Dispo', angle: 90, position: 'insideRight', style: { fontSize: 10 } }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="horasUso" name="Horas Máquina" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="disponibilidadPct" name="Disponibilidad %" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Chart 2: Tendencia Mensual de Disponibilidad Flota */}
            <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Evolución Mensual Disponibilidad Flota ({dispoYear})
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyFleetTrend}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} label={{ value: 'Disponibilidad %', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="disponibilidad" name="Disponibilidad Flota %" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Detailed Monthly Availability Table per Machine */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Detalle Mensual de Uso y Disponibilidad por Máquina
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fórmula de Disponibilidad = (Horas Operativas Reportadas / {baseHorasMes} hrs base mes) × 100
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selectedDispoKeys.length > 0 && (
                  <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg px-3 py-1.5 text-xs">
                    <span className="font-bold text-amber-800 dark:text-amber-200">
                      {selectedDispoKeys.length} seleccionados
                    </span>
                    <Button
                      onClick={handleDeleteSelectedDispoRecords}
                      variant="destructive"
                      size="xs"
                      className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold h-7 px-2.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Eliminar Registros Subyacentes
                    </Button>
                    <button
                      onClick={() => setSelectedDispoKeys([])}
                      className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold text-[11px] ml-1"
                    >
                      Deseleccionar
                    </button>
                  </div>
                )}

                <Button
                  onClick={toggleSelectAllDispo}
                  variant="outline"
                  size="sm"
                  className="border-slate-300 dark:border-slate-700 font-bold text-xs"
                >
                  <CheckSquare className="w-4 h-4 text-slate-500 mr-1.5" />
                  {monthlyStatsPerMachine.length > 0 && monthlyStatsPerMachine.every(r => selectedDispoKeys.includes(`${r.equipo}|${r.mesNum}`)) ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                </Button>

                <Button
                  onClick={handleExportDisponibilidadExcel}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm"
                  title="Exportar resumen de disponibilidad a Excel (.xlsx)"
                >
                  <Download className="w-4 h-4" />
                  Descargar Reporte Disponibilidad (.xlsx)
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300 border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-black uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">Sel.</th>
                    <th className="py-3 px-4">Equipo / Máquina</th>
                    <th className="py-3 px-3">Mes / Periodo</th>
                    <th className="py-3 px-3 text-center">Días Operados</th>
                    <th className="py-3 px-3 text-right bg-amber-100/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">Horas Máquina (Uso)</th>
                    <th className="py-3 px-3 text-right">Combustible (L)</th>
                    <th className="py-3 px-3 text-right">Base Horas Mes</th>
                    <th className="py-3 px-4 text-center bg-slate-200/60 dark:bg-slate-700/60">Disponibilidad Mensual (%)</th>
                    <th className="py-3 px-3 text-center">Vueltas Totales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {monthlyStatsPerMachine.map((row, idx) => {
                    const dispo = row.disponibilidadPct;
                    const dispoKey = `${row.equipo}|${row.mesNum}`;
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedDispoKeys.includes(dispoKey)}
                            onChange={() => toggleSelectDispoRow(row.equipo, row.mesNum)}
                            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                          {row.equipo}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {row.mesNombre} {dispoYear}
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          {row.diasTrabajados} días
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
                          {row.horasUso.toLocaleString(undefined, { minimumFractionDigits: 1 })} hrs
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {row.combustibleL.toLocaleString()} L
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {row.baseHoras} hrs
                        </td>
                        <td className="py-3 px-4 text-center bg-slate-50/80 dark:bg-slate-900/40">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-2.5 py-1 rounded-full font-black text-xs ${
                              dispo >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              dispo >= 50 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                              'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {dispo.toFixed(1)}%
                            </span>
                            <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full ${
                                  dispo >= 80 ? 'bg-emerald-500' : dispo >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, dispo)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          {row.vueltas.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NUEVO REGISTRO / EDITAR REGISTRO */}
      {/* ========================================================================= */}
      {(isNewModalOpen || isEditModalOpen) && (
        <Modal
          isOpen={isNewModalOpen || isEditModalOpen}
          onClose={() => {
            setIsNewModalOpen(false);
            setIsEditModalOpen(false);
          }}
          title={isEditModalOpen ? "Editar Registro de Hora Máquina" : "Nuevo Registro de Hora Máquina"}
        >
          <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha</label>
                <input
                  type="date"
                  required
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Turno (CMC)</label>
                <select
                  value={form.turno}
                  onChange={(e) => setForm({ ...form, turno: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold"
                >
                  <option value="b">b = Día</option>
                  <option value="a">a = Noche</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Equipo / Máquina</label>
              <input
                type="text"
                required
                placeholder="Ej. EXC-001, CAEX-05, Camión 02"
                value={form.equipo}
                onChange={(e) => setForm({ ...form, equipo: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Horómetro Inicial (INICIA)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={form.horometroInicial}
                  onChange={(e) => {
                    const val = e.target.value;
                    const inic = parseFloat(val) || 0;
                    const fin = parseFloat(form.horometroFinal) || 0;
                    let newHoras = form.horas;
                    if (fin > inic && inic > 0) {
                      newHoras = (Math.round((fin - inic) * 10) / 10).toString();
                    }
                    setForm({ ...form, horometroInicial: val, horas: newHoras });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Horómetro Final (FINAL)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={form.horometroFinal}
                  onChange={(e) => {
                    const val = e.target.value;
                    const fin = parseFloat(val) || 0;
                    const inic = parseFloat(form.horometroInicial) || 0;
                    let newHoras = form.horas;
                    if (fin > inic && inic > 0) {
                      newHoras = (Math.round((fin - inic) * 10) / 10).toString();
                    }
                    setForm({ ...form, horometroFinal: val, horas: newHoras });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-amber-700 dark:text-amber-400 mb-1">Horas Máquina (Decimal)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0 (ej. 10.5)"
                  value={form.horas}
                  onChange={(e) => {
                    const val = e.target.value;
                    const hrs = parseFloat(val) || 0;
                    const inic = parseFloat(form.horometroInicial) || 0;
                    let newFin = form.horometroFinal;
                    if (inic > 0 && hrs > 0) {
                      newFin = (Math.round((inic + hrs) * 10) / 10).toString();
                    }
                    setForm({ ...form, horas: val, horometroFinal: newFin });
                  }}
                  className="w-full bg-amber-50/60 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-lg p-2 font-black text-amber-900 dark:text-amber-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Operador</label>
                <input
                  type="text"
                  placeholder="Nombre del operador"
                  value={form.operador}
                  onChange={(e) => setForm({ ...form, operador: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">N° Vueltas / Pases</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.vueltas}
                  onChange={(e) => setForm({ ...form, vueltas: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Observación / Estado</label>
                <select
                  value={form.observacion}
                  onChange={(e) => setForm({ ...form, observacion: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="F/S Mantenimiento">F/S Mantenimiento</option>
                  <option value="F/S Falla Mecánica">F/S Falla Mecánica</option>
                  <option value="F/S Falla Eléctrica">F/S Falla Eléctrica</option>
                  <option value="Sin Operador">Sin Operador</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Combustible (L)</label>
                <input
                  type="number"
                  placeholder="Litros consumidos"
                  value={form.combustibleL}
                  onChange={(e) => setForm({ ...form, combustibleL: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsNewModalOpen(false);
                  setIsEditModalOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="default"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                Guardar Registro
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
