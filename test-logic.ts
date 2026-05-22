import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { calcularDatosPizarra } from "./src/lib/mantenimientoLogica";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function check() {
  const { data: vList } = await supabase.from('vehiculo').select('*');
  const { data: pList } = await supabase.from('mantenimiento_pauta').select('*, modelo:mantenimiento_modelo_vehiculo(nombre)');

  vList.forEach(v => {
    let pautasSecuencia: any[] = [];
    const kmsActuales = v.kilometraje_actual || 0;
    const detalles = v.detalles || {};
    
    // Copy the logic from Mantenimiento.tsx
    const normalizeStr = (s: any) => String(s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
    const vehModelo = normalizeStr(v.modelo);
    
    // We filter rules
    const rules = pList.filter((p: any) => {
        const pModelo = normalizeStr(p.modelo?.nombre);
        const vehAciete = normalizeStr(v.tipo_aceite);
        const pAciete = normalizeStr(p.tipo_aceite);
        return pModelo === vehModelo && (!pAciete || (vehAciete && pAciete === vehAciete));
    });

    rules.forEach((p: any) => {
         const km_ini = p.kilometraje_inicial || 0;
         const int1 = p.intervalo_1 || 0;
         const int2 = p.intervalo_2 || 0;
         const pautaName = String(p.nombre);
         let currentKm = km_ini;
         pautasSecuencia.push({ iteracion_km: currentKm, nombre: pautaName });

         if (int1 > 0) {
             let useInt1 = true;
             let nextKm = currentKm + (useInt1 ? int1 : int2 || int1);

             while (nextKm <= kmsActuales + 50000) { // Keep it small for test
                  pautasSecuencia.push({ iteracion_km: nextKm, nombre: pautaName });
                  if (int2 > 0) {
                      useInt1 = !useInt1;
                      nextKm += (useInt1 ? int1 : int2);
                  } else {
                      nextKm += int1;
                  }
             }
         }
    });

    pautasSecuencia.sort((a, b) => a.iteracion_km - b.iteracion_km);
    const uniqueKms = new Set();
    pautasSecuencia = pautasSecuencia.filter(item => {
         if (!uniqueKms.has(item.iteracion_km)) {
              uniqueKms.add(item.iteracion_km);
              return true;
         }
         return false;
    });

    const vDB: any = {
      id: v.id,
      numeroInterno: v.numero_interno?.toString() || '',
      patente: v.patente || '',
      kilometrajeActual: kmsActuales,
      fechaActualizacionKm: v.updated_at ? new Date(v.updated_at) : new Date(),
      intervaloMantencionKm: v.intervalo_km || 10000,
      kmPromedioDia: v.km_promedio_dia || 0,
      kmUltimaMantencion: v.km_ultima_mantencion || 0,
      fechaUltimaMantencion: v.fecha_ultima_mantencion ? new Date(v.fecha_ultima_mantencion) : null,
      tipoUltimaPauta: v.tipo_ultimo_mant || '',
      pautasSecuencia
    };

    const result = calcularDatosPizarra(vDB);
    console.log(`Vehiculo ${v.numero_interno} (${v.modelo}): Vencida: ${result.pautaVencida} | Proxima: ${result.tipoProximoMantencion}`);
  });
}
check();
