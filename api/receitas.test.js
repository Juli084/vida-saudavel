import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GET } from './receitas.js';

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

const pedir = (q) => GET(new Request(`http://localhost/api/receitas${q === undefined ? '' : `?q=${encodeURIComponent(q)}`}`));

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
    const resposta = await pedir('salad');
    assert.equal(resposta.status, 503);
  });

  it('responde 400 para busca vazia, sem chamar o Spoonacular', async () => {
    simularSpoonacular(Response.json({ results: [] }));
    const resposta = await pedir('   ');
    assert.equal(resposta.status, 400);
    assert.equal(chamadas.length, 0);
  });

  it('envia a chave por cabeçalho e devolve só os campos usados', async () => {
    simularSpoonacular(
      Response.json({
        results: [
          { id: 1, title: 'Salad', image: 'https://img/1.jpg', readyInMinutes: 10, vegetarian: true, sourceUrl: 'https://x', extra: 'ignorar' },
        ],
      }),
    );

    const resposta = await pedir('salad');
    const corpo = await resposta.json();

    assert.equal(resposta.status, 200);
    assert.deepEqual(corpo.receitas, [
      { id: 1, title: 'Salad', image: 'https://img/1.jpg', readyInMinutes: 10, vegetarian: true, sourceUrl: 'https://x' },
    ]);
    assert.equal(chamadas[0].opcoes.headers['x-api-key'], CHAVE);
    assert.equal(chamadas[0].url.searchParams.get('query'), 'salad');
    assert.equal(chamadas[0].url.searchParams.has('apiKey'), false, 'a chave não vai na URL');
    assert.ok(!JSON.stringify(corpo).includes(CHAVE), 'a chave não volta na resposta');
  });

  it('limita o termo de busca a 80 caracteres', async () => {
    simularSpoonacular(Response.json({ results: [] }));
    await pedir('a'.repeat(500));
    assert.equal(chamadas[0].url.searchParams.get('query').length, 80);
  });

  it('responde 502 quando o Spoonacular recusa', async () => {
    simularSpoonacular(new Response('quota', { status: 402 }));
    const resposta = await pedir('salad');
    assert.equal(resposta.status, 502);
  });

  it('responde 502 quando a rede falha', async () => {
    simularSpoonacular(new TypeError('fetch failed'));
    const resposta = await pedir('salad');
    assert.equal(resposta.status, 502);
  });
});
