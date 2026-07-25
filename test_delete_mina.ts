import { supabase } from './src/lib/supabase';

async function run() {
  const { data, error } = await supabase.from('produccion_registro_diario_mina').select('fecha').limit(1);
  console.log("data:", data, "error:", error);
  if (data && data.length > 0) {
    const fecha = data[0].fecha;
    console.log("deleting", fecha);
    const { error: delError } = await supabase.from('produccion_registro_diario_mina').delete().eq('fecha', fecha);
    console.log("delError:", delError);
  }
}
run();
