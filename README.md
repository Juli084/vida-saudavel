# Vida Saudável

Para saber o que tem no que se come e montar refeições equilibradas, com dados oficiais
brasileiros. React 19, TypeScript, Tailwind e Vite.

**No ar:** [vida-saudavel-tau.vercel.app](https://vida-saudavel-tau.vercel.app)

- **Alimentos:** a composição de 597 alimentos da Tabela Brasileira de Composição de Alimentos
  (TACO, NEPA/UNICAMP).
- **Valor diário:** o quanto cada porção representa do valor diário de referência da Anvisa.
- **Sugestões:** os alimentos com mais (ou menos) de cada nutriente.
- **Meu prato:** o total do prato montado.
- **Receitas e semana:** com uma chave do Spoonacular, também receitas, plano da semana e lista
  de compras.
- **Guia:** os dez passos do Guia Alimentar do Ministério da Saúde.

## O que faz

- **Busca de alimentos.**
  - Encontra pelo nome sem precisar de acento, e as palavras podem vir em qualquer ordem:
    "feijao preto" acha "Feijão, preto, cozido".
  - Dá para filtrar por um dos 15 grupos da TACO.
  - O cozido aparece antes do cru.
- **Ficha do alimento.** Porção de 50, 100, 150 ou 200 g, ou qualquer valor até 2 kg. Mostra
  energia, macronutrientes, fibra, sódio, colesterol, minerais e vitaminas, cada um com o %VD da
  Anvisa (IN nº 75/2020) e uma barra.
- **Sugestões.**
  - **Objetivos:** mais fibra, proteína, ferro, cálcio, vitamina C, vitamina A ou potássio, ou
    menos calorias.
  - **Base:** por 100 g, ou por 100 kcal, que mostra quem entrega mais do nutriente com menos
    calorias.
  - **Fora da lista:** sal, doces, bebidas, óleos, alimentos crus que só se comem cozidos,
    concentrados e ultraprocessados.
- **Meu prato.** Cada alimento entra com a sua porção, e as gramas podem ser trocadas depois. O
  total vem com %VD e pode ser copiado. O prato fica no navegador, conferido ao ler. Se algum
  alimento não tem um nutriente na tabela, o total avisa que é parcial em vez de contar zero.
- **Receitas, semana e lista de compras.** Funcionam quando a chave do Spoonacular está
  configurada no servidor (detalhes abaixo). Sem a chave, a página explica o motivo em vez de
  mostrar uma busca que só daria erro.
- **Guia alimentar.** Os dez passos do
  [Guia Alimentar para a População Brasileira](https://bvsms.saude.gov.br/bvs/publicacoes/guia_alimentar_populacao_brasileira_2ed.pdf)
  (Ministério da Saúde, 2014), com os títulos do guia e resumos meus.

## Dados

A extração da TACO, a conferência e os valores diários de referência estão documentados em
[`docs/dados.md`](docs/dados.md):

- o arquivo de origem, com o SHA-256;
- os scripts de extração e de conferência, em `scripts/taco/`;
- as checagens de coerência.

A tabela (200 KB, cerca de 30 KB comprimida) só é baixada quando a página carrega a parte de
alimentos. Ela vai junto com o site, sem depender de serviço externo nem de chave.

## Receitas: termos do Spoonacular

Os [termos de uso do Spoonacular](https://spoonacular.com/food-api/terms) definem três decisões
do projeto:

- **Sem cache.** Guardar respostas exige autorização prévia por escrito e vale por no máximo
  1 hora. A função responde com `Cache-Control: no-store`.
- **Só id, título e imagem guardados.** O plano da semana guarda só isso no navegador, e a lista
  de compras busca os ingredientes de novo cada vez que é montada.
- **Crédito à fonte.** Cada receita mostra o nome e o link do site de origem.

## A chave da API fica no servidor

O navegador nunca recebe a chave do Spoonacular. Ele chama `/api/receitas`, e a função em
[`api/receitas.js`](api/receitas.js) faz a consulta com a chave lida de `SPOONACULAR_API_KEY`,
enviada por cabeçalho e não pela URL. A função aceita três consultas:

| Consulta | Uso |
|---|---|
| `status` | diz se a chave está configurada, sem consultar o Spoonacular |
| `q`, com `dieta`, `sem` (`gluten`, `lactose`), `tempo`, `refeicao`, `pagina` | busca |
| `ids=1,2,3` (até 21) | receitas do plano, para a lista de compras |

Valores fora da lista recebem 400 sem chamar o Spoonacular. Quando a cota diária acaba, a página
diz isso em vez de um erro genérico.

O `vercel.json` define a política de segurança: scripts e dados só do próprio site, e imagens só
do próprio site e do Spoonacular.

## Rodando localmente

Requer Node 22.12 ou mais novo.

```bash
cp .env.example .env    # opcional: a chave do Spoonacular, para as receitas
npm install
npm run dev
```

```bash
npm run lint
npm test            # função de servidor (node:test), tabela, busca, sugestões, prato e lista (Vitest)
npm run test:e2e    # navegador, no celular e no desktop, com a mesma política de segurança da Vercel
npm run build
```

## Limitações

- **Por 100 g, não por porção caseira.** A TACO não traz medidas como "1 concha" ou "1 unidade
  média". A porção é escolhida em gramas.
- **A tabela é de 2011.** É a edição mais recente da TACO. Produtos industrializados mudam de
  receita com o tempo, e é por isso que as sugestões deixam os industrializados de fora.
- **Não é orientação nutricional.** O %VD usa a referência de rótulo da Anvisa (2.000 kcal), não
  a necessidade de cada pessoa.
- **Receitas em inglês.** Com a chave configurada, o modo de preparo vem em inglês, como está na
  fonte.
- **O prato e o plano ficam só no navegador** onde foram feitos.
- **Uso comercial das receitas.** O Spoonacular em produção depende de um plano pago compatível
  com o volume de acessos. A parte de alimentos não tem essa restrição.
