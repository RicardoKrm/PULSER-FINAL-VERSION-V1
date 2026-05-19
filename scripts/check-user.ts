import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase.from('usuario_aplicacion').select('*, rol(nombre)').eq('email', 'fate.vr92@gmail.com');
  console.log("User:", JSON.stringify(data, null, 2));
}

run();
