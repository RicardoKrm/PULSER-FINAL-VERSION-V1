import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Users, Save, ShieldCheck, Mail, MessageSquare } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../lib/supabase';
import Swal from 'sweetalert2';

export default function MatrizEscalamiento() {
  const { currentCompany } = useCompany();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mocking the matrix for now until the user executes the SQL in Supabase
  const [matriz, setMatriz] = useState({
    responsable_id: '',
    supervisor_id: '',
    gerente_id: '',
    dias_para_escalar: 1,
    metodo: 'WHATSAPP'
  });

  useEffect(() => {
    if (currentCompany?.id) {
      fetchData();
    }
  }, [currentCompany?.id]);

  const fetchData = async () => {
    setLoading(true);
    // Fetch users for the dropdowns
    const { data: usersData } = await supabase
      .from('usuario_aplicacion')
      .select('id, nombre, cargo')
      .eq('empresa_id', currentCompany?.id);
    
    if (usersData) {
      setUsuarios(usersData);
    }

    // Attempt to fetch matrix if table exists, otherwise catch gracefully
    try {
      const { data: matrizData, error } = await supabase
        .from('matriz_escalamiento')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .eq('area', 'CONTROL_DOCUMENTAL')
        .single();
        
      if (matrizData) {
        setMatriz({
          responsable_id: matrizData.responsable_id || '',
          supervisor_id: matrizData.supervisor_id || '',
          gerente_id: matrizData.gerente_id || '',
          dias_para_escalar: matrizData.dias_para_escalar || 1,
          metodo: 'WHATSAPP'
        });
      }
    } catch (e) {
      // Table doesn't exist yet, ignore
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      // Try to save to the database assuming the table exists
      const { data: existing } = await supabase
        .from('matriz_escalamiento')
        .select('id')
        .eq('empresa_id', currentCompany?.id)
        .eq('area', 'CONTROL_DOCUMENTAL')
        .single();

      if (existing) {
        await supabase
          .from('matriz_escalamiento')
          .update({
            responsable_id: matriz.responsable_id || null,
            supervisor_id: matriz.supervisor_id || null,
            gerente_id: matriz.gerente_id || null,
            dias_para_escalar: matriz.dias_para_escalar
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('matriz_escalamiento')
          .insert([{
            empresa_id: currentCompany?.id,
            area: 'CONTROL_DOCUMENTAL',
            responsable_id: matriz.responsable_id || null,
            supervisor_id: matriz.supervisor_id || null,
            gerente_id: matriz.gerente_id || null,
            dias_para_escalar: matriz.dias_para_escalar
          }]);
      }
      
      Swal.fire('Guardado', 'Matriz de escalamiento configurada exitosamente.', 'success');
    } catch (e: any) {
      console.warn("Table might not exist yet:", e);
      Swal.fire('Atención', 'La estructura de base de datos para la matriz aún no ha sido creada. Se requiere ejecutar el script SQL.', 'info');
    }
  };

  return (
    <div className="p-6 w-full max-w-[1600px] mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-500" />
            Matriz de Escalamiento
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
            Define la jerarquía de notificaciones automáticas (Responsable → Supervisor → Gerente) para las alertas del sistema.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors font-bold shadow-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          Guardar Matriz
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Jerarquía de Alertas (Control Documental)
              </CardTitle>
              <CardDescription>
                Si el Nivel 1 no responde con un "OK Recibido", el sistema escalará automáticamente la alerta al Nivel 2.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Nivel 1 */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-900/10">
                <div className="flex flex-col items-center gap-1 mt-1">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">1</div>
                  <div className="w-0.5 h-12 bg-blue-200 dark:bg-blue-800/50"></div>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">Nivel 1: Responsable Directo</h4>
                  <p className="text-xs text-slate-500 mb-3">Recibe la alerta de vencimiento en primera instancia.</p>
                  <select 
                    value={matriz.responsable_id}
                    onChange={(e) => setMatriz({...matriz, responsable_id: e.target.value})}
                    className="w-full max-w-md px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none text-slate-900 dark:text-white"
                  >
                    <option value="">-- Seleccionar Responsable --</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nombre} ({u.cargo})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nivel 2 */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-amber-100 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-900/10">
                <div className="flex flex-col items-center gap-1 mt-1">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">2</div>
                  <div className="w-0.5 h-12 bg-amber-200 dark:bg-amber-800/50"></div>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">Nivel 2: Supervisor de Área</h4>
                  <p className="text-xs text-slate-500 mb-3">Recibe el escalamiento si el Responsable no acusa recibo.</p>
                  <select 
                    value={matriz.supervisor_id}
                    onChange={(e) => setMatriz({...matriz, supervisor_id: e.target.value})}
                    className="w-full max-w-md px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none text-slate-900 dark:text-white"
                  >
                    <option value="">-- Seleccionar Supervisor --</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nombre} ({u.cargo})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nivel 3 */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10">
                <div className="flex flex-col items-center gap-1 mt-1">
                  <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">3</div>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">Nivel 3: Gerencia / Dueño</h4>
                  <p className="text-xs text-slate-500 mb-3">Recibe la alerta crítica si ni el Responsable ni el Supervisor atienden el problema.</p>
                  <select 
                    value={matriz.gerente_id}
                    onChange={(e) => setMatriz({...matriz, gerente_id: e.target.value})}
                    className="w-full max-w-md px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none text-slate-900 dark:text-white"
                  >
                    <option value="">-- Seleccionar Gerente/Dueño --</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nombre} ({u.cargo})</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 pb-4">
              <CardTitle className="text-lg">Tiempos de Escalamiento</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Días de espera antes de escalar al siguiente nivel:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={matriz.dias_para_escalar}
                  onChange={(e) => setMatriz({...matriz, dias_para_escalar: Number(e.target.value)})}
                  className="w-20 px-3 py-2 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold outline-none text-indigo-600 dark:text-indigo-400"
                />
                <span className="text-sm font-medium text-slate-500">Día(s)</span>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                Si el Responsable recibe la alerta hoy, tiene {matriz.dias_para_escalar} día(s) para confirmarla antes de que se alerte al Supervisor.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 pb-4">
              <CardTitle className="text-lg">Canales de Notificación</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className={`p-3 rounded-lg border cursor-pointer transition-colors ${matriz.metodo === 'WHATSAPP' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'}`} onClick={() => setMatriz({...matriz, metodo: 'WHATSAPP'})}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${matriz.metodo === 'WHATSAPP' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-800 dark:text-white">API WhatsApp Business</h5>
                    <p className="text-xs text-slate-500">Enviar mensajes directos</p>
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-lg border cursor-pointer transition-colors ${matriz.metodo === 'EMAIL' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'}`} onClick={() => setMatriz({...matriz, metodo: 'EMAIL'})}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${matriz.metodo === 'EMAIL' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-800 dark:text-white">Correo Electrónico</h5>
                    <p className="text-xs text-slate-500">Enviar e-mails transaccionales</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
