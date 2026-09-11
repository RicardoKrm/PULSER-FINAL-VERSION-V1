const fs = require('fs');
const file = 'src/pages/super-admin/Empresas.tsx';
let content = fs.readFileSync(file, 'utf8');

const newFunc = `  const toggleCompanyStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Activo' ? 'Inactivo' : 'Activo';
    try {
      const { error } = await supabase.from('empresa').update({ estado: newStatus }).eq('id', id);
      if (error) throw error;
      
      // Update all users belonging to this company to match the new status
      const { error: userError } = await supabase
        .from('usuario_aplicacion')
        .update({ estado: newStatus })
        .eq('empresa_id', id);
        
      if (userError) console.error('Error al actualizar estado de usuarios:', userError);
      
      fetchEmpresas();
    } catch (error) {
      console.error('Error al cambiar estado de empresa:', error);
    }
  };`;

const regex = /const toggleCompanyStatus = async \(id: string, currentStatus: string\) => \{[\s\S]*?fetchEmpresas\(\);\n    \} catch \(error\) \{\n      console\.error\('Error al cambiar estado de empresa:', error\);\n    \}\n  \};/m;

content = content.replace(regex, newFunc);
fs.writeFileSync(file, content);
console.log("Patched Empresas.tsx");
