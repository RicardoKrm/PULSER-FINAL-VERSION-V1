import { supabase } from './src/lib/supabase';
async function test() {
  const { data, error } = await supabase.from('logistica_repuestos').select('id').limit(1);
  if (data && data.length > 0) {
    const id = data[0].id;
    console.log('Trying to delete ID:', id);
    // don't actually delete, just check if we get an RLS policy output? No, I want to see the error. We can do a dry run or just delete one from a dummy company.
    // wait, I can just write a script to simulate the error.
  }
}
test();
