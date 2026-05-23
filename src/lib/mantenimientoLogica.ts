// 1. Datos de entrada (Lo que viene de tu Base de Datos)
export interface VehiculoDB {
    id: string | number;
    numeroInterno: string;
    patente: string; // PPU
    kilometrajeActual: number;
    fechaActualizacionKm: Date;
    intervaloMantencionKm: number;
    kmPromedioDia: number;
    // Datos del último mantenimiento (Viene de la última OT o del registro manual)
    kmUltimaMantencion: number;
    fechaUltimaMantencion: Date | null;
    tipoUltimaPauta: string;
    pautasSecuencia?: { iteracion_km: number; nombre: string }[];
}

// 2. Estructura exacta de las 16 columnas de salida para la tabla
export interface FilaPizarraMantenimiento {
    id: string | number; // Added so we can uniquely identify
    // Identificación
    numeroInterno: string;          // 1. N° Int.
    ppu: string;                    // 2. PPU
    
    // Historial
    kmUltimoMantencion: number;     // 3. KM Últ. Mant.
    fechaUltimoMantencion: string;  // 4. F. Últ. Mant.
    tipoUltimoMantencion: string;   // 5. Tipo Mant.
    
    // Análisis de Desviación
    cumplimiento: "NORMAL" | "ANTICIPADO" | "RETRASADO" | "N/A"; // 6. Cumplimiento
    estatus: "NORMAL" | "PROXIMO" | "VENCIDO";                   // 7. Estatus
    kmVencido: number | null;                                    // 8. Km Vencido
    pautaVencida: string | null;                                 // 9. Pauta Vencida
    
    // Estado Actual
    kmActual: number;               // 10. KM Actual
    fechaKmActual: string;          // 11. Fecha KM Actual
    
    // Proyección Futura
    kmProximoMantencion: number | null;    // 12. KM Próx. Mant.
    tipoProximoMantencion: string;         // 13. Tipo Próx. Mant.
    semaforoPeligro10Dias: boolean;        // 14. Semáf. (Rojo=true, Verde=false)
    fechaProximaMantencion: string | null; // 15. Fecha Próx. Mant.
    
    // 16. Acciones es UI (HTML/Botones), no requiere lógica de datos aquí.
}

/**
 * Procesa un vehículo y devuelve las columnas calculadas para la Pizarra.
 */
