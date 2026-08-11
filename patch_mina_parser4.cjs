const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf-8');

code = code.replace(
  /if \(jsonData\[i\]\[0\] == 1 \|\| String\(jsonData\[i\]\[0\]\)\.trim\(\) === '1'\) \{/g,
  `if (jsonData[i][colDia] == 1 || String(jsonData[i][colDia]).trim() === '1') {`
);

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', code);
