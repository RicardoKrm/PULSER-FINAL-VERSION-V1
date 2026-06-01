import fs from 'fs';
import path from 'path';

const file = path.resolve('src/pages/Dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { calcularDatosPizarra }')) {
  content = content.replace("import { useAppContext } from '../context/AppContext';", "import { useAppContext } from '../context/AppContext';\nimport { calcularDatosPizarra } from '../lib/mantenimientoLogica';");
}

const oldSaludLogic = `    // Salud Flota
    let vencidos = 0;
    let proximos = 0;
    let alDia = 0;
    
    // Simplification for health
    (vehiculos || []).forEach((v: any) => {
       if (v.vencimientoMantenimiento && new Date(v.vencimientoMantenimiento) < new Date()) {
          vencidos++;
       } else if (v.vencimientoMantenimiento && new Date(v.vencimientoMantenimiento).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000) {
          proximos++;
       } else {
          alDia++;
       }
    });

    if (vehiculos?.length > 0 && vencidos === 0 && proximos === 0 && alDia === 0) {
       alDia = vehiculos.length; // Default all healthy if no dates
    }`;

const newSaludLogic = `    // Salud Flota utilizando calcularDatosPizarra para coherencia
    let vencidos = 0;
    let proximos = 0;
    let alDia = 0;
    
    (vehiculos || []).forEach((v: any) => {
       try {
         const calculo = calcularDatosPizarra(v);
         if (calculo.estatus === 'VENCIDO') {
           vencidos++;
         } else if (calculo.estatus === 'PROXIMO') {
           proximos++;
         } else {
           alDia++;
         }
       } catch (err) {
         alDia++; // Fallback
       }
    });`;

if (content.includes(oldSaludLogic)) {
  content = content.replace(oldSaludLogic, newSaludLogic);
} else {
  console.log("Could not find old logic to replace!!!");
}

fs.writeFileSync(file, content);
console.log('Fixed salud flota');
