import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import livro from '../src/receitas/ministerio.json' with { type: 'json' };
import { buscarReceitas, ehSecao, fotoDaReceita, ingredientesParaLista, type BaseDeReceitas } from '../src/receitas/dados.ts';

const base = livro as unknown as BaseDeReceitas;
const receita = (pagina: number) => base.receitas.find((r) => r.id === pagina)!;

describe('receitas de Alimentos Regionais Brasileiros (MS, 2015)', () => {
  it('tem as 111 fichas do Apêndice D, nas cinco regiões, cada uma com foto', () => {
    expect(base.receitas).toHaveLength(111);
    expect(new Set(base.receitas.map((r) => r.id)).size).toBe(111);
    const porRegiao = Object.fromEntries(['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'].map((r) => [r, base.receitas.filter((x) => x.regiao === r).length]));
    expect(porRegiao).toEqual({ Norte: 20, Nordeste: 25, 'Centro-Oeste': 18, Sudeste: 26, Sul: 22 });
    for (const r of base.receitas) {
      expect(existsSync(`public${fotoDaReceita(r)}`), r.nome).toBe(true);
      expect(r.ingredientes.filter((i) => !ehSecao(i)).length, r.nome).toBeGreaterThan(0);
      expect(r.preparo.flatMap((s) => s.passos).length, r.nome).toBeGreaterThan(0);
      for (const valor of Object.values(r.nutricao)) expect(typeof valor, r.nome).toBe('number');
      expect(Object.keys(r.nutricao).sort()).toEqual(['carboidrato', 'energia', 'fibra', 'gorduras', 'proteina', 'saturadas', 'sodio', 'trans']);
    }
  });

  it('confere fichas com o livro, linha por linha', () => {
    // Página 21: a medida caseira fica na linha certa mesmo com o "Sal" sem unidade inteira.
    const peixe = receita(21);
    expect(peixe.nome).toBe('Peixe recheado com castanha e abricó');
    expect(peixe.ingredientes.slice(0, 2)).toEqual([
      { nome: 'Tambaqui inteiro', peso: '2.200 g', gramas: 2200, medida: '1 unidade' },
      { nome: 'Sal', peso: '5 g', gramas: 5, medida: '1 e 1/2 colher de chá' },
    ]);
    expect(peixe.rendimento).toEqual({ peso: '3.170 g', medida: '20 porções' });
    expect(peixe.porcao).toEqual({ peso: '156 g', medida: '1 filé' });
    expect(peixe.nutricao).toMatchObject({ energia: 236.7, carboidrato: 3.55, proteina: 16.95, gorduras: 17.2, saturadas: 5.75, fibra: 0.6, sodio: 118.85 });
    expect(peixe.preparo[0]!.passos).toHaveLength(6);

    // Página 425: três seções, e o passo 2 da montagem começa no meio de uma linha no livro.
    const pierogui = receita(425);
    expect(pierogui.preparo.map((s) => s.titulo)).toEqual(['Massa', 'Recheio', 'Montagem']);
    expect(pierogui.preparo[2]!.passos[1]).toBe('Em uma panela grande, ferver grande quantidade de água com pouco sal;');
    expect(pierogui.ingredientes.filter(ehSecao).map((s) => s.secao)).toEqual(['Massa', 'Recheio']);
  });

  it('aplica as leituras documentadas: sódio em gramas com charque, "Zero", kg e erro de digitação', () => {
    expect(receita(180).nutricao.sodio).toBe(1050); // Rubacão: "1,05 g"
    expect(receita(154).nutricao.sodio).toBe(1960); // Escondidinho com charque: "1,96 g"
    expect(receita(68).nutricao.sodio).toBe(291.11); // Arroz com pupunha: "291,11 g" é mg
    expect(receita(222).nutricao.trans).toBe(0); // Pão de jatobá: "Zero"
    expect(receita(402).ingredientes[0]).toEqual({ nome: 'Beterraba', peso: '1 kg', gramas: 1000, medida: '3 unidades grandes' });
    expect(receita(135).rendimento.medida).toBe('10 porções'); // "porçõess" no livro
    expect(base.receitas.flatMap((r) => r.ingredientes).some((i) => !ehSecao(i) && /-\s/.test(i.nome))).toBe(false);
  });

  it('tem energia coerente com carboidrato, proteína e gordura em todas as fichas', () => {
    const fora = base.receitas.filter((r) => {
      const { energia, carboidrato, proteina, gorduras } = r.nutricao;
      return Math.abs(4 * carboidrato + 4 * proteina + 9 * gorduras - energia) > energia * 0.25;
    });
    expect(fora.map((r) => r.nome)).toEqual([]);
  });
});

describe('busca de receitas', () => {
  it('acha pelo nome e pelos ingredientes, com o nome primeiro', () => {
    const frango = buscarReceitas(base.receitas, 'frango').exatas.map((r) => r.nome);
    expect(frango.slice(0, 3)).toEqual(['Frango com ora-pro-nóbis', 'Frango com quiabo', 'Frango no tucupi']);
    expect(frango).toContain('Galinhada com pequi');
    expect(buscarReceitas(base.receitas, 'moqueca').exatas.map((r) => r.nome)).toEqual(['Moqueca capixaba']);
    // Também acha receitas com pão e queijo nos ingredientes, depois da que tem tudo no nome.
    expect(buscarReceitas(base.receitas, 'Pão de queijo').exatas[0]!.nome).toBe('Pão de queijo com goiabada');
  });

  it('sem receita com todas as palavras, mostra as parecidas em vez de nada', () => {
    const { exatas, parecidas } = buscarReceitas(base.receitas, 'bolo de milho');
    expect(exatas).toEqual([]);
    const nomes = parecidas.map((r) => r.nome);
    // Primeiro os bolos (o prato pedido), e entre eles os que levam milho; depois os pratos de milho.
    expect(nomes.slice(0, 9).every((n) => n.startsWith('Bolo'))).toBe(true);
    expect(nomes).toContain('Bolo de mandioca');
    expect(nomes.at(-1)).toBe('Angu de milho-verde com carne');
    expect(buscarReceitas(base.receitas, 'xyz').parecidas).toEqual([]);
  });

  it('passa os ingredientes para a lista de compras em g ou ml', () => {
    const sopa = ingredientesParaLista(receita(402));
    expect(sopa[0]).toEqual({ nome: 'Beterraba', quantidade: 1000, unidade: 'g' });
    expect(sopa.every((i) => ['g', 'ml', ''].includes(i.unidade))).toBe(true);
  });
});
