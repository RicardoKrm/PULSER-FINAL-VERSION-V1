import fs from 'fs';
import path from 'path';

const file = path.resolve('src/pages/Dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

const regexUseMemo = /const \{[\s\S]*?\} = React\.useMemo\(\(\) => \{[\s\S]*?return \{[\s\S]*?\};\n  \}, \[ordenesTrabajo, vehiculos, dbVehiculos\]\);/;

const newUseMemo = `  const { 
    tendenciaData,
    estrategiaData,
    costosData,
    cuellosData,
    disponibilidad,
    cumplimientoPrev,
    gastoMensual,
    alertasCriticas,
    saludFlota
  } = React.useMemo(() => {
    
    // 1. Preventivas vs Correctivas
    const preventivas = (ordenesTrabajo || []).filter((ot: any) => ot.tipo === 'PREVENTIVA' || ot.tipo?.includes('PREVENTIVA'));
    const correctivas = (ordenesTrabajo || []).filter((ot: any) => ot.tipo === 'CORRECTIVA' || ot.tipo?.includes('CORRECTIVA') || ot.tipo?.includes('FALLA'));
    const prevCount = preventivas.length;
    const corrCount = correctivas.length;

    const estrategia = [
      { name: 'Preventivo', value: prevCount },
      { name: 'Correctivo', value: corrCount }
    ];

    // 2. Salud Flota y Disponibilidad
    let vencidos = 0;
    let proximos = 0;
    let alDia = 0;
    let vehiculosDisponibles = 0;

    const totalDb = dbVehiculos?.length || 0;
    (dbVehiculos || []).forEach((v: any) => {
       try {
         const calculo = calcularDatosPizarra(v);
         if (calculo.estatus === 'VENCIDO') {
           vencidos++;
         } else if (calculo.estatus === 'PROXIMO') {
           proximos++;
         } else {
           alDia++;
         }
         
         // Disp: Si no está en un estado que implique indisponibilidad (esto depende del negocio, pero por defecto asumimos todos menos los que están en taller crítico)
         // Para simplificar, asumimos disponible si no tiene OT abierta bloqueante. Aqui solo sumaremos.
         // Un proxy mas real: Asumir que vencidos o con estado "TALLER" o fallados no están disponibles.
         // Para este dashboard, todo esta disponible menos si tiene OT en curso.
       } catch (err) {
         alDia++; // Fallback
       }
    });

    const otsEnCurso = (ordenesTrabajo || []).filter((ot: any) => ['CREADA', 'EN_PROGRESO', 'PAUSADA'].includes(ot.estado)).map((ot: any) => ot.vehiculoId);
    let indisponibles = new Set(otsEnCurso).size;

    vehiculosDisponibles = totalDb > 0 ? totalDb - indisponibles : 0;
    const dispActual = totalDb > 0 ? (vehiculosDisponibles / totalDb) * 100 : 0;
    
    // Tendencia de disponibilidad real por meses (Simplified, just flat if no history)
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const tendencia = meses.map(m => ({
      name: m,
      value: dispActual // Sin historico real, devolvemos la misma linea
    }));

    // 3. Costos mensuales reales
    const currentMonth = new Date().getMonth();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const mesesNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    let currPrev = 0, currCorr = 0;
    let pastPrev = 0, pastCorr = 0;

    (ordenesTrabajo || []).forEach((ot: any) => {
        const d = new Date(ot.fechaCreacion || new Date());
        const mon = d.getMonth();
        const cost = (Number(ot.costoManoObraTareas) || 0) + (Number(ot.costoInsumos) || 0) + (Number(ot.costoManoObraHH) || 0);

        if (mon === currentMonth) {
            if (ot.tipo?.includes('PREVENTIVA')) currPrev += cost;
            else currCorr += cost;
        } else if (mon === prevMonth) {
            if (ot.tipo?.includes('PREVENTIVA')) pastPrev += cost;
            else pastCorr += cost;
        }
    });

    const costos = [
      { name: mesesNames[prevMonth], prev: pastPrev, corr: pastCorr },
      { name: mesesNames[currentMonth], prev: currPrev, corr: currCorr }
    ];

    const gastoTotalMesActual = currPrev + currCorr;

    // 4. Cuellos de botella reales
    const cuellosMap: Record<string, number> = {};
    (ordenesTrabajo || []).forEach((ot: any) => {
      if (ot.historial && Array.isArray(ot.historial)) {
        ot.historial.forEach((h: any) => {
          if (h.comentario && h.comentario.toLowerCase().includes('pausa')) {
             // Example extraction logic or just generic reason
             cuellosMap['Pausa en OT'] = (cuellosMap['Pausa en OT'] || 0) + 1;
          }
        });
      }
    });
    
    let cuellosArr = Object.entries(cuellosMap).map(([name, value]) => ({ name, value }));
    cuellosArr.sort((a, b) => b.value - a.value);

    // 5. Cumplimiento Prev
    const prevCompletadas = preventivas.filter((ot: any) => ot.estado === 'FINALIZADA' || ot.estado === 'CERRADA_MECANICO' || ot.estado === 'CERRADA_POR_MECANICO').length;
    let cumpPrev = prevCount > 0 ? (prevCompletadas / prevCount) * 100 : 0;
    
    // Y para el cumplimiento de cronograma base si no hay preventivas (usar saludFlota en su lugar como fallback de flota sana)
    if (prevCount === 0 && totalDb > 0) {
      cumpPrev = 100 - ((vencidos / totalDb) * 100);
    }

    return {
      tendenciaData: tendencia,
      estrategiaData: estrategia,
      costosData: costos,
      cuellosData: cuellosArr.slice(0, 5),
      disponibilidad: (dispActual || 0).toFixed(1),
      cumplimientoPrev: (cumpPrev || 0).toFixed(1),
      gastoMensual: gastoTotalMesActual.toLocaleString(),
      alertasCriticas: vencidos,
      saludFlota: { vencidos, proximos, alDia }
    };
  }, [ordenesTrabajo, vehiculos, dbVehiculos]);`;

content = content.replace(regexUseMemo, newUseMemo);

fs.writeFileSync(file, content);
console.log("Reworked Dashboard");
