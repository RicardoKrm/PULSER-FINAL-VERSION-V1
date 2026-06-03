import { supabase } from '../src/lib/supabase';

async function run() {
  const { error } = await supabase.from('empresa').update({ detalles: { logo_url: '' } }).eq('id', '123').single();
  // We can't really do DDL easily from the client side without executing sql, but maybe we can just query with an alter table via the SQL endpoint if it exists? Wait, Supabase js client has `supabase.rpc()` 
}
run();
