# Vida Saudável

Para planejar as refeições da semana: busca receitas por dieta e tempo, monta o cardápio de
segunda a domingo e gera a lista de compras com os ingredientes somados. Para ir além das receitas,
traz os dez passos do Guia Alimentar para a População Brasileira. React 19, TypeScript, Tailwind
e Vite.

## O que faz

- **Busca com filtros.**
  - Dieta vegetariana ou vegana, sem glúten, sem lactose.
  - Tempo máximo de 15, 30, 45 ou 60 minutos.
  - Tipo de refeição: prato principal, café da manhã, salada, sopa, lanche ou sobremesa.
  - A base do Spoonacular é em inglês, por isso os termos comuns digitados em português, como
    "frango" e "grão de bico", são traduzidos antes da busca.
- **Receita completa.** Calorias, proteínas, carboidratos e gorduras por porção, ingredientes em
  medidas métricas (os mais comuns em português), modo de preparo e o link da fonte original.
- **Plano da semana.** Cada receita vai para um dia, no almoço ou no jantar.
- **Lista de compras.**
  - **Soma:** o mesmo ingrediente na mesma unidade é somado. Unidades diferentes ficam em linhas
    separadas, porque 2 xícaras e 200 g não se somam sem saber a densidade.
  - **Riscar:** dá para riscar o que já tem em casa.
  - **Enviar:** o que falta pode ser copiado ou mandado pelo WhatsApp.
- **Guia alimentar.** Os dez passos do
  [Guia Alimentar para a População Brasileira](https://bvsms.saude.gov.br/bvs/publicacoes/guia_alimentar_populacao_brasileira_2ed.pdf)
  (Ministério da Saúde, 2014), com os títulos do guia e resumos meus. Eles substituem as dicas da
  versão anterior, que não tinham fonte.

## Termos do Spoonacular

Os [termos de uso do Spoonacular](https://spoonacular.com/food-api/terms) definem três decisões
do projeto:

- **Sem cache.** Guardar respostas exige autorização prévia por escrito e vale por no máximo
  1 hora. A função responde com `Cache-Control: no-store`. A versão anterior pedia até 24 horas de
  cache na CDN e foi corrigida.
- **Só id, título e imagem guardados.** Os termos permitem guardar só esses três campos. O plano
  da semana guarda só isso no navegador, e a lista de compras busca os ingredientes de novo cada
  vez que é montada. As marcações de "já tenho" ficam só na memória da página.
- **Crédito à fonte.** Cada receita mostra o nome e o link do site de origem.

## A chave da API fica no servidor

O navegador nunca recebe a chave do Spoonacular. Ele chama `/api/receitas`, e a função em
[`api/receitas.js`](api/receitas.js) faz a consulta com a chave lida de `SPOONACULAR_API_KEY`,
enviada por cabeçalho e não pela URL. A função aceita duas consultas:

| Consulta | Uso |
|---|---|
| `q`, com `dieta`, `sem` (`gluten`, `lactose`), `tempo`, `refeicao`, `pagina` | busca |
| `ids=1,2,3` (até 21) | receitas do plano, para a lista de compras |

Valores fora da lista (dieta, restrição, tempo, refeição, página, ids) recebem 400 sem chamar o
Spoonacular. Quando a cota diária do plano acaba, a página diz isso em vez de um erro genérico.

O `vercel.json` define a política de segurança: imagens só do próprio site e do Spoonacular, e
nenhum script de fora.

## Rodando localmente

Requer Node 22.12 ou mais novo.

```bash
cp .env.example .env    # coloque sua chave do Spoonacular
npm install
npm run dev
```

```bash
npm run lint
npm test            # função de servidor (node:test) e lista de compras (Vitest)
npm run test:e2e    # navegador, com o Spoonacular simulado
npm run build
```

## Limitações

- **Receitas em inglês.** O modo de preparo vem em inglês, como está na fonte. A tradução cobre
  os termos de busca e os ingredientes mais comuns, não o texto inteiro.
- **Valores nutricionais estimados.** Os números vêm do Spoonacular e não substituem orientação de
  nutricionista.
- **O plano não sincroniza.** Ele fica só no navegador onde foi feito.
- **Uso comercial.** O uso do Spoonacular em produção depende de um plano pago compatível com o
  volume de acessos.
