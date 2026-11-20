import { expect, test } from '@playwright/test';

// As receitas brasileiras vão junto com o site: pesquisar, abrir, pôr na semana e montar a
// lista de compras não chama serviço nenhum.
test('receitas brasileiras: pesquisa, ficha com nutrição, semana e lista de compras', async ({ page }) => {
  const erros: string[] = [];
  const externas: string[] = [];
  const api: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  page.on('console', (mensagem) => {
    if (mensagem.type() === 'error') erros.push(mensagem.text());
  });
  page.on('request', (pedido) => {
    if (!pedido.url().startsWith('http://localhost')) externas.push(pedido.url());
    if (pedido.url().includes('/api/receitas?') && !pedido.url().includes('status=1')) api.push(pedido.url());
  });
  await page.route('**/api/receitas?status=1', (rota) => rota.fulfill({ json: { configurada: true } }));
  await page.goto('/');
  const busca = page.getByRole('region', { name: 'Pesquise um alimento ou prato' });

  await test.step('prato sem alimento com esse nome abre direto na aba de receitas', async () => {
    await busca.getByRole('searchbox', { name: 'Alimento ou prato' }).fill('moqueca');
    await busca.getByRole('button', { name: 'Buscar' }).click();
    await expect(busca.getByRole('tab', { name: 'Receitas (1)' })).toHaveAttribute('aria-selected', 'true');
    await expect(busca.getByRole('tab', { name: 'Alimentos (0)' })).toBeVisible();
    await busca.getByRole('button', { name: /^Moqueca capixaba/ }).click();
  });

  await test.step('ficha com ingredientes em medida caseira e peso, preparo e nutrição por porção', async () => {
    const ficha = page.getByRole('dialog', { name: 'Moqueca capixaba' });
    await expect(ficha.getByText('Região Sudeste · Prato principal')).toBeVisible();
    await expect(ficha.getByRole('listitem').filter({ hasText: 'Postas de dourado' })).toContainText('13 postas pequenas · 1.700 g');
    await expect(ficha.getByRole('row', { name: /Valor energético 133 kcal 7%/ })).toBeVisible();
    await expect(ficha.getByRole('row', { name: /Sódio 377 mg 19%/ })).toBeVisible();
    await expect(ficha.getByRole('link', { name: /Alimentos Regionais Brasileiros/ })).toHaveAttribute(
      'href',
      'https://bvsms.saude.gov.br/bvs/publicacoes/alimentos_regionais_brasileiros_2ed.pdf',
    );
    await ficha.getByRole('button', { name: 'Pôr na semana' }).click();
    await expect(ficha.getByRole('status')).toHaveText('Adicionada em Segunda, almoço.');
    await ficha.getByRole('button', { name: 'Fechar' }).click();
  });

  await test.step('a lista de compras soma os ingredientes do livro, sem consultar o Spoonacular', async () => {
    const semana = page.getByRole('region', { name: 'Minha semana' });
    await expect(semana.getByText('Moqueca capixaba')).toBeVisible();
    await semana.getByRole('button', { name: 'Montar com 1 receita' }).click();
    await expect(semana.getByRole('listitem').filter({ hasText: 'Postas de dourado' })).toContainText('1.700 g');
  });

  await test.step('sem receita com todas as palavras, mostra as parecidas', async () => {
    await busca.getByRole('searchbox', { name: 'Alimento ou prato' }).fill('bolo de milho');
    await busca.getByRole('button', { name: 'Buscar' }).click();
    await busca.getByRole('tab', { name: /^Receitas/ }).click();
    await expect(busca.getByText(/Nenhuma receita do livro com todas essas palavras/)).toBeVisible();
    await expect(busca.getByRole('button', { name: /^Bolo de mandioca/ })).toBeVisible();
    await expect(busca.getByRole('button', { name: 'Ver receitas internacionais' })).toBeVisible();
  });

  expect(api).toEqual([]);
  expect(externas).toEqual([]);
  expect(erros).toEqual([]);
});
