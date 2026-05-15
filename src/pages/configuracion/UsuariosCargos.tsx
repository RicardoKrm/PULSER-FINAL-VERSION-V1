import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  Search, 
  Plus, 
  UserPlus, 
  ShieldCheck, 
  MoreVertical, 
  Mail, 
  UserCircle, 
  Building2,
  DollarSign,
  TrendingUp,
  UserCog,
  Trash2,
  Pencil
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import Swal from 'sweetalert2';

interface User {
  id: number;
  rut: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  sexo: string;
  empresa: string;
  cargo: string;
  rol: string;
  tipo: string;
  estado: string;
  sueldo: number;
  email: string;
}

interface Cargo {
  id: number;
  nombre: string;
  departamento: string;
  sueldoBase: number;
  usuarios: number;
}

export default function UsuariosCargos() {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'cargos'>('usuarios');
  const [users, setUsers] = useState<User[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'usuarios' ? '/api/configuracion/usuarios' : '/api/configuracion/cargos';
      const res = await fetch(endpoint);
      const data = await res.json();
      if (activeTab === 'usuarios') setUsers(data);
      else setCargos(data);
    } catch (e) {
      console.error("Error fetching data", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    `${u.nombre} ${u.apellidoPaterno}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.rut.includes(searchTerm) ||
    u.cargo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCargos = cargos.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.departamento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            Recursos <span className="text-cyan-600">Humanos</span>
          </h1>
          <p className="text-slate-500 font-medium italic">Gestión de personal, cargos y estructuras salariales.</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
          <button 
            onClick={() => { setActiveTab('usuarios'); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-[1.2rem] text-sm font-black transition-all ${activeTab === 'usuarios' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-md' : 'text-slate-400 hover:text-slate-500'}`}
          >
            <Users className="w-4 h-4" /> USUARIOS
          </button>
          <button 
            onClick={() => { setActiveTab('cargos'); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-[1.2rem] text-sm font-black transition-all ${activeTab === 'cargos' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-md' : 'text-slate-400 hover:text-slate-500'}`}
          >
            <Briefcase className="w-4 h-4" /> CARGOS
          </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-50 dark:bg-cyan-900/20 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 relative">Dotación Total</span>
          <div className="text-4xl font-black text-slate-800 dark:text-slate-100 relative">64</div>
          <div className="mt-2 text-[10px] font-black text-cyan-600 uppercase tracking-tight relative flex items-center gap-1">
             <TrendingUp className="w-3 h-3" /> +3 este mes
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cargos Definidos</span>
          <div className="text-4xl font-black text-slate-800 dark:text-slate-100">12</div>
          <div className="mt-2 text-[10px] font-black text-slate-400 uppercase tracking-tight">4 departamentos</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Gasto Planilla Mensual</span>
          <div className="text-3xl font-black text-emerald-600">$48.5M</div>
          <div className="mt-2 text-[10px] font-black text-slate-400 uppercase tracking-tight">Proyectado Mayo 2026</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Pilar de Roles</span>
          <div className="flex -space-x-2 mt-2">
             <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-indigo-600">AD</div>
             <div className="w-8 h-8 rounded-full bg-cyan-100 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-cyan-600">MC</div>
             <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-amber-600">SU</div>
             <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-600">+4</div>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[600px] flex flex-col transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder={activeTab === 'usuarios' ? "Buscar por nombre, RUT o cargo..." : "Buscar cargo o departamento..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 rounded-2xl border border-transparent focus:border-cyan-500 shadow-sm outline-none font-bold text-sm text-slate-800 dark:text-slate-100 transition-all"
            />
          </div>

          <Button 
            className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 h-14 px-8 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-slate-900/10 active:scale-95 transition-all"
          >
            {activeTab === 'usuarios' ? <UserPlus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {activeTab === 'usuarios' ? 'CONTRATAR PERSONAL' : 'NUEVO CARGO'}
          </Button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-center items-center justify-center text-slate-400 font-bold uppercase tracking-widest flex-col gap-4">
             <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
             Cargando datos...
          </div>
        ) : activeTab === 'usuarios' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador / RUT</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo / Empresa</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol Sistema</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-black text-indigo-600">
                          {u.nombre[0]}{u.apellidoPaterno[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 dark:text-slate-100 text-lg leading-tight">{u.nombre} {u.apellidoPaterno} {u.apellidoMaterno}</span>
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                            <UserCircle className="w-3 h-3" /> {u.rut}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs font-bold">
                             <Mail className="w-3.5 h-3.5 text-slate-400" />
                             {u.email}
                          </div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Prestador: {u.tipo}</div>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex flex-col">
                          <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{u.cargo}</span>
                          <span className="text-[10px] font-bold text-cyan-600 flex items-center gap-1 uppercase tracking-tight">
                             <Building2 className="w-3 w-3" /> {u.empresa}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-[10px] uppercase tracking-wider">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          {u.rol}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${u.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {u.estado}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-slate-400 hover:text-cyan-600 transition-colors">
                             <Pencil className="w-5 h-5" />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                             <Trash2 className="w-5 h-5" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Cargo</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Departamento</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Usuarios Asignados</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Renta Base Sugerida</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCargos.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-6 font-black text-slate-800 dark:text-slate-100 text-lg uppercase">{c.nombre}</td>
                    <td className="px-6 py-6 font-bold text-slate-600 dark:text-slate-400">{c.departamento}</td>
                    <td className="px-6 py-6 text-center">
                       <span className="inline-flex items-center gap-2 font-black text-slate-800 dark:text-slate-100">
                          <Users className="w-4 h-4 text-slate-400" /> {c.usuarios}
                       </span>
                    </td>
                    <td className="px-6 py-6">
                       <span className="font-black text-emerald-600 text-lg">${c.sueldoBase.toLocaleString('es-CL')}</span>
                    </td>
                    <td className="px-6 py-6 text-right">
                       <div className="flex items-center justify-end gap-3">
                          <button className="text-[10px] font-black uppercase text-cyan-600 hover:underline">Ver Perfil</button>
                          <button className="p-2 text-slate-400 hover:text-cyan-600"><Pencil className="w-5 h-5" /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
