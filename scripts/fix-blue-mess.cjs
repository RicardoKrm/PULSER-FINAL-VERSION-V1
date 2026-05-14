const fs = require('fs');

const files = [
  'src/pages/flota/Mantenimiento.tsx',
  'src/pages/dashboard/PanelTco.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let text = fs.readFileSync(file, 'utf8');
    text = text.replace(/border-b dark:border-slate-800lue/g, 'border-blue');
    fs.writeFileSync(file, text);
    console.log("Fixed mess in:", file);
  }
});
