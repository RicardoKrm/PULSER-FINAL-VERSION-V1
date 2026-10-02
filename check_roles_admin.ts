import { createClient } from '@supabase/supabase-js';

let env = '';
try {
  env = require('fs').readFileSync('.env', 'utf8');
} catch(e) {}
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1] || process.env.VITE_SUPABASE_URL;
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1] || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function run() {
  const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'superadministrador@gaval.cl',
    password: 'admin123'
  });
  
  if (loginErr) {
    console.log("Login failed:", loginErr.message);
    return;
  }
  
  console.log("Logged in successfully. Querying...");
  
  const { data: roles, error: rolesErr } = await supabase.from('rol').select('*');
  console.log("ROLES", roles?.length, rolesErr);
  if (roles && roles.length > 0) {
     console.log(roles.map(r => ({id: r.id, nombre: r.nombre, tipo: r.tipo, permisosCount: r.permisos?.length})));
  }

  const { data: users, error: usersErr } = await supabase.from('usuario_aplicacion').select('id, nombre, email, empresa_id, rol_id, estado, cargo');
  console.log("USERS", users?.length, usersErr);
  if (users && users.length > 0) {
     console.log("Recent users:", users.slice(-5));
  }
}
run();
