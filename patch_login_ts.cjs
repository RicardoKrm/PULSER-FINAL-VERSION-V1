const fs = require('fs');
const file = 'src/pages/Login.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldCheck = "const isInactive = profile.estado?.toLowerCase() === 'inactivo' || (profile.empresa && profile.empresa.estado?.toLowerCase() === 'inactivo');";
const newCheck = `
          let isInactive = profile.estado?.toLowerCase() === 'inactivo';
          if (profile.empresa) {
            const emp = Array.isArray(profile.empresa) ? profile.empresa[0] : profile.empresa;
            if (emp && emp.estado?.toLowerCase() === 'inactivo') {
              isInactive = true;
            }
          }
`;

content = content.replace(oldCheck, newCheck);

// And we have the second error:
// `src/pages/Login.tsx(105,11): error TS2739: Type '{ id: any; nombre: any; empresa_id: any; panel_inicio: any; }' is missing the following properties from type '{ id: any; nombre: any; empresa_id: any; panel_inicio: any; estado: any; empresa: { estado: any; }[]; }': estado, empresa`

// Let's just typecast it using `as any` in `profile = newProfile as any;`
content = content.replace("profile = newProfile;", "profile = newProfile as any;");

fs.writeFileSync(file, content);
console.log("TS errors patched in Login.tsx");
