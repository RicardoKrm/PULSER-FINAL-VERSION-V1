import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''; // Needs service role but wait

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const file = fs.readFileSync('add_bodega_id_to_movimientos.sql', 'utf8');
  const { data, error } = await supabase.rpc('run_sql', { sql: file });
  if (error) {
     console.log("e1", error);
     const { data: d2, error: e2 } = await supabase.rpc('exec_sql', { query: file });
     console.log("e2", e2);
  }
}
test();
