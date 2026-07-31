import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

async function run() {
  await supabase.auth.signInWithPassword({
    email: 'admin@pulser.cl',
    password: 'admin123'
  });

  const fetchAllRows = async (queryBuilder: any) => {
    let allData: any[] = [];
    let start = 0;
    const pageSize = 1000;
    let hasMore = true;
    let iterations = 0;
    while (hasMore) {
      iterations++;
      console.log(`Iteration ${iterations}, start = ${start}`);
      const { data, error } = await queryBuilder.range(start, start + pageSize - 1);
      if (error) {
        console.error('Error in range:', error);
        break;
      }
      console.log(`Fetched ${data?.length} rows.`);
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        start += pageSize;
      }
      if (!data || data.length < pageSize) {
        hasMore = false;
      }
      if (iterations > 10) {
        console.error('INFINITE LOOP DETECTED!');
        break;
      }
    }
    return allData;
  };

  console.log('Running fetchAllRows...');
  const rData = await fetchAllRows(supabase.from('logistica_repuestos').select(`
    *,
    logistica_bodegas (
      nombre
    )
  `).eq('empresa_id', '57fa41da-645d-48ba-a671-65a35312d0e9'));

  console.log('Total rData length:', rData.length);
}

run();
