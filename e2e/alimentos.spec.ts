import { expect, test } from '@playwright/test';

// A parte de alimentos não chama serviço nenhum: a tabela da TACO vai junto com o site.
test('busca um alimento, ajusta a porção, monta o prato e recebe sugestões', async ({ page }) => {
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

  await test.step('busca sem acento e abre a ficha', async () => {
    await page.getByRole('searchbox', { name: 'Buscar alimento' }).fill('feijao preto');
    await expect(page.getByText('2 alimentos · valores por 100 g')).toBeVisible();
    await page.getByRole('button', { name: /^Feijão, preto, cozido/ }).click();
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

  await test.step('soma o prato e guarda depois de recarregar', async () => {
    await page.getByRole('searchbox', { name: 'Buscar alimento' }).fill('arroz integral cozido');
    await page.getByRole('button', { name: /^Arroz, integral, cozido/ }).click();
    const ficha = page.getByRole('dialog', { name: 'Arroz, integral, cozido' });
    await ficha.getByRole('button', { name: 'Pôr 100 g no prato' }).click();
    await ficha.getByRole('button', { name: 'Fechar' }).click();

    const prato = page.getByRole('region', { name: 'Meu prato' });
    // 150 g de feijão preto (115,5 kcal) + 100 g de arroz integral (124 kcal).
    await expect(prato.getByRole('row', { name: /Energia 240 kcal 12%/ })).toBeVisible();
    await expect(prato.getByRole('row', { name: /Fibra alimentar 15,3 g 61%/ })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('region', { name: 'Meu prato' }).getByRole('row', { name: /Energia 240 kcal/ })).toBeVisible();
    await prato.getByLabel('Gramas de Arroz, integral, cozido').fill('200');
    await prato.getByLabel('Gramas de Arroz, integral, cozido').press('Enter');
    await expect(prato.getByRole('row', { name: /Energia 364 kcal/ })).toBeVisible();
  });

  await test.step('sugere alimentos pelo nutriente, por 100 g e por 100 kcal', async () => {
    const sugestoes = page.getByRole('region', { name: 'Sugestões de alimentos' });
    await sugestoes.getByRole('button', { name: 'Mais vitamina C' }).click();
    const lista = sugestoes.getByRole('list', { name: 'Mais vitamina C: alimentos sugeridos' });
    await expect(lista.getByRole('listitem').first()).toContainText('Acerola, crua');
    await expect(lista.getByRole('listitem').first()).toContainText('941 mg em 100 g');
    await sugestoes.getByRole('button', { name: '100 kcal do alimento' }).click();
    await expect(lista.getByRole('listitem').first()).toContainText('em 100 kcal');
    await sugestoes.getByRole('button', { name: 'Mais proteína' }).click();
    await expect(sugestoes.getByRole('list', { name: 'Mais proteína: alimentos sugeridos' }).getByRole('listitem')).toHaveCount(12);
  });

  await test.step('sem a chave do Spoonacular, explica em vez de mostrar uma busca que daria erro', async () => {
    await expect(page.getByRole('heading', { name: 'Receitas e plano da semana' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Minha semana' })).toHaveCount(0);
  });

  expect(externas).toEqual([]);
  expect(erros).toEqual([]);
});
