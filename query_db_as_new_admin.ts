import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

async function run() {
  console.log('Logging in as admin@pulser.cl (now Super Admin)...');
  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@pulser.cl',
    password: 'admin123'
  });
  if (authError) {
    console.error('Login error:', authError);
    return;
  }
  
  console.log('Querying logistica_repuestos...');
  const { data: repuestos, error: repError } = await supabase
    .from('logistica_repuestos')
    .select('*');
  
  console.log('Repuestos error:', repError);
  console.log('Repuestos count:', repuestos?.length);
  if (repuestos && repuestos.length > 0) {
    console.log('First 5 repuestos:', JSON.stringify(repuestos.slice(0, 5), null, 2));
    
    // Group by company
    const counts: Record<string, number> = {};
    for (const r of repuestos) {
      counts[r.empresa_id] = (counts[r.empresa_id] || 0) + 1;
    }
    console.log('Repuestos counts by company_id:', counts);
  }

  console.log('Querying logistica_bodegas...');
  const { data: bodegas, error: bodError } = await supabase
    .from('logistica_bodegas')
    .select('*');
  
  console.log('Bodegas error:', bodError);
  console.log('Bodegas count:', bodegas?.length);
  if (bodegas && bodegas.length > 0) {
    console.log('First 5 bodegas:', JSON.stringify(bodegas.slice(0, 5), null, 2));
    
    const counts: Record<string, number> = {};
    for (const b of bodegas) {
      counts[b.empresa_id] = (counts[b.empresa_id] || 0) + 1;
    }
    console.log('Bodegas counts by company_id:', counts);
  }
}

run();
