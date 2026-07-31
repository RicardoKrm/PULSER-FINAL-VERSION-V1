import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

async function run() {
  console.log('1. Setting admin@pulser.cl to REGULAR Administrador of Imperia...');
  
  // Login first as whatever we are currently (we are Super Admin, so we can update)
  const { data: logData, error: lErr } = await supabase.auth.signInWithPassword({
    email: 'admin@pulser.cl',
    password: 'admin123'
  });
  if (lErr) {
    console.error('Login error:', lErr);
    return;
  }
  
  const userId = logData.user?.id;
  
  // Set to regular Administrador of Imperia
  const { data: updateData, error: updateError } = await supabase
    .from('usuario_aplicacion')
    .update({
      rol_id: '36cc0836-5f7c-4674-b280-c0af111caafc', // Administrador
      empresa_id: '57fa41da-645d-48ba-a671-65a35312d0e9' // Imperia
    })
    .eq('auth_user_id', userId)
    .select();

  console.log('Update result (now regular Admin):', updateData, updateError);

  // Re-login to get a fresh session as regular user
  console.log('\n2. Re-logging in to establish regular user session...');
  await supabase.auth.signOut();
  const { error: relError } = await supabase.auth.signInWithPassword({
    email: 'admin@pulser.cl',
    password: 'admin123'
  });
  if (relError) {
    console.error('Relogin error:', relError);
    return;
  }

  // Let's test the subquery directly: can we query usuario_aplicacion?
  console.log('\n3. Querying own profile in usuario_aplicacion...');
  const { data: profile, error: profErr } = await supabase
    .from('usuario_aplicacion')
    .select('id, auth_user_id, empresa_id');
  
  console.log('Profile query error:', profErr);
  console.log('Profile query returned:', profile);

  // Now query logistica_repuestos!
  console.log('\n4. Querying logistica_repuestos as regular user...');
  const { data: repuestos, error: repError } = await supabase
    .from('logistica_repuestos')
    .select('*');
  
  console.log('Repuestos query error:', repError);
  console.log('Repuestos query returned length:', repuestos?.length);

  // Now query logistica_bodegas!
  console.log('\n5. Querying logistica_bodegas as regular user...');
  const { data: bodegas, error: bodError } = await supabase
    .from('logistica_bodegas')
    .select('*');
  
  console.log('Bodegas query error:', bodError);
  console.log('Bodegas query returned length:', bodegas?.length);

  // CLEANUP: Reset back to Super Admin so we don't lose control
  console.log('\n6. Restoring admin@pulser.cl to Super Admin...');
  // Since we are regular user now, can we update ourselves? Let's check!
  const { data: restoreData, error: restoreError } = await supabase
    .from('usuario_aplicacion')
    .update({
      rol_id: '5d1bcc66-947e-44cb-b0e4-bb5856ff5261', // Súper Administrador
      empresa_id: null
    })
    .eq('auth_user_id', userId)
    .select();
  
  console.log('Restoration result:', restoreData, restoreError);
}

run();
