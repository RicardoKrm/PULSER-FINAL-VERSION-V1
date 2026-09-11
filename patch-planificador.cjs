const fs = require('fs');
const file = 'src/pages/produccion/PlanificadorTransportePage.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useCompany')) {
  content = content.replace(
    "import { supabase } from '../../lib/supabase';",
    "import { supabase } from '../../lib/supabase';\nimport { useCompany } from '../../contexts/CompanyContext';"
  );
  content = content.replace(
    "export default function PlanificadorTransportePage() {",
    "export default function PlanificadorTransportePage() {\n  const { currentCompany } = useCompany();"
  );
}

content = content.replace(
  /\.select\('\*'\)\s*\.gte\('fecha', startDateStr\)/,
  ".select('*').eq('empresa_id', currentCompany?.id || '').gte('fecha', startDateStr)"
);

content = content.replace(
  /useEffect\(\(\) => \{\s*fetchOperaciones\(\);\s*\}, \[selectedDate, viewMode\]\);/,
  "useEffect(() => {\n    if (currentCompany?.id) fetchOperaciones();\n  }, [selectedDate, viewMode, currentCompany]);"
);

fs.writeFileSync(file, content);
console.log("PlanificadorTransportePage fixed.");
