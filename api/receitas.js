// Função de servidor (Vercel): consulta o Spoonacular com a chave guardada em
// SPOONACULAR_API_KEY, enviada por cabeçalho. O navegador só conhece /api/receitas e duas
// consultas: a busca com filtros e as receitas de um plano (por id).
//
// Termos do Spoonacular respeitados aqui:
// - nada é guardado em cache (guardar exige autorização por escrito e vale por no máximo 1 h);
// - cada receita leva o nome e o link da fonte original.
import { nomeEmPortugues, traduzirBusca } from './_traducao.js';

const BASE = 'https://api.spoonacular.com';
const LIMITE_TERMO = 80;
const POR_PAGINA = 12;
const MAXIMO_DE_IDS = 21;

const DIETAS = { vegetariana: 'vegetarian', vegana: 'vegan' };
const INTOLERANCIAS = { gluten: 'gluten', lactose: 'dairy' };
const REFEICOES = {
  principal: 'main course',
  'cafe-da-manha': 'breakfast',
  salada: 'salad',
  sopa: 'soup',
  lanche: 'snack',
  sobremesa: 'dessert',
};
const TEMPOS = new Set(['15', '30', '45', '60']);

function json(corpo, status) {
  return Response.json(corpo, { status, headers: { 'Cache-Control': 'no-store' } });
}

function nutriente(receita, nome) {
  const item = receita.nutrition?.nutrients?.find((n) => n.name === nome);
  return item ? Math.round(item.amount) : null;
}

/** Só os campos que a página usa; ingredientes em medidas métricas e com nome em português quando conhecido. */
export function formatar(receita) {
  return {
    id: receita.id,
    titulo: receita.title,
    imagem: receita.image ?? null,
    minutos: receita.readyInMinutes ?? null,
    porcoes: receita.servings ?? null,
    vegetariana: Boolean(receita.vegetarian),
    vegana: Boolean(receita.vegan),
    semGluten: Boolean(receita.glutenFree),
    semLactose: Boolean(receita.dairyFree),
    fonte: { nome: receita.sourceName || 'Fonte original', url: receita.sourceUrl ?? null },
    nutricao: {
      calorias: nutriente(receita, 'Calories'),
      proteinas: nutriente(receita, 'Protein'),
      carboidratos: nutriente(receita, 'Carbohydrates'),
      gorduras: nutriente(receita, 'Fat'),
    },
    ingredientes: (receita.extendedIngredients ?? []).map((ingrediente) => ({
      nome: nomeEmPortugues(ingrediente.nameClean || ingrediente.name || ''),
      quantidade: ingrediente.measures?.metric?.amount ?? ingrediente.amount ?? null,
      unidade: ingrediente.measures?.metric?.unitShort ?? ingrediente.unit ?? '',
    })),
    passos: (receita.analyzedInstructions?.[0]?.steps ?? []).map((passo) => passo.step),
  };
}

function montarConsulta(params) {
  const ids = params.get('ids');
  if (ids !== null) {
    const lista = ids.split(',');
    if (lista.length === 0 || lista.length > MAXIMO_DE_IDS || !lista.every((id) => /^\d{1,9}$/.test(id))) {
      return { erro: 'Lista de receitas inválida.' };
    }
    return {
      caminho: '/recipes/informationBulk',
      extra: { ids: [...new Set(lista)].join(','), includeNutrition: 'true' },
      formatar: (dados) => ({ receitas: (Array.isArray(dados) ? dados : []).map(formatar) }),
    };
  }

  const termo = (params.get('q') ?? '').trim().slice(0, LIMITE_TERMO);
  if (!termo) return { erro: 'Informe o que você quer buscar.' };

  const extra = {
    query: traduzirBusca(termo) || termo,
    number: String(POR_PAGINA),
    addRecipeInformation: 'true',
    addRecipeNutrition: 'true',
    fillIngredients: 'true',
    instructionsRequired: 'true',
  };

  const dieta = params.get('dieta');
  if (dieta !== null) {
    if (!DIETAS[dieta]) return { erro: 'Dieta desconhecida.' };
    extra.diet = DIETAS[dieta];
  }
  const sem = params.getAll('sem');
  if (sem.length) {
    if (!sem.every((item) => INTOLERANCIAS[item])) return { erro: 'Restrição desconhecida.' };
    extra.intolerances = [...new Set(sem.map((item) => INTOLERANCIAS[item]))].join(',');
  }
  const refeicao = params.get('refeicao');
  if (refeicao !== null) {
    if (!REFEICOES[refeicao]) return { erro: 'Tipo de refeição desconhecido.' };
    extra.type = REFEICOES[refeicao];
  }
  const tempo = params.get('tempo');
  if (tempo !== null) {
    if (!TEMPOS.has(tempo)) return { erro: 'Tempo inválido.' };
    extra.maxReadyTime = tempo;
  }
  const pagina = params.get('pagina') ?? '1';
  if (!/^[1-9]\d?$/.test(pagina)) return { erro: 'Página inválida.' };
  extra.offset = String((Number(pagina) - 1) * POR_PAGINA);

  return {
    caminho: '/recipes/complexSearch',
    extra,
    formatar: (dados) => ({
      receitas: (dados.results ?? []).map(formatar),
      total: dados.totalResults ?? 0,
      termoUsado: extra.query,
    }),
  };
}

export async function GET(request) {
  const chave = process.env.SPOONACULAR_API_KEY;
  const params = new URL(request.url).searchParams;
  // A página pergunta antes de mostrar receitas e semana; a resposta não consulta o Spoonacular.
  if (params.has('status')) return json({ configurada: Boolean(chave) }, 200);
  if (!chave) return json({ erro: 'A busca de receitas não está configurada neste ambiente.' }, 503);

  const consulta = montarConsulta(params);
  if (consulta.erro) return json({ erro: consulta.erro }, 400);

  const url = new URL(BASE + consulta.caminho);
  url.search = new URLSearchParams(consulta.extra);

  try {
    const resposta = await fetch(url, { headers: { 'x-api-key': chave } });
    if (resposta.status === 402) {
      return json({ erro: 'O limite diário de consultas de receitas acabou. Tente amanhã.' }, 503);
    }
    if (!resposta.ok) return json({ erro: 'O serviço de receitas não respondeu. Tente de novo mais tarde.' }, 502);
    return json(consulta.formatar(await resposta.json()), 200);
  } catch {
    return json({ erro: 'O serviço de receitas não respondeu. Tente de novo mais tarde.' }, 502);
  }
}
