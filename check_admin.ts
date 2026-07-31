import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, anonKey);

async function run() {
  console.log("Signing in...");
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'admin@pulser.cl',
    password: 'admin123'
  });
  console.log("Logged in user email:", authData.user?.email, "id:", authData.user?.id);

  // Query usuario_aplicacion for this user
  const { data: uApp, error: uAppErr } = await supabase
    .from('usuario_aplicacion')
    .select('*, rol:rol_id(nombre)')
    .eq('email', 'admin@pulser.cl');
  console.log("usuario_aplicacion for admin@pulser.cl:", uApp, uAppErr);

  // Query all companies
  const { data: companies } = await supabase.from('empresa').select('id, nombre');
  console.log("Companies:", companies);
}
run();
