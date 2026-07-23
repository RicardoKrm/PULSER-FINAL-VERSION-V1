import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://example.com'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'example'

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.from('produccion_registro_diario').select('*').limit(5)
  console.log("transporte", data)
  
  const { data: mina, error: e2 } = await supabase.from('produccion_registro_diario_mina').select('*').limit(5)
  console.log("mina", mina)
}

run()
