import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'dummy';

export const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: b } = await supabase.from('empresa_detalles').select('id').limit(1).single();
  const empresa_id = b ? b.id : '11111111-1111-1111-1111-111111111111';

  const { data: newRep, error: createErr } = await supabase.from('logistica_repuestos').insert({
    empresa_id: empresa_id,
    sku: 'TEST_SKU_1234',
    nombre: 'TEST PRODUCT 4',
    bodega_id: null,
    stock: 1,
    precio: 0,
    valor_total: 0,
    calidad: 'ORIGINAL',
    estado: 'ACTIVO',
    ubicacion: 'A1',
    ult_mov: new Date().toISOString()
  }).select().single();
  
  console.log("Create Error:", createErr);
  console.log("New Rep:", newRep);
}

test();
