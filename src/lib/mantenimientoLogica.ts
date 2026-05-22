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

    // --- 1. CÁLCULO DE CUMPLIMIENTO (Tolerancia del 10%) ---
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

    // --- 2. CÁLCULO DE VENCIMIENTOS Y ESTATUS (Tolerancia 25%) ---
    if (kmUltimo > 0 && intervalo > 0) {
        const kmUltimoRedondeado = Math.round(kmUltimo / intervalo) * intervalo;
        const proximoHitoVencimiento = kmUltimoRedondeado + intervalo;
        const kmsFaltantes = proximoHitoVencimiento - kmActual;

        // ¿Está vencido?
        const diferenciaVencida = kmActual - proximoHitoVencimiento;
        if (diferenciaVencida > 0) {
            kmVencido = diferenciaVencida;
            estatus = "VENCIDO";
        } 
        // ¿Está próximo? (Si falta menos del 25% del intervalo)
        else if (kmsFaltantes > 0 && kmsFaltantes <= (intervalo * 0.25)) {
            estatus = "PROXIMO";
        }
        
        kmProximo = proximoHitoVencimiento;
    }

    // --- 3. PROYECCIÓN DE FECHA Y SEMÁFORO (Predicción con KM/Día) ---
    if (kmProximo !== null && vehiculo.kmPromedioDia > 0) {
        const kmsParaPauta = kmProximo - kmActual;
        
        if (kmsParaPauta > 0) {
            // Calculamos días faltantes y los sumamos a la fecha de hoy
            const diasFaltantes = kmsParaPauta / vehiculo.kmPromedioDia;
            fechaProxima = new Date();
            fechaProxima.setDate(hoy.getDate() + Math.round(diasFaltantes));

            // Si faltan 10 días o menos, se enciende el semáforo rojo
            if (diasFaltantes <= 10) {
                semaforo10Dias = true;
            }
        } else {
            // Si ya se pasó (kms negativos), la fecha debió ser hoy o antes
            fechaProxima = hoy;
            semaforo10Dias = true;
        }
    }

    let tipoProximoMantencion = "Siguiente Pauta";
    let pautaVencidaStr: string | null = null;
    
    // Si tenemos la secuencia de pautas, intentamos buscar la correcta
    if (vehiculo.pautasSecuencia && vehiculo.pautasSecuencia.length > 0) {
        // Encontrar la pauta próxima según el kmProximo
        if (kmProximo !== null) {
            const pautaProx = vehiculo.pautasSecuencia.find(p => p.iteracion_km === kmProximo || p.iteracion_km > kmActual);
            if (pautaProx) {
                tipoProximoMantencion = pautaProx.nombre;
                // Ajustamos el kmProximo si la secuencia tiene un iteracion_km específico mayor
                if (pautaProx.iteracion_km > kmActual) {
                    kmProximo = pautaProx.iteracion_km;
                }
            }
        }
        
        // Encontrar la pauta vencida
        if (kmVencido && kmVencido > 0) {
            // Buscamos todas las pautas entre el último mantenimiento (o el actual - vencido) y el actual
            const kmInicioBusqueda = kmActual - kmVencido;
            const pautas = vehiculo.pautasSecuencia
                .filter(p => p.iteracion_km >= kmInicioBusqueda && p.iteracion_km <= kmActual)
                .map(p => p.nombre.split('-')[0].trim());
                
            if (pautas.length > 0) {
                pautaVencidaStr = pautas.join(', ');
            } else {
                pautaVencidaStr = "Pauta Vencida Detectada";
            }
        }
    } else {
        if (kmVencido && kmVencido > 0) {
            pautaVencidaStr = "Pauta Vencida Detectada";
        }
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

