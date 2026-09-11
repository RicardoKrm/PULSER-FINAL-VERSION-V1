const fs = require('fs');
const file = 'src/context/AuthContext.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "empresa:empresa_id(nombre, rut)",
  "empresa:empresa_id(nombre, rut, estado)"
);

content = content.replace(
  /if \(data\) \{\s*if \(Array\.isArray\(data\.rol\)\) data\.rol = data\.rol\[0\];\s*if \(Array\.isArray\(data\.empresa\)\) data\.empresa = data\.empresa\[0\];\s*setProfile\(data\);\s*\}/,
  `if (data) {
        if (Array.isArray(data.rol)) data.rol = data.rol[0];
        if (Array.isArray(data.empresa)) data.empresa = data.empresa[0];
        
        // Block inactive users or users belonging to inactive companies
        if (data.estado === 'Inactivo' || (data.empresa && data.empresa.estado === 'Inactivo')) {
          console.warn('Usuario o empresa inactiva. Bloqueando acceso.');
          supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          return;
        }

        setProfile(data);
      }`
);

fs.writeFileSync(file, content);
console.log("AuthContext patched");
