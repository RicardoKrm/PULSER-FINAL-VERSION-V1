const fs = require('fs');

const path = 'src/pages/logistica/GestionBodegas.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /let dataToSet: any\[\] = \[\];[\s\S]*?setBodegas\(dataToSet\);/;

const replacement = `if (!currentCompany?.id) return;
      let query = supabase.from('logistica_bodegas').select('*');
      if (currentCompany.id !== 'emp-001') {
        query = query.eq('empresa_id', currentCompany.id);
      }
      const { data, error } = await query;
      if (!error && data) {
        setBodegas(data);
      } else {
        setBodegas([]);
      }`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log("GestionBodegas fixed");
} else {
  console.log("No match found in GestionBodegas");
}
