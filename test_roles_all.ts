import { supabase } from './src/lib/supabase';
async function test() {
  const { data, error } = await supabase.from('rol').select('*');
  console.log("ALL ROLES", data);
}
test();
