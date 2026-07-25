import { supabase } from './src/lib/supabase';

async function run() {
  const { data, error } = await supabase.from('produccion_registro_diario_mina').select('fecha, equipo, operador');
  console.log("verify data:", data);
}
run();
