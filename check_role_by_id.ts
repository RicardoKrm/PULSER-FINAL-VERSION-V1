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

  const { data: role, error } = await supabase
    .from('rol')
    .select('*')
    .eq('id', '36cc0836-5f7c-4674-b280-c0af111caafc')
    .single();
  
  if (error) {
    console.error('Error fetching role:', error);
    return;
  }

  console.log('ROLE DETAILS FOR 36cc0836-5f7c-4674-b280-c0af111caafc:');
  console.log(JSON.stringify(role, null, 2));
}

run();
