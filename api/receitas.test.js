import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GET } from './receitas.js';
import { nomeEmPortugues, traduzirBusca } from './_traducao.js';

const CHAVE = 'chave-de-teste-123';
const fetchOriginal = globalThis.fetch;
let chamadas;

function simularSpoonacular(resposta) {
  globalThis.fetch = async (url, opcoes) => {
    chamadas.push({ url: new URL(url), opcoes });
    if (resposta instanceof Error) throw resposta;
    return resposta;
  };
}

const pedir = (consulta) => GET(new Request(`http://localhost/api/receitas?${consulta}`));

const receitaCompleta = {
  id: 716429,
  title: 'Pasta with Garlic',
  image: 'https://img.spoonacular.com/recipes/716429-312x231.jpg',
  readyInMinutes: 45,
  servings: 2,
  vegetarian: true,
  vegan: false,
  glutenFree: false,
  dairyFree: false,
  sourceName: 'Full Belly Sisters',
  sourceUrl: 'https://fullbellysisters.example/pasta',
  spoonacularScore: 99,
  nutrition: {
    nutrients: [
      { name: 'Calories', amount: 543.36, unit: 'kcal' },
      { name: 'Protein', amount: 16.84, unit: 'g' },
      { name: 'Carbohydrates', amount: 83.7, unit: 'g' },
      { name: 'Fat', amount: 16.2, unit: 'g' },
    ],
  },
  extendedIngredients: [
    { nameClean: 'garlic', amount: 2, unit: 'cloves', measures: { metric: { amount: 2, unitShort: 'cloves' } } },
    { nameClean: 'scallions', amount: 1, unit: 'cup', measures: { metric: { amount: 236.6, unitShort: 'ml' } } },
  ],
  analyzedInstructions: [{ steps: [{ step: 'Boil the pasta.' }, { step: 'Add garlic.' }] }],
};

describe('tradução', () => {
  it('troca termos comuns de português para inglês, inclusive com acento e duas palavras', () => {
    assert.equal(traduzirBusca('Frango com Batata-Doce'), 'chicken com sweet potato');
    assert.equal(traduzirBusca('salada de grão de bico'), 'salad de chickpea');
    assert.equal(traduzirBusca('ramen'), 'ramen');
  });

  it('mostra ingredientes conhecidos em português e mantém os outros', () => {
    assert.equal(nomeEmPortugues('Garlic'), 'alho');
    assert.equal(nomeEmPortugues('scallions'), 'scallions');
  });
});

describe('GET /api/receitas', () => {
  beforeEach(() => {
    chamadas = [];
    process.env.SPOONACULAR_API_KEY = CHAVE;
  });

  afterEach(() => {
    globalThis.fetch = fetchOriginal;
    delete process.env.SPOONACULAR_API_KEY;
  });

  it('responde 503 quando a chave não está configurada', async () => {
    delete process.env.SPOONACULAR_API_KEY;
    assert.equal((await pedir('q=salada')).status, 503);
  });

  it('informa se a busca está configurada, sem chamar o Spoonacular nem mostrar a chave', async () => {
    simularSpoonacular(new Error('não deveria chamar'));
    const comChave = await pedir('status=1');
    assert.deepEqual(await comChave.json(), { configurada: true });
    delete process.env.SPOONACULAR_API_KEY;
    assert.deepEqual(await (await pedir('status=1')).json(), { configurada: false });
    assert.equal(chamadas.length, 0);
  });

  it('busca com filtros traduzidos para o Spoonacular, com a chave só no cabeçalho', async () => {
    simularSpoonacular(Response.json({ results: [], totalResults: 0 }));
    const resposta = await pedir('q=frango&dieta=vegetariana&sem=gluten&sem=lactose&refeicao=principal&tempo=30&pagina=2');
    const corpo = await resposta.json();
    const { url, opcoes } = chamadas[0];
    assert.equal(url.pathname, '/recipes/complexSearch');
    assert.equal(url.searchParams.get('query'), 'chicken');
    assert.equal(url.searchParams.get('diet'), 'vegetarian');
    assert.equal(url.searchParams.get('intolerances'), 'gluten,dairy');
    assert.equal(url.searchParams.get('type'), 'main course');
    assert.equal(url.searchParams.get('maxReadyTime'), '30');
    assert.equal(url.searchParams.get('offset'), '12');
    assert.equal(url.searchParams.get('addRecipeNutrition'), 'true');
    assert.equal(opcoes.headers['x-api-key'], CHAVE);
    assert.ok(!url.href.includes(CHAVE), 'a chave não vai na URL');
    assert.equal(corpo.termoUsado, 'chicken');
  });

  it('não pede cache: os termos do Spoonacular não permitem guardar sem autorização', async () => {
    simularSpoonacular(Response.json({ results: [] }));
    const resposta = await pedir('q=salada');
    assert.equal(resposta.headers.get('cache-control'), 'no-store');
  });

  it('devolve só os campos usados, com nutrição arredondada, fonte e ingredientes em português', async () => {
    simularSpoonacular(Response.json({ results: [receitaCompleta], totalResults: 1 }));
    const { receitas } = await (await pedir('q=pasta')).json();
    assert.deepEqual(receitas[0], {
      id: 716429,
      titulo: 'Pasta with Garlic',
      imagem: 'https://img.spoonacular.com/recipes/716429-312x231.jpg',
      minutos: 45,
      porcoes: 2,
      vegetariana: true,
      vegana: false,
      semGluten: false,
      semLactose: false,
      fonte: { nome: 'Full Belly Sisters', url: 'https://fullbellysisters.example/pasta' },
      nutricao: { calorias: 543, proteinas: 17, carboidratos: 84, gorduras: 16 },
      ingredientes: [
        { nome: 'alho', quantidade: 2, unidade: 'cloves' },
        { nome: 'scallions', quantidade: 236.6, unidade: 'ml' },
      ],
      passos: ['Boil the pasta.', 'Add garlic.'],
    });
  });

  it('busca as receitas do plano por id, sem repetir', async () => {
    simularSpoonacular(Response.json([receitaCompleta]));
    const resposta = await pedir('ids=716429,716429,123');
    assert.equal(resposta.status, 200);
    assert.equal(chamadas[0].url.pathname, '/recipes/informationBulk');
    assert.equal(chamadas[0].url.searchParams.get('ids'), '716429,123');
  });

  it('recusa parâmetros fora do formato sem chamar o Spoonacular', async () => {
    for (const consulta of ['q=', 'q=a&dieta=paleo', 'q=a&sem=amendoim', 'q=a&tempo=20', 'q=a&refeicao=brunch', 'q=a&pagina=0', 'ids=1,abc', `ids=${Array.from({ length: 22 }, (_, i) => i + 1).join(',')}`]) {
      assert.equal((await pedir(consulta)).status, 400, consulta);
    }
    assert.equal(chamadas.length, 0);
  });

  it('avisa quando a cota diária acabou e quando o serviço falha', async () => {
    simularSpoonacular(new Response('{}', { status: 402 }));
    assert.equal((await pedir('q=salada')).status, 503);
    simularSpoonacular(new Response('{}', { status: 500 }));
    assert.equal((await pedir('q=salada')).status, 502);
    simularSpoonacular(new Error('rede'));
    assert.equal((await pedir('q=salada')).status, 502);
  });
});
