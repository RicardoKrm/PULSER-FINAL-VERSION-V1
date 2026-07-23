import { supabase } from './src/lib/supabase';

async function run() {
  const { data, error } = await supabase.from('produccion_registro_diario').select('*').limit(5)
  console.log("transporte", data)
  
  const { data: mina, error: e2 } = await supabase.from('produccion_registro_diario_mina').select('*').limit(5)
  console.log("mina", mina)
}

run()
