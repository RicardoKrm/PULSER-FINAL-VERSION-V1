import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

async function run() {
  await supabase.auth.signInWithPassword({
    email: 'admin@pulser.cl',
    password: 'admin123'
  });

  console.log('Querying logistica_repuestos with eq(empresa_id, 57fa41da-645d-48ba-a671-65a35312d0e9)...');
  const { data } = await supabase
    .from('logistica_repuestos')
    .select('id, empresa_id')
    .eq('empresa_id', '57fa41da-645d-48ba-a671-65a35312d0e9');
  
  console.log('Returned count:', data?.length);
  if (data) {
    const uniq = Array.from(new Set(data.map(d => d.empresa_id)));
    console.log('Unique empresa_id in result:', uniq);
  }
}
run();
