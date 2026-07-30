import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function run() {
  const defaultCompanyId = 'e697c11a-0b2c-473d-9d41-5df784b80b2a';
  
  // 1. Check if the default company already exists
  const { data: existingCompany } = await supabase
    .from('empresa')
    .select('*')
    .eq('id', defaultCompanyId)
    .maybeSingle();

  if (!existingCompany) {
    console.log("Seeding default company...");
    const { data, error } = await supabase
      .from('empresa')
      .insert([
        {
          id: defaultCompanyId,
          nombre: 'Empresa Demo',
          razon_social: 'Empresa Demo S.A.',
          estado: 'Activo'
        }
      ])
      .select();
    console.log("Seeding company response:", { data, error });
  } else {
    console.log("Default company already exists:", existingCompany);
  }

  // 2. Also, if there are any users in usuario_aplicacion with null empresa_id, update them to use this company
  const { data: usersWithNullCompany } = await supabase
    .from('usuario_aplicacion')
    .select('id, nombre, email')
    .is('empresa_id', null);

  console.log("Users with null company:", usersWithNullCompany);

  if (usersWithNullCompany && usersWithNullCompany.length > 0) {
    console.log("Updating users to associate with default company...");
    for (const u of usersWithNullCompany) {
      const { data, error } = await supabase
        .from('usuario_aplicacion')
        .update({ empresa_id: defaultCompanyId })
        .eq('id', u.id)
        .select();
      console.log(`Updated user ${u.email}:`, { data, error });
    }
  }
}

run();
