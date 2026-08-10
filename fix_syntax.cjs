const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/HorasMaquinaPage.tsx', 'utf-8');

code = code.replace(
    /const sheetsMsg = result\.sheetsProcessed\.length > 0 \? ` de \$\{result\.sheetsProcessed\.length\} hoja\(s\) \[\$\{result\.sheetsProcessed\.join\(\', \'\)\}\]` : \'\'; = result\.sheetsProcessed\.length > 0 \? ` de \$\{result\.sheetsProcessed\.length\} hoja\(s\) \[\$\{result\.sheetsProcessed\.join\(\', \'\)\}\]` : \'\';/g,
    "const sheetsMsg = result.sheetsProcessed.length > 0 ? ` de ${result.sheetsProcessed.length} hoja(s) [${result.sheetsProcessed.join(', ')}]` : '';"
);

fs.writeFileSync('src/pages/produccion/HorasMaquinaPage.tsx', code);
