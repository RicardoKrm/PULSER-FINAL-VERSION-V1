import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

async function run() {
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@pulser.cl',
    password: 'admin123'
  });
  if (authError) {
    console.error('Login error:', authError);
    return;
  }

  const { data: users, error } = await supabase
    .from('usuario_aplicacion')
    .select('email, auth_user_id, empresa_id, rol_id, estado, nombre');
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log('USERS IN DB:');
  console.log(JSON.stringify(users, null, 2));
}

run();
