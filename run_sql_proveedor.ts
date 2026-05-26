import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function run() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl) return console.error('No Supabase URL');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase.rpc('exec_sql', {
     query: 'ALTER TABLE public.proveedor ADD COLUMN IF NOT EXISTS empresa_id UUID;'
  });
  
  console.log('Result:', error || 'Success');
}

run();
