import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.rpc('run_sql', { sql: "SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'proveedor';" });
  console.log(JSON.stringify(data, null, 2));
  console.log(error);
}
test();
