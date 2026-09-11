const fs = require('fs');
const file = 'src/pages/produccion/ReporteDiarioPanel.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useCompany')) {
  content = content.replace(
    "import { supabase } from '../../lib/supabase';",
    "import { supabase } from '../../lib/supabase';\nimport { useCompany } from '../../contexts/CompanyContext';"
  );
  content = content.replace(
    "export default function ReporteDiarioPanel() {",
    "export default function ReporteDiarioPanel() {\n  const { currentCompany } = useCompany();"
  );
}

// Fix Selects
content = content.replace(
  /\.from\('produccion_registro_diario'\)\s*\.select\('\*'\)/g,
  ".from('produccion_registro_diario').select('*').eq('empresa_id', currentCompany?.id || '')"
);

// Fix deletes
content = content.replace(
  /\.from\('produccion_registro_diario'\)\s*\.delete\(\)/g,
  ".from('produccion_registro_diario').delete().eq('empresa_id', currentCompany?.id || '')"
);

// Fix inserts payload
// There's: .insert([payload])
// and: .insert(formattedData)
// and: .insert(payloadData)

content = content.replace(
  /const payload = \{/g,
  "const payload = { empresa_id: currentCompany?.id,"
);

content = content.replace(
  /const formattedData = jsonData\.slice\(1\)\.map\(\(row: any\[\]\) => \(\{/g,
  "const formattedData = jsonData.slice(1).map((row: any[]) => ({ empresa_id: currentCompany?.id,"
);

content = content.replace(
  /const payloadData = reportesData\.map\(row => \(\{/g,
  "const payloadData = reportesData.map(row => ({ empresa_id: currentCompany?.id,"
);

// Also the useEffect dependencies if any
content = content.replace(
  /useEffect\(\(\) => \{\s*fetchReportes\(\);\s*\}, \[\]\);/,
  "useEffect(() => {\n    if (currentCompany?.id) fetchReportes();\n  }, [currentCompany]);"
);

fs.writeFileSync(file, content);
console.log("ReporteDiarioPanel fixed.");
