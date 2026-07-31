import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

async function run() {
  console.log('Signing in as admin@pulser.cl...');
  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@pulser.cl',
    password: 'admin123'
  });
  if (authError) {
    console.error('Login error:', authError);
    return;
  }
  
  const userId = data.user?.id;
  console.log('Logged in user ID:', userId);

  // Let's check roles
  const { data: roles } = await supabase.from('rol').select('id, nombre');
  console.log('Roles:', roles);

  // Find Súper Administrador role id
  const superAdminRole = roles?.find(r => r.nombre === 'Súper Administrador' || r.nombre === 'Super Administrador');
  if (!superAdminRole) {
    console.error('Super Admin role not found.');
    return;
  }

  console.log('Updating our profile in usuario_aplicacion...');
  const { data: updateData, error: updateError } = await supabase
    .from('usuario_aplicacion')
    .update({
      rol_id: superAdminRole.id,
      empresa_id: '57fa41da-645d-48ba-a671-65a35312d0e9' // Associate with Imperia!
    })
    .eq('auth_user_id', userId)
    .select();

  console.log('Update result:', updateData, updateError);
}

run();
