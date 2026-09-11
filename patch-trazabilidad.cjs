const fs = require('fs');
const file = 'src/pages/produccion/TrazabilidadPage.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useCompany')) {
  content = content.replace(
    "import { supabase } from '../../lib/supabase';",
    "import { supabase } from '../../lib/supabase';\nimport { useCompany } from '../../contexts/CompanyContext';"
  );
  content = content.replace(
    "export default function TrazabilidadPage() {",
    "export default function TrazabilidadPage() {\n  const { currentCompany } = useCompany();"
  );
}

content = content.replace(
  /\.from\('produccion_registro_diario_mina'\)\s*\.select\('\*'\)/g,
  ".from('produccion_registro_diario_mina').select('*').eq('empresa_id', currentCompany?.id || '')"
);

content = content.replace(
  /\.from\('produccion_registro_diario'\)\s*\.select\('\*'\)/g,
  ".from('produccion_registro_diario').select('*').eq('empresa_id', currentCompany?.id || '')"
);

content = content.replace(
  /useEffect\(\(\) => \{\s*fetchTrazabilidad\(\);\s*\}, \[\]\);/,
  "useEffect(() => {\n    if (currentCompany?.id) fetchTrazabilidad();\n  }, [currentCompany]);"
);

fs.writeFileSync(file, content);
console.log("TrazabilidadPage fixed.");
