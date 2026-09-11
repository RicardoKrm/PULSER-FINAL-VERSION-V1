const fs = require('fs');
const file = 'src/pages/produccion/ControlSanny.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /s7Trips=\{data\.s7\.filter\(t => t\.date === selectedDate\)\}/g,
  "s7Trips={data.s7.filter(t => t.date === selectedDate)}\n              s8Trips={data.s8.filter(t => t.date === selectedDate)}"
);

fs.writeFileSync(file, content);
console.log("Fixed props.");
