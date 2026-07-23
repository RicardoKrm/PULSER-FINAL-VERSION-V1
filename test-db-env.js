import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const content = fs.readFileSync('.env', 'utf8')
const env = {}
content.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    env[key] = value.trim()
  }
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseKey = env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.from('produccion_registro_diario').select('*')
  console.log("transporte:", data)
}
run()