export function calcularDatosPizarra(vehiculo: VehiculoDB): FilaPizarraMantenimiento {
    const hoy = new Date();
    
    // --- INICIALIZACIÓN DE VARIABLES BASE ---
    const kmActual = vehiculo.kilometrajeActual;
    const kmUltimo = vehiculo.kmUltimaMantencion;
    const intervalo = vehiculo.intervaloMantencionKm;
    
    let cumplimiento: "NORMAL" | "ANTICIPADO" | "RETRASADO" | "N/A" = "N/A";
    let estatus: "NORMAL" | "PROXIMO" | "VENCIDO" = "NORMAL";
    let kmVencido: number | null = null;
    let kmProximo: number | null = null;
    let fechaProxima: Date | null = null;
    let semaforo10Dias = false;

    let tipoProximoMantencion = "Siguiente Pauta";
    let pautaVencidaStr: string | null = null;

    // --- 1. ENCONTRAR PRÓXIMO HITO Y VENCIDOS BASADOS EN PAUTAS O INTERVALO GENÉRICO ---
    let proximoHitoVencimiento = 0;
    
    if (vehiculo.pautasSecuencia && vehiculo.pautasSecuencia.length > 0) {
        // --- Cálculo de Pauta Vencida ---
        const hasHistoryOrPastPhase = kmUltimo > 0 || kmActual > (intervalo * 1.5);
        let pautasOmitidas = vehiculo.pautasSecuencia.filter(
             p => p.iteracion_km > kmUltimo && p.iteracion_km <= kmActual
        );

        if (hasHistoryOrPastPhase && pautasOmitidas.length > 0) {
             pautasOmitidas = pautasOmitidas.filter(p => {
                  const name = (p.nombre || '').toUpperCase().trim();
                  return !(name.startsWith('SI') || name.startsWith('R') || name.includes('INICIAL'));
             });
        }

        if (pautasOmitidas.length > 0) {
             const pautasFormateadas = pautasOmitidas.map(p => p.nombre.split('-')[0].trim());
             const pautasUnicas = Array.from(new Set(pautasFormateadas));
             pautaVencidaStr = pautasUnicas.join(', ');
             
             // Si hay pautas vencidas, el vehículo está VENCIDO y calculamos su km vencido desde la primera pauta omitida.
             kmVencido = kmActual - pautasOmitidas[0].iteracion_km;
             estatus = "VENCIDO";
        }

        // --- Cálculo de Tipo Próx. Mant. ---
        let pautasFuturas = vehiculo.pautasSecuencia.filter(p => p.iteracion_km > kmActual);
        
        // Excepción de Rodaje: Si el camión ya pasó su fase inicial, ignora SI y R
        if (pautasFuturas.length > 0) {
             if (hasHistoryOrPastPhase) {
                  const pautasFiltradas = pautasFuturas.filter(p => {
                       const name = (p.nombre || '').toUpperCase().trim();
                       return !(name.startsWith('SI') || name.startsWith('R') || name.includes('INICIAL'));
                  });
                  // Si después de filtrar nos quedamos vacíos (no debería pasar), usamos las sin filtrar
                  if (pautasFiltradas.length > 0) {
                       pautasFuturas = pautasFiltradas;
                  }
             }

             proximoHitoVencimiento = pautasFuturas[0].iteracion_km;
             tipoProximoMantencion = pautasFuturas[0].nombre.split('-')[0].trim();
             
             // Verificar estatus PROXIMO si no estaba vencido
             if (estatus !== "VENCIDO") {
                 const kmsFaltantes = proximoHitoVencimiento - kmActual;
                 if (kmsFaltantes > 0 && kmsFaltantes <= (intervalo * 0.25)) {
                     estatus = "PROXIMO";
                 }
             }
        } else {
             // Fallback si superamos la secuencia generada genéricamente
             proximoHitoVencimiento = (Math.round(kmActual / intervalo) * intervalo) + intervalo;
             if (estatus !== "VENCIDO") {
                  const kmsFaltantes = proximoHitoVencimiento - kmActual;
                  if (kmsFaltantes > 0 && kmsFaltantes <= (intervalo * 0.25)) {
                      estatus = "PROXIMO";
                  }
             }
        }
    } else {
        // --- LÓGICA DE FALLBACK (SI NO HAY SECUENCIA PAUTAS) ---
        if (kmUltimo > 0 && intervalo > 0) {
            const kmUltimoRedondeado = Math.round(kmUltimo / intervalo) * intervalo;
            proximoHitoVencimiento = kmUltimoRedondeado + intervalo;
            const kmsFaltantes = proximoHitoVencimiento - kmActual;

            const diferenciaVencida = kmActual - proximoHitoVencimiento;
            if (diferenciaVencida > 0) {
                kmVencido = diferenciaVencida;
                estatus = "VENCIDO";
                pautaVencidaStr = `Mant. de ${proximoHitoVencimiento.toLocaleString('es-CL')} km`;
            } else if (kmsFaltantes > 0 && kmsFaltantes <= (intervalo * 0.25)) {
                estatus = "PROXIMO";
            }
        }
    }
    
    kmProximo = proximoHitoVencimiento > 0 ? proximoHitoVencimiento : null;

    // --- 2. CÁLCULO DE CUMPLIMIENTO (Tolerancia del 10%) ---
    if (kmUltimo > 0 && intervalo > 0) {
        const hitoIdeal = Math.round(kmUltimo / intervalo) * intervalo;
        const tolerancia = intervalo * 0.10; // 10% de tolerancia

        if (kmUltimo < (hitoIdeal - tolerancia)) {
            cumplimiento = "ANTICIPADO";
        } else if (kmUltimo > (hitoIdeal + tolerancia)) {
            cumplimiento = "RETRASADO";
        } else {
            cumplimiento = "NORMAL";
        }
    }

    // --- 3. PROYECCIÓN DE FECHA Y SEMÁFORO (Predicción con KM/Día) ---
    if (kmProximo !== null && kmProximo > 0) {
        // Paso 2: Calcular KMs faltantes
        const kmsFaltantes = kmProximo - kmActual;
        
        // Paso 3: Promedio KM Diario con condición de seguridad
        const kmPromDia = (vehiculo.kmPromedioDia && vehiculo.kmPromedioDia > 0) ? vehiculo.kmPromedioDia : 25;
        
        if (kmsFaltantes <= 0) {
            // Paso 6: Caso Vencido
            fechaProxima = new Date(hoy);
            semaforo10Dias = true;
        } else {
            // Paso 4: Calcular días restantes
            const diasRestantes = Math.round(kmsFaltantes / kmPromDia);
            
            // Paso 5: Proyectar la fecha exacta
            fechaProxima = new Date(hoy);
            fechaProxima.setDate(fechaProxima.getDate() + diasRestantes);
            
            // Paso 7: Semáforo 10 días
            if (diasRestantes <= 10 && diasRestantes >= 0) {
                semaforo10Dias = true;
            }
        }
    } else {
        // Si no hay km_prox_mant
        fechaProxima = null;
    }

    // --- 4. RETORNO DEL OBJETO FORMATEADO PARA LA TABLA ---
    return {
        id: vehiculo.id,
        numeroInterno: vehiculo.numeroInterno,
        ppu: vehiculo.patente,
        kmUltimoMantencion: kmUltimo,
        fechaUltimoMantencion: vehiculo.fechaUltimaMantencion ? vehiculo.fechaUltimaMantencion.toISOString().split('T')[0] : "—",
        tipoUltimoMantencion: vehiculo.tipoUltimaPauta || "N/A",
        
        cumplimiento: cumplimiento,
        estatus: estatus,
        kmVencido: kmVencido,
        pautaVencida: pautaVencidaStr,
        
        kmActual: kmActual,
        fechaKmActual: vehiculo.fechaActualizacionKm.toISOString().split('T')[0],
        
        kmProximoMantencion: kmProximo,
        tipoProximoMantencion: tipoProximoMantencion,
        semaforoPeligro10Dias: semaforo10Dias,
        fechaProximaMantencion: fechaProxima ? fechaProxima.toISOString().split('T')[0] : null
    };
}

