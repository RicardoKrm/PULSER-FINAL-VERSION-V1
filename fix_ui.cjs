const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf-8');

// Fix the duplicated schemaError blocks
const duplicateText = `{schemaError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start mb-6 w-full col-span-full">
          <AlertCircle className="w-6 h-6 text-red-500 mr-3 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-semibold mb-1">Requiere Actualización de Base de Datos</h3>`;

const parts = code.split(duplicateText);
if (parts.length > 2) {
   // It was duplicated! Let's just restore it cleanly.
   code = code.replace(/\{schemaError && \([\s\S]*?<\/div>\n      \)\}/g, '');
   code = code.replace(
      `<h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">`,
      `{schemaError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start mb-6 w-full col-span-full">
          <AlertCircle className="w-6 h-6 text-red-500 mr-3 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-semibold mb-1">Requiere Actualización de Base de Datos</h3>
            <p className="text-red-700 text-sm mb-3">
              Para guardar los datos, es necesario crear la tabla "produccion_mina_mensual" en Supabase. 
              Por favor, ejecuta el siguiente código en el SQL Editor de Supabase:
            </p>
            <pre className="bg-red-900 text-red-100 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
              {\`CREATE TABLE IF NOT EXISTS public.produccion_mina_mensual (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresa(id),
    mes TEXT NOT NULL,
    dia INTEGER,
    supervisor TEXT,
    dia_mes TEXT,
    produccion_dia NUMERIC,
    produccion_noche NUMERIC,
    total_imperia NUMERIC,
    total_cmc NUMERIC,
    diferencia NUMERIC,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.produccion_mina_mensual ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.produccion_mina_mensual FOR ALL USING (true);
\`}
            </pre>
          </div>
        </div>
      )}
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">`
   );
}

// Ensure handleFileUpload clears the file input value so they can re-upload if it fails silently
code = code.replace(
    `reader.readAsBinaryString(file);\n  };`,
    `reader.readAsBinaryString(file);\n    if (fileInputRef.current) fileInputRef.current.value = '';\n  };`
);

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', code);
