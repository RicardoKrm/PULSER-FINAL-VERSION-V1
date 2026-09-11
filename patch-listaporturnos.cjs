const fs = require('fs');
const file = 'src/pages/produccion/ListaPorTurnos.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useCompany')) {
  content = content.replace(
    "import { supabase } from '../../lib/supabase';",
    "import { supabase } from '../../lib/supabase';\nimport { useCompany } from '../../contexts/CompanyContext';"
  );
  content = content.replace(
    "export default function ListaPorTurnos() {",
    "export default function ListaPorTurnos() {\n  const { currentCompany } = useCompany();"
  );
}

content = content.replace(
  /\.from\('produccion_registro_diario'\)\s*\.select\('\*'\)/g,
  ".from('produccion_registro_diario').select('*').eq('empresa_id', currentCompany?.id || '')"
);

content = content.replace(
  /useEffect\(\(\) => \{\s*const fetchData = async/g,
  "useEffect(() => {\n    if(!currentCompany?.id) return;\n    const fetchData = async"
);

content = content.replace(
  /fetchData\(\);\s*\}, \[\]\);/g,
  "fetchData();\n  }, [currentCompany]);"
);

fs.writeFileSync(file, content);
console.log("ListaPorTurnos fixed.");
