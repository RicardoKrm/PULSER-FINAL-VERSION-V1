import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.from('logistica_repuestos').insert([{
    empresa_id: '123e4567-e89b-12d3-a456-426614174000',
    nombre: 'test',
    sku: '123',
    calidad: '12',
    stock: 1,
    min_stock: 1,
    ubicacion: 'A',
    proveedor: 'B',
    precio: 100
  }]);
  console.log('insert error:', error);
}

test();



