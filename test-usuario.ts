import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data: u, error: eErr } = await supabase.from('usuario_aplicacion').select('*').limit(1);
  console.log('Usuario error:', eErr);
  console.log('Usuario length:', u?.length);
}
run();
