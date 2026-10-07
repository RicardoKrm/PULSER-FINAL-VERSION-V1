const fs = require('fs');

let content = fs.readFileSync('src/pages/operaciones/ControlDocumental.tsx', 'utf8');

const oldCheckDocument = `  const checkDocument = (dateStr: string, warningDays: number) => {
    if (!dateStr) return { status: 'FALTANTE', text: 'No registrado' };
    const t = new Date(dateStr).getTime();
    if (t < today) return { status: 'VENCIDO', text: 'Vencido' };
    if (t < today + warningDays * msPorDia) return { status: 'PROXIMO', text: 'Próximo a vencer' };
    return { status: 'EN ORDEN', text: 'Vigente' };
  };`;

const newCheckDocument = `  const checkDocument = (dateStr: string, warningDays: number) => {
    if (!dateStr) return { status: 'FALTANTE', text: 'No registrado', date: '' };
    
    // Formatear a DD/MM/YYYY
    const [y, m, d] = dateStr.split('-');
    const dateFormatted = d && m && y ? \`\${d}/\${m}/\${y}\` : dateStr;

    const t = new Date(dateStr).getTime();
    if (t < today) return { status: 'VENCIDO', text: 'Vencido', date: dateFormatted };
    if (t < today + warningDays * msPorDia) return { status: 'PROXIMO', text: 'Próximo a vencer', date: dateFormatted };
    return { status: 'EN ORDEN', text: 'Vigente', date: dateFormatted };
  };`;

content = content.replace(oldCheckDocument, newCheckDocument);

content = content.replace(
  `{docObj.text}`,
  `{docObj.date ? \`\${docObj.date} (\${docObj.text})\` : docObj.text}`
);

// We should also ensure the vida útil string correctly handles the new date property.
// In checkVehicleStatus: `docVidaUtil = { status: 'EN ORDEN', text: 'Vigente' };`
// and later: `docVidaUtil.text = ...`
// We need to inject date: '' there to prevent undefined issues if needed, but the ternary docObj.date handles it.

fs.writeFileSync('src/pages/operaciones/ControlDocumental.tsx', content, 'utf8');
