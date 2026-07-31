import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

async function run() {
  console.log('Logging in as admin@pulser.cl...');
  const { data: logData, error: lErr } = await supabase.auth.signInWithPassword({
    email: 'admin@pulser.cl',
    password: 'admin123'
  });
  if (lErr) {
    console.error('Login error:', lErr);
    return;
  }

  console.log('Querying logistica_movimientos with nested joins...');
  const { data, error } = await supabase
    .from('logistica_movimientos')
    .select(`
      *,
      logistica_repuestos (nombre, sku, proveedor, ubicacion, logistica_bodegas(nombre))
    `)
    .eq('empresa_id', '57fa41da-645d-48ba-a671-65a35312d0e9')
    .limit(10);
  
  console.log('Error:', error);
  console.log('Returned rows:', data?.length);
  if (data && data.length > 0) {
    console.log('Sample row:', JSON.stringify(data[0], null, 2));
  }
}
run();
