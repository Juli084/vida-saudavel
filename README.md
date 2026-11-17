# Vida Saudável

Página de alimentação saudável com busca de receitas e dicas práticas. React 19, Vite e Tailwind CSS.

## O que faz

- busca receitas na base do [Spoonacular](https://spoonacular.com/food-api) (resultados em inglês),
  com tempo de preparo, indicação de receita vegetariana e link para a receita completa;
- mostra dicas de alimentação em ordem aleatória, três por vez, com opção de ver todas.

## A chave da API fica no servidor

O navegador nunca recebe a chave do Spoonacular. Ele chama `/api/receitas?q=...`, e a função em
[`api/receitas.js`](api/receitas.js) faz a consulta com a chave lida de `SPOONACULAR_API_KEY`,
enviada por cabeçalho e não pela URL. A resposta traz só os campos que a página usa.

- **Na Vercel:** a pasta `api/` vira função de servidor. Configure `SPOONACULAR_API_KEY` nas
  variáveis de ambiente do projeto.
- **Localmente:** o próprio Vite responde a `/api/receitas` com a mesma função
  ([`vite.config.js`](vite.config.js)), lendo a chave do `.env`.

Sem chave configurada, a página mostra que a busca não está disponível, em vez de quebrar.

## Rodando localmente

Requer Node 20.19 ou 22.12 em diante.

```bash
cp .env.example .env
npm install
npm run dev
```

```bash
npm run lint
npm test
npm run build
```

`npm test` roda os testes da função de servidor (`node:test`, sem dependências extras): chave
ausente, busca vazia, resposta enxuta, chave fora da URL e da resposta, falha do serviço e da rede.
