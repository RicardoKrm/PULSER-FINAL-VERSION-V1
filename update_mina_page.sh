sed -i "1i import { supabase } from '../../lib/supabase';" src/pages/produccion/PruebaMina.tsx
sed -i "s/import { Button } from '..\/..\/components\/ui\/Button';/import { Button } from '..\/..\/components\/ui\/Button';\nimport { useAuth } from '..\/..\/context\/AuthContext';\nimport { useCompany } from '..\/..\/contexts\/CompanyContext';/g" src/pages/produccion/PruebaMina.tsx
