import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('produccion_registro_diario').select('*').limit(3);
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
test();
