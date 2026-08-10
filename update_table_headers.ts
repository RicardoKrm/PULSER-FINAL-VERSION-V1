import fs from 'fs';

let content = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf8');

// Update labels in table headers
content = content.replace(/Pozo \/ Sub-Pozo/g, "Supervisor / Día del Mes");
content = content.replace(/>Pozo</g, ">Supervisor<");
content = content.replace(/>Sub-Pozo</g, ">Día del Mes<");

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', content, 'utf8');
