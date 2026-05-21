import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Faltan las variables de entorno de Supabase. Algunas funcionalidades pueden fallar.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const logActividad = async (
  modulo: string,
  accion: string,
  detalles: string,
  empresaId?: string,
  usuarioId?: string
) => {
  try {
    // We intentionally don't await this if we want it to run detached
    await supabase.from('log_actividad').insert([{
      modulo,
      accion,
      detalles,
      empresa_id: empresaId,
      usuario_id: usuarioId
    }]);
  } catch (error) {
    console.error("No se pudo registrar la actividad:", error);
  }
};
