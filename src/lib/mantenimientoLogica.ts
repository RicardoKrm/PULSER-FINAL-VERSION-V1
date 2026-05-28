export interface PautaEstructura {
    id: string;
    nombre: string;
    kilometraje_inicial: number;
    intervalo_1: number;
    intervalo_2?: number | null;
    tipo_aplicacion?: string;
}

export interface HitoSecuencia {
    iteracion_km: number;
    nombre: string;
}

/**
 * Genera la secuencia matemática de hitos kilométricos para una pauta preventiva específica.
 * Replica exactamente la lógica cíclica de Pulser V2.
 */
export function generarSecuenciaParaPauta(pauta: PautaEstructura, kilometrajeActual: number): HitoSecuencia[] {
    const secuencia: HitoSecuencia[] = [];
    
    const kmInicial = Number(pauta.kilometraje_inicial) || 0;
    const int1 = Number(pauta.intervalo_1) || 0;
    const int2 = pauta.intervalo_2 ? Number(pauta.intervalo_2) : 0;
    const pautaName = pauta.nombre || '';

    // 1. Agregar siempre el hito inicial
    secuencia.push({ iteracion_km: kmInicial, nombre: pautaName });

    // 2. Validar si es pauta de rodaje/inicial (las pautas de rodaje no se repiten)
    const nameUpper = pautaName.toUpperCase().trim();
    const isRodaje = nameUpper.startsWith('SI') || 
                     nameUpper.startsWith('R') || 
                     nameUpper.includes('INICIAL') || 
                     (pauta.tipo_aplicacion && pauta.tipo_aplicacion.toUpperCase().includes('INICIAL'));

    if (isRodaje || int1 <= 0) {
        return secuencia; // Retorna solo el hito inicial
    }

    // 3. Generar secuencia cíclica hasta el límite (KM Actual + 500k)
    let currentKm = kmInicial;
    let usarInt1 = true;
    const limiteKm = kilometrajeActual + 500000;

    while (currentKm < limiteKm) {
        if (int2 > 0) {
            currentKm += usarInt1 ? int1 : int2;
            usarInt1 = !usarInt1; // Alternar para el próximo salto
        } else {
            currentKm += int1;
        }

        // Agregar el hito solo si no supera el límite de proyección
        if (currentKm < limiteKm) {
            secuencia.push({ iteracion_km: currentKm, nombre: pautaName });
        }
    }

    return secuencia;
}

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
    
    // Tech sheet data integration
    marca?: string;
    modelo?: string;
    ano?: string | number;
    chasis?: string;
    motor?: string;
    norma?: string;
    aplicacion?: string;
    tipoAceite?: string;
    fecha_matriculacion?: string;
    detalles?: any;
    intervaloMantenimiento?: number;
    tipoIntervalo?: string;
    factorConversionHoras?: number | null;
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

    // Tech sheet data integration
    marca?: string;
    modelo?: string;
    ano?: string | number;
    chasis?: string;
    motor?: string;
    norma?: string;
    aplicacion?: string;
    tipoAceite?: string;
    fecha_matriculacion?: string;
    detalles?: any;
    intervaloMantenimiento?: number;
    tipoIntervalo?: string;
    factorConversionHoras?: number | null;
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
             if (vehiculo.pautasSecuencia.length > 0) {
                 tipoProximoMantencion = vehiculo.pautasSecuencia[vehiculo.pautasSecuencia.length - 1].nombre.split('-')[0].trim();
             }
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
        } else {
            // Paso 4: Calcular días restantes
            const diasRestantes = Math.round(kmsFaltantes / kmPromDia);
            
            // Paso 5: Proyectar la fecha exacta
            fechaProxima = new Date(hoy);
            fechaProxima.setDate(fechaProxima.getDate() + diasRestantes);
        }
    } else {
        // Si no hay km_prox_mant
        fechaProxima = null;
    }

    if (fechaProxima) {
        const diffTime = fechaProxima.getTime() - hoy.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 10) {
            semaforo10Dias = true;
        }
    }

    if (!tipoProximoMantencion || tipoProximoMantencion === "Siguiente Pauta") {
        tipoProximoMantencion = vehiculo.tipoUltimaPauta || "N/A";
    }

    // --- 4. RETORNO DEL OBJETO FORMATEADO PARA LA TABLA ---
    const formatearDiaMesAno = (d: Date | null) => {
        if (!d) return null;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    return {
        ...vehiculo,
        id: vehiculo.id,
        numeroInterno: vehiculo.numeroInterno,
        ppu: vehiculo.patente,
        kmUltimoMantencion: kmUltimo,
        fechaUltimoMantencion: vehiculo.fechaUltimaMantencion ? formatearDiaMesAno(vehiculo.fechaUltimaMantencion) || "—" : "—",
        tipoUltimoMantencion: vehiculo.tipoUltimaPauta || "N/A",
        
        cumplimiento: cumplimiento,
        estatus: estatus,
        kmVencido: kmVencido,
        pautaVencida: pautaVencidaStr,
        
        kmActual: kmActual,
        fechaKmActual: formatearDiaMesAno(vehiculo.fechaActualizacionKm) as string,
        
        kmProximoMantencion: kmProximo,
        tipoProximoMantencion: tipoProximoMantencion,
        semaforoPeligro10Dias: semaforo10Dias,
        fechaProximaMantencion: formatearDiaMesAno(fechaProxima)
    };
}

