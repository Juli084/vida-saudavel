/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
// @ts-expect-error a função de servidor é JavaScript puro, sem tipos.
import { GET as receitas } from './api/receitas.js';

// Em `npm run dev` e `npm run preview`, o próprio Vite responde a /api/receitas com a
// mesma função usada em produção.
function apiLocal() {
  const tratar = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/receitas')) return next();
    const resposta: Response = await receitas(new Request(`http://localhost${req.url}`));
    res.statusCode = resposta.status;
    resposta.headers.forEach((valor, nome) => res.setHeader(nome, valor));
    res.end(await resposta.text());
  };
  type Servidor = { middlewares: { use: (f: typeof tratar) => void } };
  return {
    name: 'api-local',
    // Corpo em bloco de propósito: se o gancho devolver uma função, o Vite a chama depois
    // como middleware final, e o connect devolvido pelo use() quebraria a requisição.
    configureServer(server: Servidor) {
      server.middlewares.use(tratar);
    },
    configurePreviewServer(server: Servidor) {
      server.middlewares.use(tratar);
    },
  };
}

/** Cabeçalhos da Vercel também no `vite preview`, para os testes rodarem sob a mesma CSP. */
function cabecalhosDeProducao(): Record<string, string> {
  const config = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf-8')) as {
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
  const geral = config.headers.find((regra) => regra.source === '/(.*)');
  return Object.fromEntries((geral?.headers ?? []).map(({ key, value }) => [key, value]));
}

export default defineConfig(({ mode }) => {
  // Lê SPOONACULAR_API_KEY do .env sem o prefixo VITE_, que a exporia no bundle.
  const env = loadEnv(mode, process.cwd(), '');
  if (env.SPOONACULAR_API_KEY) process.env.SPOONACULAR_API_KEY = env.SPOONACULAR_API_KEY;
  return {
    plugins: [tailwindcss(), react(), apiLocal()],
    preview: { headers: cabecalhosDeProducao() },
    test: { include: ['tests/**/*.test.ts'], environment: 'node' },
  };
});
