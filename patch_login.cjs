const fs = require('fs');
const file = 'src/pages/Login.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  ".select('id, nombre, empresa_id, panel_inicio')",
  ".select('id, nombre, empresa_id, panel_inicio, estado, empresa:empresa_id(estado)')"
);

const checkCode = `
        if (profile) {
          const isInactive = profile.estado === 'Inactivo' || (profile.empresa && profile.empresa.estado === 'Inactivo');
          if (isInactive) {
            await supabase.auth.signOut();
            setErrorMsg('Cuenta suspendida. Por favor contacte con soporte.');
            setIsLoading(false);
            return;
          }
        }
`;

content = content.replace(
  "        if (!profile) {",
  checkCode + "\n        if (!profile) {"
);

fs.writeFileSync(file, content);
console.log("Login patched");
