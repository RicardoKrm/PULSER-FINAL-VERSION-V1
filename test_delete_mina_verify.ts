import { supabase } from './src/lib/supabase';

async function run() {
  const { data, error } = await supabase.from('produccion_registro_diario_mina').select('fecha').eq('fecha', '2026-07-24');
  console.log("verify data:", data);
}
run();
