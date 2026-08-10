(globalThis as any).import = { meta: { env: { VITE_SUPABASE_URL: 'mock', VITE_SUPABASE_ANON_KEY: 'mock' } } };
import React from 'react';
import { renderToString } from 'react-dom/server';
import ListaPorTurnos from './src/pages/produccion/ListaPorTurnos.tsx';

try {
  const html = renderToString(<ListaPorTurnos />);
  console.log("RENDER SUCCESS", html.length);
} catch (e) {
  console.error("RENDER ERROR", e);
}
