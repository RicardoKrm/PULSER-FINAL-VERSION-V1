import { supabase } from './src/lib/supabase';
async function test() {
  const dummyUUIDs = Array.from({ length: 150 }, () => '11111111-1111-1111-1111-111111111111');
  const { error } = await supabase.from('logistica_repuestos').select('id').in('id', dummyUUIDs);
  console.log('Error?', error);
}
test();
