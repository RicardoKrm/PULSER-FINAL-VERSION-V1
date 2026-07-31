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

  const { data: roles, error } = await supabase
    .from('rol')
    .select('*');
  
  if (error) {
    console.error('Error fetching roles:', error);
    return;
  }

  console.log('ROLES IN DB:');
  console.log(JSON.stringify(roles, null, 2));
}

run();
