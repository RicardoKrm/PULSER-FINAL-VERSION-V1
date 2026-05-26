import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supa = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function debugSchemaAndRows() {
  console.log("--- DEBUGGING SCHEMA AND ROWS ---");
  
  // Try querying table names and their column definitions if possible, or just query any existing row
  const { data: cols, error: colsErr } = await supa.rpc('get_table_columns', { table_name_param: 'orden_de_trabajo' });
  if (colsErr) {
    console.log("RPC get_table_columns not available or failed:", colsErr.message);
  } else {
    console.log("Columns of orden_de_trabajo:", cols);
  }

  // Let's query one row of orden_de_trabajo with absolutely zero filters to see if any exist at all
  console.log("\nQuerying orden_de_trabajo table...");
  const { data: rowData, error: rowErr } = await supa.from('orden_de_trabajo').select('id, folio, empresa_id').limit(5);
  if (rowErr) {
    console.error("error querying orden_de_trabajo:", rowErr);
  } else {
    console.log("Found rows in orden_de_trabajo:", rowData);
  }

  // Let's query personal
  console.log("\nQuerying colaborador table...");
  const { data: colabs, error: colabsErr } = await supa.from('colaborador').select('id, nombre').limit(2);
  if (colabsErr) {
    console.error("error querying colaborador:", colabsErr);
  } else {
    console.log("Found colabs:", colabs);
  }
}

debugSchemaAndRows();
