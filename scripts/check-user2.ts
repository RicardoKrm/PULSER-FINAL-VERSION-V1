import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase.from('usuario_aplicacion').select('id, nombre, email, auth_user_id, rol(nombre, permisos)');
  console.log("Users:", JSON.stringify(data, null, 2));
}

run();
