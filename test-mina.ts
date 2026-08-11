import { supabase } from './src/lib/supabase';
async function run() {
  const { data } = await supabase.from('produccion_mina_mensual').select('*').limit(1);
  console.log(JSON.stringify(data, null, 2));
}
run();
