import React, { useState } from 'react';
import { 
  Users, 
  Briefcase,
  Search, 
  UserPlus, 
  Download,
  UserCheck,
  CreditCard,
  Star,
  Phone,
  Eye,
  Wrench,
  MoreVertical,
  Check,
  X,
  Plus,
  Mail,
  TrendingUp
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

interface Collaborator {
  id: number;
  initials: string;
  name: string;
  rut: string;
  role: string;
  roleBadgeText: string;
  phone: string;
  licencia?: string;
  especialidad?: string;
  calificacion?: number;
  status: 'ACTIVO' | 'LICENCIA' | 'VACACIONES';
  isConductor: boolean;
  isMecanico: boolean;
  isSupervisor: boolean;
  email?: string;
}

const MOCK_DATA: Collaborator[] = [
  {
    id: 1,
    initials: 'PS',
    name: 'Pedro Sanchez',
    rut: '12.345.678-9',
    role: 'Conductor',
    roleBadgeText: 'Conductor',
    phone: '+56 9 1234 5678',
    email: 'psanchez@empresa.cl',
    licencia: 'A5',
    calificacion: 4.8,
    status: 'ACTIVO',
    isConductor: true,
    isMecanico: false,
    isSupervisor: false,
  },
  {
    id: 2,
    initials: 'JP',
    name: 'Juan Perez',
    rut: '15.678.901-2',
    role: 'Conductor',
    roleBadgeText: 'Conductor',
    phone: '+56 9 8765 4321',
    email: 'jperez@empresa.cl',
    licencia: 'A4',
    calificacion: 4.5,
    status: 'ACTIVO',
    isConductor: true,
    isMecanico: false,
    isSupervisor: false,
  },
  {
    id: 3,
    initials: 'LG',
    name: 'Luis Gonzalez',
    rut: '18.901.234-5',
    role: 'Conductor',
    roleBadgeText: 'Conductor',
    phone: '+56 9 5555 6666',
    email: 'lgonzalez@empresa.cl',
    licencia: 'A4',
    calificacion: 4.2,
    status: 'LICENCIA',
    isConductor: true,
    isMecanico: false,
    isSupervisor: false,
  },
  {
    id: 4,
    initials: 'JD',
    name: 'Jorge Diaz',
    rut: '19.123.456-7',
    role: 'Conductor',
    roleBadgeText: 'Conductor',
    phone: '+56 9 4444 3333',
    email: 'jdiaz@empresa.cl',
    licencia: 'A5',
    calificacion: 3.9,
    status: 'ACTIVO',
    isConductor: true,
    isMecanico: false,
    isSupervisor: false,
  },
  {
    id: 5,
    initials: 'AM',
    name: 'Ana Martinez',
    rut: '20.345.678-K',
    role: 'Conductor',
    roleBadgeText: 'Conductor',
    phone: '+56 9 9999 8888',
    email: 'amartinez@empresa.cl',
    licencia: 'A2',
    calificacion: 4.9,
    status: 'ACTIVO',
    isConductor: true,
    isMecanico: false,
    isSupervisor: false,
  },
  {
    id: 6,
    initials: 'CR',
    name: 'Carlos Ruiz',
    rut: '10.111.222-3',
    role: 'Mecanico',
    roleBadgeText: 'Mecanico',
    phone: '+56 9 1111 2222',
    email: 'cruiz@empresa.cl',
    especialidad: 'Motores Diesel',
    status: 'ACTIVO',
    isConductor: false,
    isMecanico: true,
    isSupervisor: false,
  },
  {
    id: 7,
    initials: 'RG',
    name: 'Roberto Gomez',
    rut: '11.333.444-5',
    role: 'Mecanico',
    roleBadgeText: 'Mecanico',
    phone: '+56 9 3333 4444',
    email: 'rgomez@empresa.cl',
    especialidad: 'Sistemas Eléctricos',
    status: 'VACACIONES',
    isConductor: false,
    isMecanico: true,
    isSupervisor: false,
  },
  {
    id: 8,
    initials: 'MV',
    name: 'Maria Vega',
    rut: '9.876.543-2',
    role: 'Supervisor',
    roleBadgeText: 'Supervisor',
    phone: '+56 9 7777 9999',
    email: 'mvega@empresa.cl',
    status: 'ACTIVO',
    isConductor: false,
    isMecanico: false,
    isSupervisor: true,
  },
];

type TabType = 'Todos' | 'Conductores' | 'Mecanicos' | 'Administrativos';

export default function UsuariosCargos() {
  const [activeTab, setActiveTab] = useState<TabType>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalColaboradorOpen, setIsModalColaboradorOpen] = useState(false);
  const [isModalCargosOpen, setIsModalCargosOpen] = useState(false);

  // States for Modals
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState('Administrador');

  const filteredUsers = MOCK_DATA.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.rut.includes(searchTerm);
    
    const matchesTab = 
      activeTab === 'Todos' ? true :
      activeTab === 'Conductores' ? u.isConductor :
      activeTab === 'Mecanicos' ? u.isMecanico :
      activeTab === 'Administrativos' ? u.isSupervisor : false;

    return matchesSearch && matchesTab;
  });

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'ACTIVO': return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
      case 'LICENCIA': return 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30';
      case 'VACACIONES': return 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
       stars.push(
         <svg key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
         </svg>
       );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">
            Personal
          </h1>
          <p className="text-slate-500 font-medium mt-1">Gestión de conductores, técnicos y administrativos.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="flex items-center gap-2 font-bold px-6 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
            <Download className="w-4 h-4" /> Exportar
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 font-bold px-6 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
            onClick={() => setIsModalCargosOpen(true)}
          >
            <Briefcase className="w-4 h-4" /> Gestionar Cargos
          </Button>
          <Button 
            className="flex items-center gap-2 font-bold px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
            onClick={() => setIsModalColaboradorOpen(true)}
          >
            <UserPlus className="w-4 h-4" /> Nuevo Colaborador
          </Button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 px-6 py-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-[120px]">
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase">Total Colaboradores</span>
          <div className="flex justify-between items-end">
             <div className="text-4xl font-black text-slate-800 dark:text-slate-100">8</div>
             <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
             </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 px-6 py-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-[120px]">
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase">Personal Activo</span>
          <div className="flex justify-between items-end">
             <div className="text-4xl font-black text-slate-800 dark:text-slate-100">6</div>
             <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
             </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 px-6 py-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-[120px]">
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase">Licencias por Vencer</span>
          <div className="flex justify-between items-end mb-1">
             <div className="text-4xl font-black text-slate-800 dark:text-slate-100">0</div>
             <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
             </div>
          </div>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
             <TrendingUp className="w-3 h-3" /> Todo en orden <span className="text-slate-400 dark:text-slate-500 font-medium">vs mes anterior</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 px-6 py-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-[120px]">
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase">Calificación Conductores</span>
          <div className="flex justify-between items-end">
             <div className="text-4xl font-black text-slate-800 dark:text-slate-100">4.5</div>
             <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
             </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-wrap gap-1 w-full md:w-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
           {(['Todos', 'Conductores', 'Mecanicos', 'Administrativos'] as TabType[]).map((tab) => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                 activeTab === tab 
                   ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                   : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
               }`}
             >
               {tab}
             </button>
           ))}
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar nombre, RUT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Users Table List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <th className="p-4 pl-6">Colaborador</th>
                <th className="p-4">Cargo / Email</th>
                <th className="p-4">Contacto / Detalles</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Calificación</th>
                <th className="p-4 pr-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-black text-slate-500 dark:text-slate-400 shadow-inner border border-slate-200 dark:border-slate-700">
                        {u.initials}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">{u.name}</div>
                        <div className="text-xs font-bold tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">{u.rut}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col items-start gap-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold leading-none">
                        {u.isMecanico ? <Wrench className="w-3 h-3" /> : u.isSupervisor ? <UserCheck className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                        {u.roleBadgeText}
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                         <Mail className="w-3.5 h-3.5" />
                         {u.email || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs space-y-1.5">
                      <div className="flex gap-2 items-center">
                        <span className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider w-16">TEL:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{u.phone}</span>
                      </div>
                      {u.isConductor && (
                        <div className="flex gap-2 items-center">
                          <span className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider w-16">LIC:</span>
                          <span className="font-bold text-amber-600 dark:text-amber-500">{u.licencia}</span>
                        </div>
                      )}
                      {u.isMecanico && (
                        <div className="flex gap-2 items-center">
                          <span className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider w-16">ESP:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{u.especialidad}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border ${getStatusClasses(u.status)}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.isConductor ? (
                      <div className="flex items-center gap-2">
                         {renderStars(Math.floor(u.calificacion!))}
                         <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{u.calificacion}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600 text-xs font-medium">-</span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-900/40 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg transition-colors" title="Ver Perfil">
                         <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg transition-colors" title="Más opciones">
                         <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                   <td colSpan={6} className="p-8 text-center text-slate-500">
                      No se encontraron usuarios para los filtros seleccionados.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Nuevo Colaborador */}
      <Modal 
        isOpen={isModalColaboradorOpen} 
        onClose={() => setIsModalColaboradorOpen(false)}
        title="Crear Nuevo Colaborador"
        fullWidth
      >
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Nombres</label>
                 <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100" placeholder="Ej. Juan Andrés" />
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Apellidos</label>
                 <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100" placeholder="Ej. Pérez Silva" />
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">RUT</label>
                 <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100" placeholder="Ej. 12.345.678-9" />
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Teléfono</label>
                 <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100" placeholder="Ej. +56 9 1234 5678" />
              </div>
              <div className="md:col-span-2">
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Email Corporativo</label>
                 <input type="email" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100" placeholder="Ej. jperez@empresa.cl" />
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Cargo / Rol</label>
                 <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100">
                    <option>Conductor</option>
                    <option>Mecánico</option>
                    <option>Supervisor de Operaciones</option>
                    <option>Administrador</option>
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Estado Inicial</label>
                 <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100">
                    <option>Activo</option>
                    <option>Inactivo / En Inducción</option>
                 </select>
              </div>
           </div>

           {/* Divisor */}
           <div className="flex items-center gap-4 py-2">
             <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Información Específica</span>
             <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Tipo de Licencia</label>
                 <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100">
                    <option>No Aplica</option>
                    <option>A2</option>
                    <option>A3</option>
                    <option>A4</option>
                    <option>A5</option>
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Especialidad</label>
                 <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100" placeholder="Ej. Electricidad, Motores..." />
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
             <Button variant="outline" onClick={() => setIsModalColaboradorOpen(false)}>Cancelar</Button>
             <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8">
               Guardar Empleado
             </Button>
           </div>
        </div>
      </Modal>

      {/* MODAL: Gestionar Cargos y Permisos */}
      <Modal
        isOpen={isModalCargosOpen}
        onClose={() => setIsModalCargosOpen(false)}
        title="Gestión de Cargos y Permisos"
        fullWidth
      >
        <div className="flex flex-col md:flex-row gap-6 h-[70vh] max-h-[800px]">
          {/* Sidebar Cargos */}
          <div className="w-full md:w-[280px] flex flex-col gap-2 border-r border-slate-200 dark:border-slate-800 pr-0 md:pr-6 shrink-0">
             <div className="font-black text-slate-800 dark:text-slate-100 text-sm mb-3 flex justify-between items-center">
                <span className="uppercase tracking-widest text-[#10b981] text-[10px]">Roles Definidos</span>
                <button className="text-white bg-indigo-600 hover:bg-indigo-700 p-1.5 rounded-lg transition-colors shadow-sm shadow-indigo-600/20">
                   <Plus className="w-4 h-4" />
                </button>
             </div>
             
             <div className="space-y-1.5 overflow-y-auto pr-1">
               {['Administrador', 'Mecánico', 'Conductor', 'Supervisor Operaciones', 'Prevencionista', 'Despachador'].map(role => (
                  <button 
                    key={role}
                    onClick={() => setSelectedRoleForPerms(role)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold transition-all border ${
                      selectedRoleForPerms === role 
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                     {role}
                  </button>
               ))}
             </div>
          </div>

          {/* Permissions Matrix */}
          <div className="flex-1 flex flex-col min-w-0">
             <div className="mb-6 shrink-0">
                <div className="flex justify-between items-end mb-2">
                   <div>
                     <h3 className="font-black text-2xl text-slate-800 dark:text-slate-100 leading-none mb-2">{selectedRoleForPerms}</h3>
                     <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Configura los permisos de acceso y acciones para este rol.</p>
                   </div>
                   <button className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20">
                      Eliminar Rol
                   </button>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto space-y-6 pr-2 rounded-xl">
                {[
                  { section: 'Módulo de Flota', perms: ['Ver Vehículos', 'Crear/Editar Vehículos', 'Asignar Conductores', 'Archivar Vehículos'] },
                  { section: 'Módulo de Mantenimiento', perms: ['Ver Órdenes de Trabajo', 'Crear Órdenes', 'Aprobar Órdenes', 'Cerrar Órdenes'] },
                  { section: 'Módulo de Personal', perms: ['Ver Empleados', 'Crear/Editar Empleados', 'Gestionar Permisos', 'Evaluar Conductores'] },
                  { section: 'Reportes y Finanzas', perms: ['Ver Dashboards', 'Exportar Data', 'Ver Costos', 'Aprobar Presupuestos'] },
                  { section: 'Gestión de Bodega', perms: ['Ver Inventario', 'Ingresar Stock', 'Realizar Salida', 'Ajustes Manuales'] },
                ].map((group, idx) => (
                   <div key={idx} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-slate-50 dark:bg-slate-800/80 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                         <div className="w-1.5 h-4 rounded-full bg-cyan-500"></div>
                         <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">{group.section}</h4>
                      </div>
                      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 bg-white dark:bg-slate-900 border-t border-white dark:border-slate-900">
                         {group.perms.map((p, pidx) => (
                            <label key={pidx} className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800 p-2 -m-2 rounded-lg transition-colors">
                               <div className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition-colors shadow-sm ${selectedRoleForPerms === 'Administrador' || pidx % 2 === 0 ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 group-hover:border-indigo-400'}`}>
                                 {(selectedRoleForPerms === 'Administrador' || pidx % 2 === 0) && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                               </div>
                               <span className="text-sm font-bold text-slate-700 dark:text-slate-300 select-none group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">{p}</span>
                            </label>
                         ))}
                      </div>
                   </div>
                ))}
             </div>

             <div className="shrink-0 flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800 mt-6 pb-2">
               <Button variant="outline" onClick={() => setIsModalCargosOpen(false)} className="px-6 border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                 Cancelar Cambios
               </Button>
               <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-sm shadow-indigo-600/20">
                 Guardar Permisos
               </Button>
             </div>
          </div>
        </div>
      </Modal>

    </div>
  );
}
