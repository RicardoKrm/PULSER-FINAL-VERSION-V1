import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl) return console.error('No Supabase URL');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const sql = fs.readFileSync(process.argv[2], 'utf8');
  
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  
  console.log('Result:', error || 'Success');

  // Reload schema cache
  await supabase.rpc('exec_sql', { query: 'NOTIFY pgrst, "reload schema";' });
}
run();
