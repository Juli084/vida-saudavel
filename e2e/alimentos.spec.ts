import { expect, test } from '@playwright/test';

// A parte de alimentos não chama serviço nenhum: a tabela da TACO vai junto com o site.
test('mostra os dados só depois da pesquisa: ficha, prato e sugestões por nutriente', async ({ page }) => {
  const erros: string[] = [];
  const externas: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  page.on('console', (mensagem) => {
    if (mensagem.type() === 'error') erros.push(mensagem.text());
  });
  page.on('request', (pedido) => {
    if (!pedido.url().startsWith('http://localhost')) externas.push(pedido.url());
  });
  await page.route('**/api/receitas?status=1', (rota) => rota.fulfill({ json: { configurada: false } }));
  await page.goto('/');
  const busca = page.getByRole('region', { name: 'Pesquise um alimento ou prato' });

  await test.step('abre com o topo, a busca e as dicas, sem nenhum dado na tela', async () => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Sua jornada para uma vida\s*mais saudável começa aqui/);
    await expect(busca.getByRole('searchbox', { name: 'Alimento ou prato' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dicas Nutricionais para uma Vida Saudável' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Composição nutricional' })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Meu prato' })).toHaveCount(0);
  });

  await test.step('pesquisa sem acento e abre a ficha', async () => {
    await busca.getByRole('searchbox', { name: 'Alimento ou prato' }).fill('feijao preto');
    await busca.getByRole('button', { name: 'Buscar' }).click();
    // Duas abas, uma de cada vez: alimentos (TACO) aberta, receitas ao lado.
    await expect(busca.getByRole('tab', { name: 'Alimentos (2)' })).toHaveAttribute('aria-selected', 'true');
    await expect(busca.getByRole('tab', { name: /^Receitas/ })).toHaveAttribute('aria-selected', 'false');
    await expect(busca.getByText('2 alimentos encontrados')).toBeVisible();
    await expect(busca.getByRole('heading', { name: 'Receitas brasileiras' })).toBeHidden();

    await busca.getByRole('button', { name: /^Feijão, preto, cozido/ }).click();
    const ficha = page.getByRole('dialog', { name: 'Feijão, preto, cozido' });
    await expect(ficha.getByRole('row', { name: /Energia 77 kcal 4%/ })).toBeVisible();
    await expect(ficha.getByRole('row', { name: /Fibra alimentar 8,4 g 34%/ })).toBeVisible();

    await ficha.getByRole('button', { name: '150 g' }).click();
    await expect(ficha.getByRole('row', { name: /Energia 116 kcal 6%/ })).toBeVisible();
    await expect(ficha.getByRole('row', { name: /Fibra alimentar 12,6 g 50%/ })).toBeVisible();
    await ficha.getByRole('button', { name: 'Pôr 150 g no prato' }).click();
    await expect(ficha.getByRole('status')).toHaveText('150 g no prato.');
    await ficha.getByRole('button', { name: 'Fechar' }).click();
  });

  await test.step('o prato aparece, soma e continua lá depois de recarregar', async () => {
    await busca.getByRole('searchbox', { name: 'Alimento ou prato' }).fill('arroz integral cozido');
    await busca.getByRole('button', { name: 'Buscar' }).click();
    await busca.getByRole('button', { name: /^Arroz, integral, cozido/ }).click();
    const ficha = page.getByRole('dialog', { name: 'Arroz, integral, cozido' });
    await ficha.getByRole('button', { name: 'Pôr 100 g no prato' }).click();
    await ficha.getByRole('link', { name: 'Ver meu prato' }).click();
    await expect(ficha).toBeHidden();

    const prato = page.getByRole('region', { name: 'Meu prato' });
    await expect(prato).toBeInViewport();
    // 150 g de feijão preto (115,5 kcal) + 100 g de arroz integral (124 kcal).
    await expect(prato.getByRole('row', { name: /Energia 240 kcal 12%/ })).toBeVisible();
    await expect(prato.getByRole('row', { name: /Fibra alimentar 15,3 g 61%/ })).toBeVisible();

    await page.reload();
    await expect(prato.getByRole('row', { name: /Energia 240 kcal/ })).toBeVisible();
    await prato.getByLabel('Gramas de Arroz, integral, cozido').fill('200');
    await prato.getByLabel('Gramas de Arroz, integral, cozido').press('Enter');
    await expect(prato.getByRole('row', { name: /Energia 364 kcal/ })).toBeVisible();
  });

  await test.step('sugere alimentos pelo nutriente, por 100 g e por 100 kcal', async () => {
    await busca.getByRole('button', { name: 'mais vitamina C' }).click();
    const lista = busca.getByRole('list', { name: 'Mais vitamina C: alimentos sugeridos' });
    await expect(lista.getByRole('listitem').first()).toContainText('Acerola, crua');
    await expect(lista.getByRole('listitem').first()).toContainText('941 mg em 100 g');
    await busca.getByRole('button', { name: '100 kcal do alimento' }).click();
    await expect(lista.getByRole('listitem').first()).toContainText('em 100 kcal');
    await busca.getByRole('button', { name: 'mais proteína' }).click();
    await expect(busca.getByRole('list', { name: 'Mais proteína: alimentos sugeridos' }).getByRole('listitem')).toHaveCount(12);
  });

  expect(externas).toEqual([]);
  expect(erros).toEqual([]);
});
