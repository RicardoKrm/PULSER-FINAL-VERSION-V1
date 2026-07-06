import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL as string, process.env.VITE_SUPABASE_ANON_KEY as string);
async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: "SELECT polname, polcmd, polqual, polwithcheck FROM pg_policy WHERE polrelid = 'public.proveedor'::regclass;" });
  console.log(JSON.stringify({ data, error }, null, 2));
}
run();
