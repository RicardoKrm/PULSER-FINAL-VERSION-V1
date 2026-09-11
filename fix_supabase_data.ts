import { supabase } from './src/lib/supabase';

async function fix() {
  console.log("Fetching first company...");
  const { data: companies, error: cErr } = await supabase.from('empresa').select('id').limit(1);
  if (cErr || !companies || companies.length === 0) {
    console.error("Could not find a company.", cErr);
    return;
  }
  
  const companyId = companies[0].id;
  console.log("Using companyId:", companyId);
  
  const { error: e1 } = await supabase.from('produccion_registro_diario')
    .update({ empresa_id: companyId })
    .is('empresa_id', null);
  console.log("Updated produccion_registro_diario:", e1 || "Success");

  const { error: e2 } = await supabase.from('produccion_registro_diario_mina')
    .update({ empresa_id: companyId })
    .is('empresa_id', null);
  console.log("Updated produccion_registro_diario_mina:", e2 || "Success");

  const { error: e3 } = await supabase.from('produccion_sanny')
    .update({ empresa_id: companyId })
    .is('empresa_id', null);
  console.log("Updated produccion_sanny:", e3 || "Success");
}

fix();
