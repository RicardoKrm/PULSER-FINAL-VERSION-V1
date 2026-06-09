import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL as string, process.env.VITE_SUPABASE_ANON_KEY as string);
async function run() {
  const fetch = require('node-fetch');
  const res = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/empresa?limit=1`, {
    headers: {
      'apikey': process.env.VITE_SUPABASE_ANON_KEY as string,
      'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
    }
  });
  const data = await res.json();
  console.log(data);
}
run();
