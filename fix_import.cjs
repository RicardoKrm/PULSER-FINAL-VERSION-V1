const fs = require('fs');
let code = fs.readFileSync('src/pages/operaciones/produccion/ReporteYAnaliticaMina.tsx', 'utf-8');
code = code.replace(/import { useAuth } from '..\/..\/..\/contexts\/AuthContext';/, "import { useAuth } from '../../../context/AuthContext';\nimport { useProduccion } from '../../../contexts/ProduccionContext';");

fs.writeFileSync('src/pages/operaciones/produccion/ReporteYAnaliticaMina.tsx', code);
