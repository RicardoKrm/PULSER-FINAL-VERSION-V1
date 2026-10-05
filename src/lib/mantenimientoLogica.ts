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

export function normalizeTexto(s: any): string {
    return String(s || '')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase();
}

export function obtenerCategoriaAceite(aceite: any): string {
    const o = normalizeTexto(aceite);
    if (!o) return 'UNKNOWN';
    if (o.includes('SINTET') || o.includes('SYNTH') || o === '5W30' || o === '5W40' || o === '0W20' || o === '0W30' || o === '0W40') {
        return 'SINTETICO';
    }
    if (o.includes('SEMI') || o === '10W40' || o === '10W30') {
        return 'SEMI-SINTETICO';
    }
    if (o.includes('MINER') || o === '15W40' || o === '20W50') {
        return 'MINERAL';
    }
    return o;
}

export function limpiarNombreModelo(modelo: any): string {
    let s = normalizeTexto(modelo);
    if (s.includes('/')) s = s.split('/').pop()!.trim();
    // Remover marcas comunes si vienen pegadas al modelo
    s = s.replace(/^(MERCEDES BENZ|MERCEDES-BENZ|MERCEDES|HYUNDAI|TOYOTA|VOLVO|SCANIA|CHEVROLET|FORD|PEUGEOT|CITROEN|FIAT|VOLKSWAGEN|VW)\s+/, '');
    return s.trim();
}

/**
 * Obtiene la secuencia consolidada y ordenada de pautas de mantenimiento para un vehículo específico,
 * resolviendo compatibilidad de modelo y tipo/viscosidad de aceite.
 */
export function obtenerPautasSecuenciaParaVehiculo(
    vehiculoModelo: any,
    vehiculoAceite: any,
    kmsActuales: number,
    todasLasPautas: any[]
): HitoSecuencia[] {
    if (!todasLasPautas || todasLasPautas.length === 0) return [];

    const vMod = limpiarNombreModelo(vehiculoModelo);
    const vOilCat = obtenerCategoriaAceite(vehiculoAceite);

    const pautasCompatibles = todasLasPautas.filter(p => {
        const pMod = limpiarNombreModelo(p.modelo?.nombre || p.nombre_modelo_vehiculo || p.modelo_nombre || '');
        const pOilCat = obtenerCategoriaAceite(p.tipo_aceite);

        // 1. Compatibilidad de Modelo (igualdad o inclusión mutua)
        const modelMatch = vMod === pMod || (vMod && pMod && (vMod.includes(pMod) || pMod.includes(vMod)));
        if (!modelMatch) return false;

        // 2. Compatibilidad de Aceite
        // Si la pauta no especifica aceite o el vehículo no lo tiene, es compatible
        if (!p.tipo_aceite || !vehiculoAceite) return true;
        // Si coinciden en categoría de aceite (ej: 5W30 -> SINTETICO)
        if (vOilCat === pOilCat) return true;

        // Si la categoría difiere pero el modelo en la BD no tiene pautas específicas para el otro aceite,
        // se asume que las pautas existentes del modelo aplican
        const pautasHermanas = todasLasPautas.filter(sib => {
            const sibMod = limpiarNombreModelo(sib.modelo?.nombre || sib.nombre_modelo_vehiculo || sib.modelo_nombre || '');
            return sibMod === pMod || (sibMod && pMod && (sibMod.includes(pMod) || pMod.includes(sibMod)));
        });
        const existePautaEspecificaAceite = pautasHermanas.some(sib => obtenerCategoriaAceite(sib.tipo_aceite) === vOilCat);
        if (!existePautaEspecificaAceite) {
            return true;
        }

        return false;
    });

    let pautasSecuencia: HitoSecuencia[] = [];
    pautasCompatibles.forEach(p => {
        const estructura: PautaEstructura = {
            id: String(p.id || ''),
            nombre: p.nombre || p.nombre_pauta || '',
            kilometraje_inicial: Number(p.kilometraje_inicial ?? p.kilometraje_pauta ?? p.cronograma_en_km ?? 0),
            intervalo_1: Number(p.intervalo_1 ?? p.intervalo_km ?? 0),
            intervalo_2: p.intervalo_2 !== undefined ? (p.intervalo_2 ? Number(p.intervalo_2) : null) : (p['intervalo_km 2'] ? Number(p['intervalo_km 2']) : null),
            tipo_aplicacion: p.tipo_aplicacion || p['tipo_aplicación'] || ''
        };
        const seq = generarSecuenciaParaPauta(estructura, kmsActuales);
        pautasSecuencia = [...pautasSecuencia, ...seq];
    });

    // Ordenar matemáticamente de menor a mayor KM
    pautasSecuencia.sort((a, b) => a.iteracion_km - b.iteracion_km);

    // Desduplicar conservando el primer hito de cada KM
    const uniqueKms = new Set<number>();
    return pautasSecuencia.filter(item => {
        if (!uniqueKms.has(item.iteracion_km)) {
            uniqueKms.add(item.iteracion_km);
            return true;
        }
        return false;
    });
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

export function formatearDiaMesAno(d: Date | null): string | null {
    if (!d) return null;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
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
            const primerHito = kmUltimoRedondeado + intervalo;

            if (kmActual > primerHito) {
                // Hay un hito vencido en el pasado
                kmVencido = kmActual - primerHito;
                estatus = "VENCIDO";
                pautaVencidaStr = `Mant. de ${primerHito.toLocaleString('es-CL')} km`;

                // Avanzar al próximo hito estrictamente futuro
                let hitoFuturo = primerHito;
                while (hitoFuturo <= kmActual) {
                    hitoFuturo += intervalo;
                }
                proximoHitoVencimiento = hitoFuturo;
            } else {
                proximoHitoVencimiento = primerHito;
                const kmsFaltantes = proximoHitoVencimiento - kmActual;
                if (kmsFaltantes > 0 && kmsFaltantes <= (intervalo * 0.25)) {
                    estatus = "PROXIMO";
                }
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

