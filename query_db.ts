import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, anonKey);

async function run() {
  console.log("Signing in with admin@pulser.cl...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@pulser.cl',
    password: 'admin123'
  });

  if (authError) {
    console.error("Auth Error:", authError);
    return;
  }

  console.log("Authenticated as user:", authData.user?.email, "ID:", authData.user?.id);

  // Now query
  const { data: companies, error: compError } = await supabase.from('empresa').select('*');
  console.log("COMPANIES:", companies, compError);

  const { data: users, error: userError } = await supabase.from('usuario_aplicacion').select('*, rol:rol_id(nombre), empresa:empresa_id(nombre)');
  console.log("USERS:", users, userError);

  const { data: repuestos, error: repError } = await supabase.from('logistica_repuestos').select('id, nombre, empresa_id');
  console.log("REPUESTOS COUNT:", repuestos ? repuestos.length : 0, repError);
  if (repuestos && repuestos.length > 0) {
    console.log("SAMPLE REPUESTOS:", repuestos.slice(0, 10));
  }
}
run();
