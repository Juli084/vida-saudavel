// Função de servidor (Vercel): consulta o Spoonacular com a chave guardada em
// SPOONACULAR_API_KEY. A chave nunca vai para o navegador; o front-end só
// conhece /api/receitas.
const SPOONACULAR = 'https://api.spoonacular.com/recipes/complexSearch';
const LIMITE_TERMO = 80;

function json(corpo, status, cabecalhos = {}) {
  return Response.json(corpo, { status, headers: cabecalhos });
}

export async function GET(request) {
  const chave = process.env.SPOONACULAR_API_KEY;
  if (!chave) {
    return json({ erro: 'A busca de receitas não está configurada neste ambiente.' }, 503);
  }

  const termo = (new URL(request.url).searchParams.get('q') ?? '').trim().slice(0, LIMITE_TERMO);
  if (!termo) {
    return json({ erro: 'Informe o que você quer buscar.' }, 400);
  }

  const url = new URL(SPOONACULAR);
  url.search = new URLSearchParams({ query: termo, number: '12', addRecipeInformation: 'true' });

  try {
    const resposta = await fetch(url, { headers: { 'x-api-key': chave } });
    if (!resposta.ok) {
      return json({ erro: 'O serviço de receitas não respondeu. Tente de novo mais tarde.' }, 502);
    }
    const dados = await resposta.json();

    // Só os campos que a página usa.
    const receitas = (dados.results ?? []).map(({ id, title, image, readyInMinutes, vegetarian, sourceUrl }) => ({
      id,
      title,
      image,
      readyInMinutes,
      vegetarian,
      sourceUrl,
    }));

    return json({ receitas }, 200, { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' });
  } catch {
    return json({ erro: 'O serviço de receitas não respondeu. Tente de novo mais tarde.' }, 502);
  }
}
