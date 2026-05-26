// src/lib/supabase.ts
var import_supabase_js = require("@supabase/supabase-js");
var import_meta = {};
var supabaseUrl = import_meta.env.VITE_SUPABASE_URL || "";
var supabaseAnonKey = import_meta.env.VITE_SUPABASE_ANON_KEY || "";
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Faltan las variables de entorno de Supabase. Algunas funcionalidades pueden fallar.");
}
var supabase = (0, import_supabase_js.createClient)(supabaseUrl, supabaseAnonKey);

// test_update.ts
(async () => {
  try {
    const { data, error } = await supabase.from("orden_de_trabajo").update({ inicio_proceso: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", "123").select();
    console.log("Error:", error);
  } catch (e) {
    console.error(e);
  }
})();
