import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

const admins = [
  'superadministrador@gaval.cl',
  'gavalos@gaval.cl'
];

async function tryLogin(email: string) {
  console.log(`Trying login for ${email}...`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: 'admin123'
  });
  if (error) {
    console.log(`Failed to log in as ${email}:`, error.message);
    return null;
  }
  console.log(`Successfully logged in as ${email}!`);
  return data;
}

async function run() {
  let session = null;
  for (const email of admins) {
    session = await tryLogin(email);
    if (session) break;
  }

  if (!session) {
    console.error('Could not log in as any Super Admin.');
    return;
  }

  // Now, since we are logged in as Super Admin, we should bypass RLS!
  console.log('Querying logistica_repuestos...');
  const { data: repuestos, error: rErr } = await supabase
    .from('logistica_repuestos')
    .select('*');
  
  if (rErr) {
    console.error('Error fetching repuestos:', rErr);
  } else {
    console.log(`Found ${repuestos?.length} repuestos!`);
    if (repuestos && repuestos.length > 0) {
      console.log('First 3 repuestos:', JSON.stringify(repuestos.slice(0, 3), null, 2));
      // Count by company_id
      const counts: Record<string, number> = {};
      for (const r of repuestos) {
        counts[r.empresa_id] = (counts[r.empresa_id] || 0) + 1;
      }
      console.log('Repuestos counts by company:', counts);
    }
  }

  console.log('Querying logistica_bodegas...');
  const { data: bodegas, error: bErr } = await supabase
    .from('logistica_bodegas')
    .select('*');

  if (bErr) {
    console.error('Error fetching bodegas:', bErr);
  } else {
    console.log(`Found ${bodegas?.length} bodegas!`);
    if (bodegas && bodegas.length > 0) {
      console.log('First 3 bodegas:', JSON.stringify(bodegas.slice(0, 3), null, 2));
    }
  }
}

run();
