const fs = require('fs');

const path = 'src/pages/logistica/GestionBodegas.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /let dataToSet: any\[\] = \[\];\s*if \(currentCompany\?\.id && currentCompany\.id !== 'emp-001'\) \{\s*const \{ data, error \} = await supabase\s*\.from\('logistica_bodegas'\)\s*\.select\('\*'\)\s*\.eq\('empresa_id', currentCompany\.id\);\s*if \(!error && data && data\.length > 0\) \{\s*dataToSet = data;\s*\}\s*\}\s*if \(dataToSet\.length === 0\) \{\s*const \{ data: allData, error: allErr \} = await supabase\s*\.from\('logistica_bodegas'\)\s*\.select\('\*'\);\s*if \(!allErr && allData\) \{\s*dataToSet = allData;\s*\}\s*\}\s*setBodegas\(dataToSet\);/g;

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
