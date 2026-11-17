import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { GET as receitas } from './api/receitas.js';

// Em `npm run dev` e `npm run preview`, o próprio Vite responde a
// /api/receitas com a mesma função usada em produção.
function apiLocal() {
  const tratar = async (req, res, next) => {
    if (!req.url.startsWith('/api/receitas')) return next();
    const resposta = await receitas(new Request(`http://localhost${req.url}`));
    res.statusCode = resposta.status;
    resposta.headers.forEach((valor, nome) => res.setHeader(nome, valor));
    res.end(await resposta.text());
  };
  return {
    name: 'api-local',
    configureServer(server) {
      server.middlewares.use(tratar);
    },
    configurePreviewServer(server) {
      server.middlewares.use(tratar);
    },
  };
}

export default defineConfig(({ mode }) => {
  // Lê SPOONACULAR_API_KEY do .env sem o prefixo VITE_, que a exporia no bundle.
  const env = loadEnv(mode, process.cwd(), '');
  if (env.SPOONACULAR_API_KEY) process.env.SPOONACULAR_API_KEY = env.SPOONACULAR_API_KEY;

  return {
    plugins: [tailwindcss(), react(), apiLocal()],
  };
});
