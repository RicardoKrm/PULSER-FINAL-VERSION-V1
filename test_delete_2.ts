import { supabase } from './src/lib/supabase';
async function test() {
  const { data: comp } = await supabase.from('empresas').select('id').limit(1);
  if (!comp || !comp[0]) {
       console.log('no comp'); return;
  }
  const currentCompany = comp[0];
  console.log('company is', currentCompany.id);

  const { data: repData, error: repErr } = await supabase.from('logistica_repuestos').insert([
      { empresa_id: currentCompany.id, nombre: 'dummy', stock: 10, precio: 10 }
  ]).select();

  if (repErr) {
    console.error('ins err', repErr);
    return;
  }
  console.log('inserted', repData);

  const repId = repData[0].id;
  const chunk = [repId];
  const { error: delErr } = await supabase.from('logistica_repuestos').delete().in('id', chunk);

  if (delErr) {
     console.error('DELETE ERROR:', delErr);
  } else {
     console.log('deleted successfully');
  }
}
test();
