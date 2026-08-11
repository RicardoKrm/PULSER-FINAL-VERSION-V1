import { supabase } from './src/lib/supabase';
async function test() {
  const { data } = await supabase.from('produccion_mina_mensual').select('mes');
  console.log(Array.from(new Set(data?.map(d => d.mes))));
}
test();
