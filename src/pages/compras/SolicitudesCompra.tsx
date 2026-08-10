import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Search, Filter, CheckCircle, XCircle, Clock, FileText, ShoppingCart, Eye, Trash2, AlertTriangle, RotateCcw } from 'lucide-react';
import Swal from 'sweetalert2';
import SolicitudCompraDetalle from './SolicitudCompraDetalle';

export default function SolicitudesCompra() {
  const { currentCompany } = useCompany();
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedSolicitud, setSelectedSolicitud] = useState<any>(null);

  const [solicitudes, setSolicitudes] = useState<any[]>([]);

  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    fechaInicio: '',
    fechaFin: '',
    solicitante: '',
    motivo: '',
    estado: '',
    id: '',
    prioridad: '',
    departamento: ''
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleLimpiarFiltros = () => {
    setFilters({
      fechaInicio: '',
      fechaFin: '',
      solicitante: '',
      motivo: '',
      estado: '',
      id: '',
      prioridad: '',
      departamento: ''
    });
    setSearchTerm('');
  };

  const activeFiltersCount = Object.values(filters).filter(value => value !== '').length;

  // Fetch from Supabase on mount/company change
  const fetchSolicitudes = async () => {
    if (!currentCompany) return;
    try {
      const { data, error } = await supabase
        .from('compras_solicitudes')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase compras_solicitudes notice:', error.message);
        return;
      }

      if (data) {
        const dbMapped = data.map((item: any) => ({
          id: item.id || item.codigo_solicitud,
          solicitante: item.solicitante,
          departamento: item.departamento,
          fecha: item.fecha,
          prioridad: item.prioridad,
          motivo: item.motivo,
          estado: item.estado,
          items: item.items || [],
          ...(item.detalles || {})
        }));

        setSolicitudes(dbMapped);
      }
    } catch (e) {
      console.warn('Error conectando a Supabase compras_solicitudes:', e);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, [currentCompany]);

  // Generate next correlative ID (e.g. SC-000001)
  const getNextId = () => {
    if (solicitudes.length === 0) return 'SC-000001';
    const nums = solicitudes.map(s => {
      const match = s.id && s.id.match(/SC-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNum = Math.max(0, ...nums);
    return `SC-${String(maxNum + 1).padStart(6, '0')}`;
  };

  const handleSaveSolicitud = async (solicitudData: any) => {
    if (!currentCompany) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Empresa',
        text: 'No se ha seleccionado una empresa activa.',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    // Mostrar loader bloqueante
    Swal.fire({
      title: 'Guardando en la Base de Datos...',
      text: 'Por favor espere mientras se registra la solicitud.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Guardar de forma estrictamente sincrónica/bloqueante en Supabase
      const { error } = await supabase.from('compras_solicitudes').upsert({
        id: solicitudData.id,
        empresa_id: currentCompany.id,
        codigo_solicitud: solicitudData.id,
        solicitante: solicitudData.solicitante,
        departamento: solicitudData.departamento,
        fecha: solicitudData.fecha,
        prioridad: solicitudData.prioridad,
        motivo: solicitudData.motivo,
        estado: solicitudData.estado,
        items: solicitudData.items || [],
        detalles: solicitudData
      });

      if (error) {
        console.error('Error al guardar en Supabase compras_solicitudes:', error);
        // Si falla, mostramos el error de base de datos y mantenemos el formulario abierto
        Swal.fire({
          icon: 'error',
          title: 'No se pudo guardar la solicitud',
          text: 'La base de datos rechazó el registro de la solicitud. Motivo: ' + (error.message || 'Error desconocido'),
          confirmButtonColor: '#ef4444'
        });
        return; // Retorno preventivo, no cerramos la vista ni actualizamos el listado local
      }

      // Si fue exitoso, actualizamos el estado local en memoria
      setSolicitudes(prev => {
        const index = prev.findIndex(s => s.id === solicitudData.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = solicitudData;
          return updated;
        } else {
          return [solicitudData, ...prev];
        }
      });

      Swal.fire({
        icon: 'success',
        title: '¡Guardado Exitoso!',
        text: 'La solicitud se ha registrado correctamente en la base de datos.',
        timer: 1500,
        showConfirmButton: false
      });

      setView('list');
    } catch (e: any) {
      console.error('Error al guardar en Supabase compras_solicitudes:', e);
      Swal.fire({
        icon: 'error',
        title: 'Error de Red / Conexión',
        text: 'No se pudo conectar con el servidor para guardar la solicitud: ' + (e.message || e),
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const handleBorrarSolicitud = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    Swal.fire({
      title: '¿Eliminar solicitud?',
      text: `Se eliminará la solicitud ${id} permanentemente de la base de datos.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        if (currentCompany) {
          Swal.fire({
            title: 'Eliminando...',
            text: 'Por favor espere mientras se elimina de la base de datos.',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          try {
            const { error } = await supabase.from('compras_solicitudes').delete().eq('id', id);
            if (error) {
              console.error('Error eliminando de Supabase:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error al eliminar',
                text: 'No se pudo eliminar de la base de datos: ' + error.message,
                confirmButtonColor: '#ef4444'
              });
              return;
            }
          } catch (e: any) {
            console.warn('Error eliminando de Supabase:', e);
            Swal.fire({
              icon: 'error',
              title: 'Error de Conexión',
              text: 'Ocurrió un error al intentar eliminar la solicitud del servidor.',
              confirmButtonColor: '#ef4444'
            });
            return;
          }
        }
        
        // Si se eliminó correctamente de Supabase, actualizamos el estado local
        setSolicitudes(prev => prev.filter(s => s.id !== id));
        Swal.fire('Eliminada', 'La solicitud ha sido eliminada de la base de datos.', 'success');
      }
    });
  };

  const filtered = solicitudes.filter(s => {
    // 1. Search term (matches across multiple fields)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchSearch = 
        (s.id || '').toLowerCase().includes(term) ||
        (s.solicitante || '').toLowerCase().includes(term) ||
        (s.motivo || '').toLowerCase().includes(term) ||
        (s.departamento || '').toLowerCase().includes(term);
      if (!matchSearch) return false;
    }

    // 2. Filter by ID / Código
    if (filters.id) {
      if (!(s.id || '').toLowerCase().includes(filters.id.toLowerCase())) {
        return false;
      }
    }

    // 3. Filter by Date range
    if (filters.fechaInicio) {
      if (s.fecha && s.fecha < filters.fechaInicio) {
        return false;
      }
    }
    if (filters.fechaFin) {
      if (s.fecha && s.fecha > filters.fechaFin) {
        return false;
      }
    }

    // 4. Filter by Solicitante
    if (filters.solicitante) {
      if (!(s.solicitante || '').toLowerCase().includes(filters.solicitante.toLowerCase())) {
        return false;
      }
    }

    // 5. Filter by Motivo
    if (filters.motivo) {
      if (!(s.motivo || '').toLowerCase().includes(filters.motivo.toLowerCase())) {
        return false;
      }
    }

    // 6. Filter by Estado
    if (filters.estado) {
      if (s.estado !== filters.estado) {
        return false;
      }
    }

    // 7. Filter by Prioridad
    if (filters.prioridad) {
      if (s.prioridad !== filters.prioridad) {
        return false;
      }
    }

    // 8. Filter by Departamento
    if (filters.departamento) {
      if (!(s.departamento || '').toLowerCase().includes(filters.departamento.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROBADA': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400';
      case 'APROBADA PARCIALMENTE': return 'text-teal-600 bg-teal-50 dark:bg-teal-500/10 dark:text-teal-400';
      case 'RECHAZADA': return 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400';
      case 'REQUIERE AJUSTE': return 'text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400';
      case 'CONVERTIDA EN OC': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400';
      case 'BORRADOR': return 'text-slate-600 bg-slate-50 dark:bg-slate-500/10 dark:text-slate-400';
      default: return 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400'; // Pendiente
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APROBADA': return <CheckCircle className="w-4 h-4 mr-1" />;
      case 'APROBADA PARCIALMENTE': return <CheckCircle className="w-4 h-4 mr-1" />;
      case 'RECHAZADA': return <XCircle className="w-4 h-4 mr-1" />;
      case 'REQUIERE AJUSTE': return <AlertTriangle className="w-4 h-4 mr-1 text-amber-600" />;
      case 'CONVERTIDA EN OC': return <ShoppingCart className="w-4 h-4 mr-1" />;
      case 'BORRADOR': return <FileText className="w-4 h-4 mr-1" />;
      default: return <Clock className="w-4 h-4 mr-1" />;
    }
  };

  const handleNuevaSolicitud = () => {
    // We open the detail view in new mode
    setSelectedSolicitud(null);
    setView('detail');
  };

  const handleVerDetalle = (solicitud: any) => {
    setSelectedSolicitud(solicitud);
    setView('detail');
  };

  if (view === 'detail') {
    return (
      <SolicitudCompraDetalle 
        solicitud={selectedSolicitud} 
        isNew={!selectedSolicitud}
        nextId={getNextId()}
        onSave={handleSaveSolicitud}
        onBack={() => setView('list')} 
      />
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
      {/* Header Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h1 className="text-[28px] font-black text-slate-800 dark:text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" /> Panel de Solicitudes
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-wide mt-1 uppercase">
            Gestión de solicitudes de compra y requerimientos internos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleNuevaSolicitud}
            className="bg-[#1e293b] hover:bg-slate-800 text-white font-bold h-10 px-5 rounded-lg text-sm tracking-wide"
          >
            <Plus className="w-4 h-4 mr-2" /> NUEVA SOLICITUD
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Requerimientos</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{solicitudes.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pendientes</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{solicitudes.filter(s => s.estado === 'PENDIENTE').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Aprobadas</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{solicitudes.filter(s => s.estado === 'APROBADA').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Rechazadas</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{solicitudes.filter(s => s.estado === 'RECHAZADA').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-800">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar solicitud por ID, motivo o solicitante..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent outline-none focus:border-blue-500 dark:text-white"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className={`text-sm font-bold w-full sm:w-auto h-10 border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 ${showFilters ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' : ''}`}
          >
            <Filter className="w-4 h-4" /> 
            FILTROS
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs font-black bg-blue-500 text-white rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Collapsible Filters Panel */}
        {showFilters && (
          <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            {/* ID Filter */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">ID / Código</label>
              <input 
                type="text" 
                placeholder="Ej: SC-000001"
                value={filters.id}
                onChange={(e) => handleFilterChange('id', e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Fecha Desde Filter */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Fecha Desde</label>
              <input 
                type="date" 
                value={filters.fechaInicio}
                onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Fecha Hasta Filter */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Fecha Hasta</label>
              <input 
                type="date" 
                value={filters.fechaFin}
                onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Estado Filter */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Estado</label>
              <select 
                value={filters.estado}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 font-medium"
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="APROBADA">APROBADA</option>
                <option value="APROBADA PARCIALMENTE">APROBADA PARCIALMENTE</option>
                <option value="RECHAZADA">RECHAZADA</option>
                <option value="REQUIERE AJUSTE">REQUIERE AJUSTE</option>
                <option value="CONVERTIDA EN OC">CONVERTIDA EN OC</option>
                <option value="BORRADOR">BORRADOR</option>
              </select>
            </div>

            {/* Solicitante Filter */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Solicitante</label>
              <input 
                type="text" 
                placeholder="Nombre del solicitante..."
                value={filters.solicitante}
                onChange={(e) => handleFilterChange('solicitante', e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Motivo Filter */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Motivo / Requerimiento</label>
              <input 
                type="text" 
                placeholder="Palabra clave en motivo..."
                value={filters.motivo}
                onChange={(e) => handleFilterChange('motivo', e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Prioridad Filter */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Prioridad</label>
              <select 
                value={filters.prioridad}
                onChange={(e) => handleFilterChange('prioridad', e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 font-medium"
              >
                <option value="">Todas las prioridades</option>
                <option value="BAJA">BAJA</option>
                <option value="MEDIA">MEDIA</option>
                <option value="ALTA">ALTA</option>
                <option value="CRÍTICA">CRÍTICA</option>
              </select>
            </div>

            {/* Departamento Filter */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Departamento</label>
              <input 
                type="text" 
                placeholder="Ej: Operaciones"
                value={filters.departamento}
                onChange={(e) => handleFilterChange('departamento', e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Buttons for Clear Filters */}
            <div className="md:col-span-2 lg:col-span-4 flex justify-end gap-2 mt-2">
              <Button 
                variant="outline" 
                onClick={handleLimpiarFiltros}
                className="text-xs font-bold h-9 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> LIMPIAR FILTROS
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Solicitante</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Motivo / Requerimiento</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Estado</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map(s => (
                <tr key={s.id} onClick={() => handleVerDetalle(s)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 font-black text-slate-800 dark:text-white text-sm">{s.id}</td>
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 text-xs">{s.fecha}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {s.solicitante}
                    <span className="block text-[10px] text-slate-500 mt-0.5">{s.departamento}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 text-sm max-w-[300px] truncate">
                    {s.motivo || 'Sin especificación'}
                    {s.prioridad === 'ALTA' && <span className="ml-2 inline-block px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded-full uppercase">ALTA</span>}
                    {s.prioridad === 'CRÍTICA' && <span className="ml-2 inline-block px-2 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-black rounded-full uppercase">CRÍTICA</span>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-md text-[10px] font-black tracking-wider uppercase ${getStatusColor(s.estado)}`}>
                      {getStatusIcon(s.estado)} {s.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleVerDetalle(s)}
                        title="Ver / Editar"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 border-slate-200 dark:border-slate-700"
                        onClick={(e) => handleBorrarSolicitud(s.id, e)}
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-medium text-sm">
                    <div className="max-w-md mx-auto space-y-3">
                      <p className="text-slate-600 dark:text-slate-300 font-bold text-base">No hay solicitudes registradas</p>
                      <p className="text-xs text-slate-400">El panel está limpio de datos de prueba. Haz clic a continuación para ingresar la primera solicitud de compra.</p>
                      <div>
                        <Button 
                          onClick={handleNuevaSolicitud}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-4 rounded-lg text-xs"
                        >
                          <Plus className="w-4 h-4 mr-2" /> CREAR NUEVA SOLICITUD
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
