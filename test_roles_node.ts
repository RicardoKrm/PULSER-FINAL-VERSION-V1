import { supabase } from './src/lib/supabase';
async function test() {
  const { data, error } = await supabase.from('rol').select('*');
  if (error) console.log("ERROR", error);
  else console.log("ROLES", data.filter(r => r.nombre === 'Administrador'));
}
test();
