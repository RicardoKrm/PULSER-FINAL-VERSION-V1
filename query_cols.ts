import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const { data, error } = await supabase.from('produccion_registro_diario_mina').select('*').limit(1);
console.log(data ? Object.keys(data[0] || {}) : error);
