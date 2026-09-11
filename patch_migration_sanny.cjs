const fs = require('fs');
const file = 'src/pages/produccion/ControlSanny.tsx';
let content = fs.readFileSync(file, 'utf8');

const migrationCode = `
  // Temporary Migration Hook
  useEffect(() => {
    if (currentCompany?.id) {
      supabase.from('produccion_sanny')
        .update({ empresa_id: currentCompany.id })
        .is('empresa_id', null)
        .then(() => {
           console.log("Migration produccion_sanny completed");
           fetchTrips();
        });
    }
  }, [currentCompany?.id]);
`;

content = content.replace(
  "useEffect(() => {\n    fetchTrips();",
  migrationCode + "\n  useEffect(() => {\n    fetchTrips();"
);

fs.writeFileSync(file, content);
console.log("Migration patch added to ControlSanny.tsx");
