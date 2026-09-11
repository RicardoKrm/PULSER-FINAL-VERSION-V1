const fs = require('fs');
const file = 'src/pages/produccion/DashboardProduccion.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useCompany')) {
  content = content.replace(
    "import { GlobalStats, MetasObjetivos, useProduccion } from '../../contexts/ProduccionContext';",
    "import { GlobalStats, MetasObjetivos, useProduccion } from '../../contexts/ProduccionContext';\nimport { useCompany } from '../../contexts/CompanyContext';"
  );
}

if (!content.includes('currentCompany')) {
  content = content.replace(
    "const { metas, setMetas } = useProduccion();",
    "const { metas, setMetas } = useProduccion();\n  const { currentCompany } = useCompany();"
  );
}

content = content.replace(
  /\.from\('produccion_registro_diario_mina'\)\s*\.select\('fecha, tonelaje'\)/,
  ".from('produccion_registro_diario_mina')\n        .select('fecha, tonelaje')\n        .eq('empresa_id', currentCompany?.id || '')"
);

content = content.replace(
  /\.from\('produccion_registro_diario'\)\s*\.select\('fecha, tonelaje'\)/,
  ".from('produccion_registro_diario')\n        .select('fecha, tonelaje')\n        .eq('empresa_id', currentCompany?.id || '')"
);

// also need to change useEffect dependencies
content = content.replace(
  /useEffect\(\(\) => \{\s*fetchData\(\);\s*\}, \[\]\);/,
  "useEffect(() => {\n    if (currentCompany?.id) fetchData();\n  }, [currentCompany]);"
);

fs.writeFileSync(file, content);
console.log("DashboardProduccion fixed.");
