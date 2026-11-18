import { expect, test, type Page } from '@playwright/test';

const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');

const receita = (id: number, titulo: string, ingredientes: { nome: string; quantidade: number; unidade: string }[]) => ({
  id,
  titulo,
  imagem: `https://img.spoonacular.com/recipes/${id}-312x231.jpg`,
  minutos: 25,
  porcoes: 2,
  vegetariana: true,
  vegana: false,
  semGluten: true,
  semLactose: false,
  fonte: { nome: 'Blog de Exemplo', url: 'https://blog.example/receita' },
  nutricao: { calorias: 420, proteinas: 18, carboidratos: 50, gorduras: 12 },
  ingredientes,
  passos: ['Chop the vegetables.', 'Mix everything.'],
});

const SALADA = receita(1, 'Chickpea Salad', [
  { nome: 'grão-de-bico', quantidade: 200, unidade: 'g' },
  { nome: 'tomate', quantidade: 100, unidade: 'g' },
]);
const SOPA = receita(2, 'Tomato Soup', [{ nome: 'tomate', quantidade: 300, unidade: 'g' }]);

async function simular(page: Page) {
  const consultas: URLSearchParams[] = [];
  await page.route('https://img.spoonacular.com/**', (rota) => rota.fulfill({ contentType: 'image/png', body: PNG_1X1 }));
  await page.route('**/api/receitas?**', (rota) => {
    const p = new URL(rota.request().url()).searchParams;
    consultas.push(p);
    if (p.get('ids')) {
      const ids = p.get('ids')!.split(',');
      return rota.fulfill({ json: { receitas: [SALADA, SOPA].filter((r) => ids.includes(String(r.id))) } });
    }
    return rota.fulfill({ json: { receitas: [SALADA, SOPA], total: 2, termoUsado: 'chickpea' } });
  });
  return consultas;
}

test('busca com filtros, planeja a semana e soma a lista de compras', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  page.on('console', (mensagem) => {
    if (mensagem.type() === 'error') erros.push(mensagem.text());
  });
  const consultas = await simular(page);
  await page.goto('/');

  await page.getByRole('textbox', { name: 'O que você quer cozinhar' }).fill('grão de bico');
  await page.getByRole('button', { name: 'Vegetariana' }).click();
  await page.getByRole('button', { name: 'Sem glúten' }).click();
  await page.getByLabel('Tempo de preparo').selectOption('30');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByText('2 receitas para "chickpea"')).toBeVisible();
  const busca = consultas.at(-1)!;
  expect([busca.get('q'), busca.get('dieta'), busca.getAll('sem'), busca.get('tempo')]).toEqual(['grão de bico', 'vegetariana', ['gluten'], '30']);

  await page.getByRole('button', { name: /Chickpea Salad/ }).click();
  const detalhe = page.getByRole('dialog', { name: 'Chickpea Salad' });
  await expect(detalhe.getByText('420 kcal')).toBeVisible();
  await expect(detalhe.getByRole('link', { name: /Blog de Exemplo/ })).toHaveAttribute('href', 'https://blog.example/receita');
  await detalhe.getByLabel('Dia').selectOption('qua');
  await detalhe.getByRole('button', { name: 'Pôr na semana' }).click();
  await expect(detalhe.getByRole('status')).toHaveText('Adicionada em Quarta, almoço.');
  await detalhe.getByRole('button', { name: 'Fechar' }).click();

  await page.getByRole('button', { name: /Tomato Soup/ }).click();
  const sopa = page.getByRole('dialog', { name: 'Tomato Soup' });
  await sopa.getByLabel('Refeição').selectOption('jantar');
  await sopa.getByRole('button', { name: 'Pôr na semana' }).click();
  await sopa.getByRole('button', { name: 'Fechar' }).click();

  const semana = page.getByRole('region', { name: 'Minha semana' });
  await expect(semana.getByText('Chickpea Salad')).toBeVisible();
  await semana.getByRole('button', { name: 'Montar com 2 receitas' }).click();
  await expect(semana.getByText('400 g')).toBeVisible();
  expect(consultas.at(-1)!.get('ids')).toBe('1,2');

  // Riscar o que já tem em casa tira o item do texto enviado.
  await semana.getByRole('checkbox', { name: /grão-de-bico/ }).check();
  const whatsapp = semana.getByRole('link', { name: 'Enviar pelo WhatsApp' });
  const texto = decodeURIComponent((await whatsapp.getAttribute('href'))!.split('text=')[1]!);
  expect(texto).toBe('Lista de compras\n\n- tomate: 400 g');

  // O plano sobrevive a recarregar a página; a lista é montada de novo.
  await page.reload();
  await expect(page.getByRole('region', { name: 'Minha semana' }).getByText('Tomato Soup')).toBeVisible();
  expect(erros).toEqual([]);
});

test('mostra os dez passos com o link para o guia oficial', async ({ page }) => {
  await simular(page);
  await page.goto('/');
  const guia = page.getByRole('region', { name: 'Dez passos para comer bem' });
  await expect(guia.getByRole('listitem')).toHaveCount(10);
  await expect(guia.getByRole('link', { name: /Guia Alimentar para a População Brasileira/ })).toHaveAttribute(
    'href',
    'https://bvsms.saude.gov.br/bvs/publicacoes/guia_alimentar_populacao_brasileira_2ed.pdf',
  );
  const sobra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(sobra).toBeLessThanOrEqual(0);
});
