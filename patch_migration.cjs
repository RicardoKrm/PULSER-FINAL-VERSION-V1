const fs = require('fs');
const file = 'src/pages/produccion/ReporteDiarioPanel.tsx';
let content = fs.readFileSync(file, 'utf8');

const migrationCode = `
  // Temporary Migration Hook
  useEffect(() => {
    if (currentCompany?.id) {
      supabase.from('produccion_registro_diario')
        .update({ empresa_id: currentCompany.id })
        .is('empresa_id', null)
        .then(() => {
           console.log("Migration produccion_registro_diario completed");
           // Refresh data
           if (typeof fetchData === 'function') fetchData();
        });
        
      supabase.from('produccion_registro_diario_mina')
        .update({ empresa_id: currentCompany.id })
        .is('empresa_id', null)
        .then(() => {
           console.log("Migration produccion_registro_diario_mina completed");
        });
    }
  }, [currentCompany?.id]);
`;

content = content.replace(
  "useEffect(() => {",
  migrationCode + "\n  useEffect(() => {"
);

fs.writeFileSync(file, content);
console.log("Migration patch added to ReporteDiarioPanel.tsx");
