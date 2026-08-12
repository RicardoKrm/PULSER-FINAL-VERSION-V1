import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

async function run() {
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'superadministrador@gaval.cl',
    password: 'admin123'
  });
  
  if (authData?.session) {
    const { data } = await supabase.from('produccion_sanny').select('fecha, hora, equipo').limit(10);
    console.log("Records found:", data);
  }
}
run();
