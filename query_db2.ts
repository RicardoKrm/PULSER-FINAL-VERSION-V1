import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL as string, process.env.VITE_SUPABASE_ANON_KEY as string);
async function run() {
  const { data, error } = await supabase.from('produccion_registro_diario').select('*').limit(5);
  console.log(JSON.stringify(data, null, 2));
}
run();
