import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supa = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function run() {
  console.log("--- STARTING END-TO-END DATABASE TEST ---");

  // A. Find or create a company to satisfy company references (if any)
  // Let's see what companies exist
  const { data: companies, error: compErr } = await supa.from('empresa').select('id').limit(1);
  let companyId: string | null = null;
  if (compErr) {
    console.log("Querying 'empresa' failed or table doesn't exist:", compErr.message);
  } else if (companies && companies.length > 0) {
    companyId = companies[0].id;
    console.log("Found existing company:", companyId);
  } else {
    // Try creating a test company
    const { data: newComp, error: createCompErr } = await supa.from('empresa').insert({
      nombre: "Test Company Inc"
    }).select();
    if (createCompErr) {
      console.log("Could not create test company:", createCompErr.message);
    } else if (newComp && newComp.length > 0) {
      companyId = newComp[0].id;
      console.log("Created test company:", companyId);
    }
  }

  // B. Find or create a vehicle to satisfy the FK constraint in `orden_de_trabajo`
  const { data: vehicles, error: vehErr } = await supa.from('vehiculo').select('id').limit(1);
  let vehicleId: string | null = null;
  if (vehicles && vehicles.length > 0) {
    vehicleId = vehicles[0].id;
    console.log("Found existing vehicle ID:", vehicleId);
  } else {
    console.log("Creating dummy vehicle...");
    const { data: newVeh, error: createVehErr } = await supa.from('vehiculo').insert({
      patente: `TEST${Math.floor(Math.random() * 1000)}`,
      marca: "Toyota",
      modelo: "Hilux",
      empresa_id: companyId
    }).select();
    if (createVehErr) {
      console.error("❌ Failed to create dummy vehicle:", createVehErr);
      return;
    }
    vehicleId = newVeh[0].id;
    console.log("Created vehicle ID:", vehicleId);
  }

  // C. Create a test work order
  console.log("Creating test work order...");
  const otId = "99999999-9999-4999-b999-999999999999";
  const folio = `TEST-OT-${Math.floor(Math.random() * 10000)}`;

  // Delete if already existing
  await supa.from('orden_de_trabajo').delete().eq('id', otId);

  const { data: newOt, error: otErr } = await supa.from('orden_de_trabajo').insert({
    id: otId,
    folio: folio,
    vehiculo_id: vehicleId,
    tipo: "CORRECTIVO",
    estado: "ABIERTA",
    prioridad: "MEDIA",
    kilometraje_apertura: 12000,
    empresa_id: companyId
  }).select();

  if (otErr) {
    console.error("❌ Failed to create test work order:", otErr);
    return;
  }
  console.log("✅ Created test work order:", newOt);

  // D. Test sub-table inserts
  console.log("\nTesting insert into ot_tareas_realizadas...");
  const { data: tData, error: tErr } = await supa.from('ot_tareas_realizadas').insert([
    {
      orden_id: otId,
      tiempo_real_minutos: 60,
      costo_real: 25.00,
      tarea_estandar: { id: "test-task", descripcion: "Standard Tuning", costoManoObra: 25.00 }
    }
  ]).select();
  if (tErr) {
    console.error("❌ ot_tareas_realizadas insert failed:", tErr);
  } else {
    console.log("✅ ot_tareas_realizadas insert succeeded:", tData);
  }

  console.log("\nTesting insert into detalle_insumo_ot...");
  const { data: iData, error: iErr } = await supa.from('detalle_insumo_ot').insert([
    {
      orden_id: otId,
      cantidad: 3,
      costo_unitario_aplicado: 12.50,
      costo_total: 37.50,
      repuesto: { id: "test-part", nombre: "Engine Filter Oil", precio: 12.50 }
    }
  ]).select();
  if (iErr) {
    console.error("❌ detalle_insumo_ot insert failed:", iErr);
  } else {
    console.log("✅ detalle_insumo_ot insert succeeded:", iData);
  }

  console.log("\nTesting insert into historial_ot...");
  const { data: hData, error: hErr } = await supa.from('historial_ot').insert([
    {
      orden_id: otId,
      usuario_nombre: "Test Mechanic",
      comentario: "Completed test task insertion"
    }
  ]).select();
  if (hErr) {
    console.error("❌ historial_ot insert failed:", hErr);
  } else {
    console.log("✅ historial_ot insert succeeded:", hData);
  }

  // Cleanup work order (cascades deletes to child tables)
  console.log("\nCleaning up test records...");
  const { error: delErr } = await supa.from('orden_de_trabajo').delete().eq('id', otId);
  if (delErr) {
    console.error("❌ Failed to clean up test work order:", delErr);
  } else {
    console.log("✅ Cleanup of test work order succeeded!");
  }
}

run();
