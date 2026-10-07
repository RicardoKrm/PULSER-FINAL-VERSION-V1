const fs = require('fs');

const path = 'src/pages/operaciones/ControlDocumental.tsx';
let content = fs.readFileSync(path, 'utf8');

// Find the start of checkDriverStatus
const startIndex = content.indexOf('const checkDriverStatus =');
// Find the start of handleSaveDriver
const endIndex = content.indexOf('const handleSaveDriver =');

if (startIndex !== -1 && endIndex !== -1) {
  const newFunctions = `  const msPorDia = 24 * 60 * 60 * 1000;

  const checkDriverStatus = (driver: any) => {
    let status = "EN ORDEN";
    let reasons: string[] = [];

    const licT = new Date(driver.vencimientoLicencia).getTime();
    const salT = new Date(driver.vencimientoSalud || driver.vencimientoLicencia).getTime();
    const isVacacionesVencidas = driver.vacaciones === "Vencidas";

    if (licT < today || salT < today || isVacacionesVencidas) {
      status = "VENCIDO";
      if (licT < today) reasons.push("Licencia Vencida");
      if (salT < today) reasons.push("Salud Vencida");
      if (isVacacionesVencidas) reasons.push("Vacaciones Vencidas");
    } else {
      let isProximo = false;
      if (licT < today + alertConfig.diasAvisoLicencia * msPorDia) {
        isProximo = true;
        reasons.push(\`Licencia próxima a vencer (<\${alertConfig.diasAvisoLicencia} días)\`);
      }
      if (salT < today + alertConfig.diasAvisoSalud * msPorDia) {
        isProximo = true;
        reasons.push(\`Salud próxima a vencer (<\${alertConfig.diasAvisoSalud} días)\`);
      }
      if (isProximo) status = "PROXIMO";
    }

    return { status, reasons };
  };

  const checkVehicleStatus = (vehicle: any) => {
    let status = "EN ORDEN";
    let reasons: string[] = [];

    const revT = new Date(vehicle.vencimientoRev).getTime();
    const segT = new Date(vehicle.vencimientoSeguro).getTime();
    const isOld = 2026 - vehicle.anio >= 15;

    if (revT < today || segT < today || isOld) {
      status = "VENCIDO";
      if (revT < today) reasons.push("Revisión Técnica Vencida");
      if (segT < today) reasons.push("Seguro Vencido");
      if (isOld) reasons.push(\`Bloqueo automático: Unidad cumple 15+ años\`);
    } else {
      let isProximo = false;
      if (revT < today + alertConfig.diasAvisoRevision * msPorDia) {
        isProximo = true;
        reasons.push(\`Revisión próxima a vencer (<\${alertConfig.diasAvisoRevision} días)\`);
      }
      if (segT < today + alertConfig.diasAvisoSeguro * msPorDia) {
        isProximo = true;
        reasons.push(\`Seguro próximo a vencer (<\${alertConfig.diasAvisoSeguro} días)\`);
      }
      if (isProximo) status = "PROXIMO";
    }

    return { status, reasons };
  };

  `;

  content = content.substring(0, startIndex) + newFunctions + content.substring(endIndex);
  fs.writeFileSync(path, content, 'utf8');
}
