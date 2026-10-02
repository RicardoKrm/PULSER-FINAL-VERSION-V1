import { createClient } from '@supabase/supabase-js';

const url = (import.meta as any).env?.VITE_SUPABASE_URL;
const key = (import.meta as any).env?.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('rol').select('*').limit(10);
  console.log("ALL ROLES (admin)", data, error);
}
test();
