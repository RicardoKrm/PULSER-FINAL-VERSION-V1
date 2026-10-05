import React, { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useSyncOdometers(activeCompanyId: string | null, setVehiculos?: React.Dispatch<React.SetStateAction<any[]>>) {
  const isSyncing = useRef(false);

  useEffect(() => {
    if (!activeCompanyId) return;

    const doSync = async () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      try {
         const [vehiculosRes, configRes] = await Promise.all([
            supabase.from('vehiculo').select('id, patente, kilometraje_actual, km_ultima_mantencion, detalles').eq('empresa_id', activeCompanyId),
            supabase.from('empresa').select('detalles').eq('id', activeCompanyId).single()
         ]);
         
         if (!vehiculosRes.data || vehiculosRes.error) return;
         
         let configured = vehiculosRes.data.filter(v => {
            if (v.detalles?.gps_proveedor) return true;
            return false;
         });
         
         if (configured.length === 0) return;
         
         let apiKeys: any = {};
         if (configRes.data && configRes.data.detalles) {
             apiKeys = configRes.data.detalles.gps_config || {};
         }

         let gps2Data: any[] = [];
         if (apiKeys.traccar_url && apiKeys.traccar_user && apiKeys.traccar_pass) {
            try {
                const res = await fetch("/api/gps/sync-gps2", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        url: apiKeys.traccar_url,
                        username: apiKeys.traccar_user,
                        password: apiKeys.traccar_pass
                    })
                });
                if (res.ok) {
                    const parsed = await res.json();
                    if (Array.isArray(parsed)) gps2Data = parsed;
                }
            } catch (e) {
                console.error("BG sync: Error fetching GPS2:", e);
            }
         }

         await Promise.all(configured.map(async (v) => {
            const prov = v.detalles?.gps_proveedor;
            let newKm = v.kilometraje_actual || 0;
            let updatedTimestamp: string | null = null;
            let hasUpdate = false;
            
            if (prov === 'traccar') {
                const registro = gps2Data.find((x: any) => x.plateNumber === v.patente);
                if (registro && registro.odometer) {
                    let km = parseFloat(registro.odometer);

                    // 1. Detección automática de escala (hectómetros, metros o décimas de km)
                    // Ej: Si el GPS reporta 881051 para un vehículo cuya mantención o rango está en ~84.484 km,
                    // el valor real es 88105.1 km (escala x10 común en reportes GPS).
                    const kmBaseRef = Number(v.km_ultima_mantencion || v.detalles?.km_ultima_mantencion || v.kilometraje_actual || 0);
                    if (kmBaseRef > 1000 && km > (kmBaseRef * 4) && Math.abs((km / 10) - kmBaseRef) < kmBaseRef) {
                        km = Math.round((km / 10) * 100) / 100;
                    }

                    // 2. Respetar calibración manual si el usuario ingresó un valor en la pizarra:
                    const fechaManualStr = v.detalles?.fecha_odometro_manual;
                    const fechaManual = fechaManualStr ? new Date(fechaManualStr) : null;
                    const fechaGps = registro.timestamp ? new Date(registro.timestamp) : null;
                    const esManualReciente = fechaManual && (!fechaGps || fechaGps <= fechaManual);

                    if (esManualReciente && v.detalles?.km_manual) {
                        const kmManualVal = Number(v.detalles.km_manual);
                        const delta = km - kmManualVal;
                        // Solo avanzar si el GPS reporta un recorrido incremental coherente posterior a la calibración
                        if (delta > 0 && delta < 2000) {
                            newKm = kmManualVal + delta;
                            hasUpdate = true;
                        }
                    } else if (km > newKm) {
                        // Evitar saltos anómalos imposibles (ej: más de 50.000 km de golpe)
                        if (newKm <= 0 || (km - newKm) < 50000) {
                            newKm = km;
                            hasUpdate = true;
                        }
                    }
                }
            } else if (prov === 'dominio') {
               try {
                   const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzgwNTk0MDAxLCJleHAiOjQ5MzQxOTQwMDF9.XSMC_zxhn-d_BXzsWLuILtVkep4QxIhekRBGR0Hc8WA';
                   const now = new Date();
                   let past = v.detalles?.fecha_actualizacion_km ? new Date(v.detalles.fecha_actualizacion_km) : null;
                   
                   // Si falló el parseo anterior o no hay
                   if (!past || isNaN(past.getTime())) {
                       past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                   }
                   
                   const formatLocalStr = (d: Date) => {
                      const pad = (n: number) => n.toString().padStart(2, '0');
                      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                   };

                   const desde = formatLocalStr(past);
                   const hasta = formatLocalStr(now);

                   const res = await fetch('/api/gps/dominio', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ patente: v.patente, desde, hasta, token })
                   });
                   if (res.ok) {
                       const data = await res.json();
                       updatedTimestamp = data.lastTimestamp;
                       if (data.totalKm && data.totalKm > 0) {
                            newKm += data.totalKm;
                            hasUpdate = true;
                       }
                   }
               } catch(e) {
                  // silent
               }
            } else if (prov === 'gpsglobal' && apiKeys.gpsglobal) {
                 // For gpsglobal, they don't seem to have odometer implemented in backend logic.
                 // It just returns lat/lng.
                 // Keep it as is
            }

            if (hasUpdate && !v.id.toString().startsWith('mock')) {
                const detalles = v.detalles || {};
                const updates: any = { detalles };
                
                if (newKm > (v.kilometraje_actual || 0)) {
                    // Asegurarse de mantener precision de Km
                    newKm = Math.round(newKm * 100) / 100;
                    updates.kilometraje_actual = newKm;
                    
                    if (updatedTimestamp && !isNaN(new Date(updatedTimestamp).getTime())) {
                        detalles.fecha_actualizacion_km = new Date(updatedTimestamp).toISOString();
                    } else {
                        detalles.fecha_actualizacion_km = new Date().toISOString();
                    }
                    updates.fecha_actualizacion_km = detalles.fecha_actualizacion_km;
                }
                
                const { error } = await supabase.from('vehiculo').update(updates).eq('id', v.id);
                if (!error) {
                    console.log(`BG Sync updated Vehiculo ${v.patente}`);
                    if (setVehiculos && updates.kilometraje_actual) {
                        setVehiculos(prev => prev.map(veh => veh.id === v.id ? { ...veh, kilometraje_actual: newKm, detalles: { ...veh.detalles, ...detalles } } : veh));
                    } else if (setVehiculos) {
                        setVehiculos(prev => prev.map(veh => veh.id === v.id ? { ...veh, detalles: { ...veh.detalles, ...detalles } } : veh));
                    }

                    if (typeof window !== 'undefined' && updates.kilometraje_actual) {
                        window.dispatchEvent(new CustomEvent('vehiculo-actualizado', {
                            detail: {
                                vehiculoId: v.id,
                                kmActual: newKm,
                                fechaActualizacionKm: detalles.fecha_actualizacion_km
                            }
                        }));
                    }
                }
            }
         }));
      } catch (e) {
         console.error("BG sync error:", e);
      } finally {
         isSyncing.current = false;
      }
    };

    doSync();
    // Real-time polling every 3 minutes globally
    const interval = setInterval(doSync, 3 * 60000);
    return () => clearInterval(interval);
  }, [activeCompanyId]);
}
