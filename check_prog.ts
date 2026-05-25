import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function check() {
  const { data: progs } = await supabase.from('operacion_programacion').select('*');
  console.log('PROGRAMACION:', progs);
}

check();
