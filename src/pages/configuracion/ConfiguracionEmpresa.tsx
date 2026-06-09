import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Save, 
  Upload,
  User,
  Shield,
  CreditCard,
  Bell,
  Link as LinkIcon
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import Swal from 'sweetalert2';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

export default function ConfiguracionEmpresa() {
  const { activeCompanyId } = useCompany();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    direccion: '',
    comuna: '',
    ciudad: '',
    pais: 'Chile',
    telefono: '',
    email: '',
    website: '',
    moneda: 'CLP',
    zonaHoraria: 'UTC-3',
    logo_url: ''
  });

  useEffect(() => {
    if (activeCompanyId) {
      loadData();
    }
  }, [activeCompanyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      let queryData;
      let { data, error } = await supabase.from('empresa').select('nombre, rut, detalles').eq('id', activeCompanyId).single();
      
      if (error) {
        // Fallback: If 'detalles' column is missing, just fetch 'nombre' and 'rut'
        const fallback = await supabase.from('empresa').select('nombre, rut').eq('id', activeCompanyId).single();
        if (fallback.error) throw fallback.error;
        queryData = fallback.data;
      } else {
        queryData = data;
      }
      
      const det = queryData.detalles || {};
      
      setFormData({
        nombre: queryData.nombre || '',
        rut: queryData.rut || '',
        direccion: det.direccion || '',
        comuna: det.comuna || '',
        ciudad: det.ciudad || '',
        pais: det.pais || 'Chile',
        telefono: det.telefono || '',
        email: det.email || '',
        website: det.website || '',
        moneda: det.moneda || 'CLP',
        zonaHoraria: det.zonaHoraria || 'UTC-3',
        logo_url: det.logo_url || ''
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire('Error', `No se pudo cargar la configuración de la empresa: ${err.message || JSON.stringify(err)}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const dbDetalles = {
        direccion: formData.direccion,
        comuna: formData.comuna,
        ciudad: formData.ciudad,
        pais: formData.pais,
        telefono: formData.telefono,
        email: formData.email,
        website: formData.website,
        moneda: formData.moneda,
        zonaHoraria: formData.zonaHoraria,
        logo_url: formData.logo_url
      };

      let dataToUpdate: any = {
        nombre: formData.nombre,
        rut: formData.rut,
      };

      const { error } = await supabase.from('empresa').update({
        ...dataToUpdate,
        detalles: dbDetalles
      }).eq('id', activeCompanyId);

      if (error) {
         // Attempt fallback update
         const fallbackParams = await supabase.from('empresa').update(dataToUpdate).eq('id', activeCompanyId);
         if (fallbackParams.error) throw fallbackParams.error;
         
         Swal.fire({
           icon: 'warning',
           title: 'Atención',
           text: 'Los datos básicos se guardaron, pero falta la columna "detalles" (JSONB) en la tabla "empresa" para guardar toda la configuración. Contacte a soporte o ejecute ALTER TABLE empresa ADD COLUMN detalles JSONB;'
         });
         return;
      }

      Swal.fire({
        title: '¡Configuración Guardada!',
        text: 'Los datos de la empresa han sido actualizados correctamente.',
        icon: 'success',
        confirmButtonColor: '#0891b2'
      });
    } catch (error: any) {
      console.error(error);
      Swal.fire('Error', error.message, 'error');
    }
  };

  if (loading) {
     return <div className="p-8 text-center text-slate-500 font-bold">Cargando configuración...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            Configuración <span className="text-cyan-600">Empresa</span>
          </h1>
          <p className="text-slate-500 font-medium italic">Datos tributarios, contacto y preferencias globales.</p>
        </div>
        <Button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700 h-12 px-6 rounded-2xl shadow-lg shadow-cyan-600/20 font-black">
          <Save className="w-5 h-5 mr-2" /> GUARDAR CAMBIOS
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
             <div className="mb-6 flex flex-col items-center gap-3 w-full">
                <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center overflow-hidden">
                   {formData.logo_url ? (
                     <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain" />
                   ) : (
                     <Building2 className="w-16 h-16 text-slate-300" />
                   )}
                </div>
                <div className="w-full space-y-2 mt-4 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block text-center">URL DEL LOGO (OPCIONAL)</label>
                  <input 
                    type="text" 
                    value={formData.logo_url}
                    onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                    placeholder="https://ejemplo.com/logo.png"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-medium border border-transparent focus:border-cyan-500 outline-none transition-all text-xs text-center" 
                  />
                </div>
             </div>
             <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">{formData.nombre || 'Nombre de Empresa'}</h2>
             <p className="text-slate-400 font-bold text-sm tracking-widest uppercase mb-6">ID Tributario: {formData.rut || 'N/A'}</p>
             
             <div className="w-full space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                   <Phone className="w-4 h-4 text-cyan-600" /> {formData.telefono || 'Sin teléfono'}
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                   <Mail className="w-4 h-4 text-cyan-600" /> {formData.email || 'Sin email'}
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                   <Globe className="w-4 h-4 text-cyan-600" /> {formData.website || 'Sin sitio web'}
                </div>
             </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-[2.5rem] border border-amber-100 dark:border-amber-900/50">
             <h4 className="font-black text-amber-900 dark:text-amber-400 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5" /> Estado de Cuenta
             </h4>
             <p className="text-amber-700 dark:text-amber-600 text-sm font-medium mb-4">Tu suscripción a PULSER TMS vence en 45 días.</p>
             <button className="text-[10px] font-black uppercase text-amber-900 dark:text-amber-400 hover:underline">Renovar ahora</button>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">Información Tributaria y Legal</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Razón Social</label>
                  <input 
                    type="text" 
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-cyan-500 outline-none transition-all" 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">RUT Empresa</label>
                  <input 
                    type="text" 
                    value={formData.rut}
                    onChange={(e) => setFormData({...formData, rut: e.target.value})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-cyan-500 outline-none transition-all" 
                  />
               </div>
               <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Dirección de la Matriz</label>
                  <input 
                    type="text" 
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-cyan-500 outline-none transition-all" 
                    placeholder="Calle, número, departamento"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Ciudad / Provincia</label>
                  <input 
                    type="text" 
                    value={formData.ciudad}
                    onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-cyan-500 outline-none transition-all" 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">País</label>
                  <select 
                    value={formData.pais}
                    onChange={(e) => setFormData({...formData, pais: e.target.value})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-cyan-500 outline-none transition-all appearance-none"
                  >
                     <option value="Chile">Chile</option>
                     <option value="Argentina">Argentina</option>
                     <option value="Colombia">Colombia</option>
                     <option value="México">México</option>
                  </select>
               </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">Preferencias del Sistema</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Moneda del Sistema</label>
                  <select 
                    value={formData.moneda}
                    onChange={(e) => setFormData({...formData, moneda: e.target.value})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-cyan-500 outline-none transition-all"
                  >
                     <option value="CLP">Pesos Chilenos (CLP)</option>
                     <option value="USD">Dólares (USD)</option>
                     <option value="EUR">Euros (EUR)</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Zona Horaria</label>
                  <select 
                    value={formData.zonaHoraria}
                    onChange={(e) => setFormData({...formData, zonaHoraria: e.target.value})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-cyan-500 outline-none transition-all"
                  >
                     <option value="UTC-3">UTC-3 (Chile Continental)</option>
                     <option value="UTC-5">UTC-5 (Centro)</option>
                     <option value="UTC">Universal (UTC)</option>
                  </select>
               </div>
               <div className="md:col-span-2 flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl mt-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white">
                     <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                     <span className="font-black text-slate-800 dark:text-slate-100 text-sm">Alertas Automáticas</span>
                     <p className="text-slate-400 font-medium text-xs">Enviar notificaciones de mantenimiento al correo del administrador.</p>
                  </div>
                  <div className="w-12 h-6 bg-cyan-600 rounded-full relative cursor-pointer">
                     <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
