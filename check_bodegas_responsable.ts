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

  const { data: bodegas, error } = await supabase
    .from('logistica_bodegas')
    .select('id, nombre, responsable, empresa_id')
    .eq('empresa_id', '57fa41da-645d-48ba-a671-65a35312d0e9');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${bodegas?.length} bodegas.`);
  bodegas?.forEach((b, idx) => {
    console.log(`Bodega ${idx}: id=${b.id}, nombre=${b.nombre}, responsable=${b.responsable}`);
  });
}

run();
