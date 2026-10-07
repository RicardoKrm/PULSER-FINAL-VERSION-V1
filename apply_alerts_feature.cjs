const fs = require('fs');
const path = 'src/pages/operaciones/ControlDocumental.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add alertConfig to state
content = content.replace(
  'const today = new Date().getTime();',
  `const [alertConfig, setAlertConfig] = useState({
    diasAvisoLicencia: 15,
    diasAvisoSalud: 15,
    diasAvisoRevision: 30,
    diasAvisoSeguro: 30
  });\n\n  const today = new Date().getTime();`
);

// 2. Add alertConfig loading to useEffect
content = content.replace(
  `  useEffect(() => {
    fetchData();
  }, [activeCompanyId]);`,
  `  useEffect(() => {
    if (activeCompanyId) {
      const saved = localStorage.getItem(\`config_alertas_\${activeCompanyId}\`);
      if (saved) {
        setAlertConfig(JSON.parse(saved));
      }
    }
    fetchData();
  }, [activeCompanyId]);`
);

// 3. Replace the check functions securely
const msPorDiaDecl = 'const msPorDia = 24 * 60 * 60 * 1000;';
const startIndex = content.indexOf('const checkDriverStatus');
const endIndex = content.indexOf('const handleSaveDriver');

const newFunctions = `
  const msPorDia = 24 * 60 * 60 * 1000;

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

// 4. Update UI replacements
// Instead of chaining global replaces that might miss some instances, 
// we'll explicitly replace known text chunks.

content = content.replace(/status === "ACTIVO"/g, 'status === "EN ORDEN"');
content = content.replace(/status === "BLOQUEADO"/g, 'status === "VENCIDO"');
content = content.replace(/status !== "ACTIVO"/g, 'status !== "EN ORDEN"');
content = content.replace(/status !== "BLOQUEADO"/g, 'status !== "VENCIDO"');

// Fix the badges
content = content.replace(
  /"bg-emerald-500 hover:bg-emerald-600"/g, 
  '"bg-emerald-500 hover:bg-emerald-600 text-white"'
);
content = content.replace(
  /"bg-red-500 hover:bg-red-600 animate-pulse"/g,
  '(status === "PROXIMO" ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse" : "bg-red-500 hover:bg-red-600 text-white animate-pulse")'
);

// Fix alert lists background and text color classes
content = content.replace(
  /className="mt-3 bg-red-50 dark:bg-red-900\/10 p-2 rounded border border-red-100 dark:border-red-900\/30"/g,
  'className={`mt-3 p-2 rounded border ` + (status === "VENCIDO" ? "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30" : "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30")}'
);
content = content.replace(
  /className="text-xs text-red-600 dark:text-red-400 font-medium space-y-0.5"/g,
  'className={`text-xs font-medium space-y-0.5 ` + (status === "VENCIDO" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400")}'
);

content = content.replace(
  /className="text-xs font-bold text-red-600 dark:text-red-400 mt-3 p-2 rounded border bg-red-50 dark:bg-red-900\/10 border-red-100 dark:border-red-900\/30"/g,
  'className={`text-xs font-bold ` + (status === "VENCIDO" ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30" : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30")}'
);

content = content.replace(
  /className="bg-white dark:bg-slate-900 border p-4 rounded-xl cursor-pointer hover:shadow-md transition-all \$\{status === "VENCIDO" \? "border-red-300 dark:border-red-900\/50 hover:border-red-400" : "border-slate-200 dark:border-slate-800 hover:border-indigo-400"\}"/g,
  'className={`bg-white dark:bg-slate-900 border p-4 rounded-xl cursor-pointer hover:shadow-md transition-all ${status === "VENCIDO" ? "border-red-300 dark:border-red-900/50 hover:border-red-400" : status === "PROXIMO" ? "border-amber-300 dark:border-amber-900/50 hover:border-amber-400" : "border-slate-200 dark:border-slate-800 hover:border-indigo-400"}`}'
);

fs.writeFileSync(path, content, 'utf8');
