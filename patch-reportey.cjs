const fs = require('fs');
const file = 'src/pages/operaciones/produccion/ReporteYAnalitica.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useCompany')) {
  content = content.replace(
    "import { supabase } from '../../../lib/supabase';",
    "import { supabase } from '../../../lib/supabase';\nimport { useCompany } from '../../../contexts/CompanyContext';"
  );
  content = content.replace(
    "export default function ReporteYAnalitica({ onReporteProduccion, onReporteTransporte, stats }: Props) {",
    "export default function ReporteYAnalitica({ onReporteProduccion, onReporteTransporte, stats }: Props) {\n  const { currentCompany } = useCompany();"
  );
}

// Fix inserts
content = content.replace(
  /await supabase\.from\('produccion_registro_diario'\)\.insert\(\{/g,
  "await supabase.from('produccion_registro_diario').insert({ empresa_id: currentCompany?.id,"
);

// Fix fetches
content = content.replace(
  /\.from\('produccion_registro_diario'\)\s*\.select\('\*'\)/g,
  ".from('produccion_registro_diario').select('*').eq('empresa_id', currentCompany?.id || '')"
);

// Fix useEffect for fetches
content = content.replace(
  /useEffect\(\(\) => \{\s*fetchChartData\(\);\s*\}, \[\]\);/g,
  "useEffect(() => {\n    if(currentCompany?.id) fetchChartData();\n  }, [currentCompany]);"
);


fs.writeFileSync(file, content);
console.log("ReporteYAnalitica fixed.");
