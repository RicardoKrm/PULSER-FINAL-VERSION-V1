import fs from 'fs';
import path from 'path';

const fileDash = path.resolve('src/pages/Dashboard.tsx');
let contentDash = fs.readFileSync(fileDash, 'utf8');

const regexMap = /const mapped = data\.map[\s\S]*?\}\);/g;

const replacementMap = `const { data: pautasData } = await supabase.from('mantenimiento_pauta').select('*, modelo:mantenimiento_modelo_vehiculo(nombre)').eq('empresa_id', currentCompany.id);

        const mapped = data.map(v => {
          const detalles = v.detalles || {};
          const kmsActuales = typeof v.kilometraje_actual === 'number' ? v.kilometraje_actual : parseFloat(String(v.kilometraje_actual).replace(/[^0-9.-]+/g, '')) || 0;
          const rawKmUlt = v.km_ultima_mantencion !== undefined ? v.km_ultima_mantencion : (detalles.km_ultima_mantencion || 0);
          const kmUltMant = typeof rawKmUlt === 'number' ? rawKmUlt : parseFloat(String(rawKmUlt).replace(/[^0-9.-]+/g, '')) || 0;
          
          const rawInterval = v.intervalo_km !== undefined ? v.intervalo_km : (detalles.intervalo_km !== undefined ? detalles.intervalo_km : 10000);
          const kmInterv = typeof rawInterval === 'number' ? rawInterval : parseFloat(String(rawInterval).replace(/[^0-9.-]+/g, '')) || 10000;
          
          let pautasSecuencia: any[] = [];
          if (pautasData) {
              const pautasDelVehiculo = pautasData.filter(p => {
                 const normalizeStr = (s: any) => String(s || '').normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim().toUpperCase();
                 const vehModelo = normalizeStr(v.modelo);
                 const pModelo = normalizeStr(p.modelo?.nombre);
                 
                 const vehAciete = normalizeStr(v.tipo_aceite);
                 const pAciete = normalizeStr(p.tipo_aceite);

                 return (vehModelo === pModelo) && (!pAciete || (vehAciete && pAciete === vehAciete));
              });

              pautasDelVehiculo.forEach(p => {
                 const limiteKm = kmsActuales + 500000;
                 let currentKm = Number(p.kilometraje_inicial) || 0;
                 const int1 = Number(p.intervalo_1) || 0;
                 const int2 = p.intervalo_2 ? Number(p.intervalo_2) : 0;
                 
                 if (currentKm > 0 || int1 > 0) {
                     pautasSecuencia.push({ iteracion_km: currentKm, nombre: p.nombre });
                     
                     const nameUpper = (p.nombre || '').toUpperCase().trim();
                     if (int1 > 0 && !(nameUpper.startsWith('SI') || nameUpper.startsWith('R') || nameUpper.includes('INICIAL'))) {
                         let usarInt1 = true;
                         while (currentKm < limiteKm) {
                             if (int2 > 0) {
                                 currentKm += usarInt1 ? int1 : int2;
                                 usarInt1 = !usarInt1;
                             } else {
                                 currentKm += int1;
                             }
                             if (currentKm < limiteKm) {
                                 pautasSecuencia.push({ iteracion_km: currentKm, nombre: p.nombre });
                             }
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
          }

          return {
            id: v.id,
            numeroInterno: v.numero_interno || '',
            patente: v.patente || v.numero_interno || 'Sin PPU',
            kilometrajeActual: kmsActuales,
            kmUltimaMantencion: kmUltMant,
            intervaloMantencionKm: kmInterv,
            kmPromedioDia: v.km_promedio_dia || detalles.km_promedio_dia || 150,
            fechaUltimaMantencion: (v.fecha_ultima_mantencion || detalles.fecha_ultima_mantencion) ? new Date(v.fecha_ultima_mantencion || detalles.fecha_ultima_mantencion) : null,
            fechaActualizacionKm: v.fecha_actualizacion_km ? new Date(v.fecha_actualizacion_km) : new Date(),
            tipoUltimaPauta: v.tipo_ultimo_mant || detalles.tipo_ultimo_mant || v.tipo_ult_pauta || detalles.tipo_ult_pauta || '',
            pautasSecuencia
          };
        });`;

contentDash = contentDash.replace(regexMap, replacementMap);

fs.writeFileSync(fileDash, contentDash);
console.log("Patched Dashboard");
