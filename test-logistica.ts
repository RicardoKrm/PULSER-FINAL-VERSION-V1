import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data: rep, error: rErr } = await supabase.from('logistica_repuestos').select('*');
  console.log('Repuestos error:', rErr);
  console.log('Repuestos length:', rep?.length);
  
  if (rep && rep.length > 0) {
     console.log('Sample repuesto:', rep[0]);
  }
}
run();
