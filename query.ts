import { supabase } from './src/lib/supabase';
(async () => {
   const {count} = await supabase.from('logistica_repuestos').select('*', {count: 'exact', head: true});
   console.log('COUNT logistica_repuestos:', count);
})();
