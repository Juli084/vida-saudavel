import { describe, expect, it } from 'vitest';
import { formatarQuantidade, lerPlano, listaComoTexto, montarLista, unidadeEmPortugues } from '../src/dados.ts';

describe('lista de compras', () => {
  const receitas = [
    {
      titulo: 'Salada',
      ingredientes: [
        { nome: 'tomate', quantidade: 200, unidade: 'g' },
        { nome: 'azeite', quantidade: 2, unidade: 'Tbsps' },
        { nome: 'sal', quantidade: null, unidade: '' },
      ],
    },
    {
      titulo: 'Molho',
      ingredientes: [
        { nome: 'Tomate', quantidade: 150.4, unidade: 'g' },
        { nome: 'azeite', quantidade: 1, unidade: 'tbsps' },
        { nome: 'azeite', quantidade: 30, unidade: 'ml' },
      ],
    },
  ];

  it('soma o mesmo ingrediente na mesma unidade, sem diferenciar maiúsculas', () => {
    const lista = montarLista(receitas);
    const tomate = lista.find((item) => item.nome.toLowerCase() === 'tomate');
    expect(tomate?.quantidade).toBeCloseTo(350.4);
    expect(tomate?.receitas).toEqual(['Salada', 'Molho']);
    expect(lista.filter((item) => item.nome === 'azeite').map((i) => [i.quantidade, i.unidade])).toEqual([
      [3, 'colheres de sopa'],
      [30, 'ml'],
    ]);
  });

  it('formata quantidades e unidades em português', () => {
    expect(unidadeEmPortugues('cloves')).toBe('dentes');
    expect(formatarQuantidade(350.4, 'g')).toBe('350 g');
    expect(formatarQuantidade(1.25, 'xícaras')).toBe('1,3 xícaras');
    expect(formatarQuantidade(null, '')).toBe('');
  });

  it('gera o texto para copiar ou mandar pelo WhatsApp', () => {
    expect(listaComoTexto(montarLista([receitas[0]!]))).toBe(
      'Lista de compras\n\n- azeite: 2 colheres de sopa\n- sal: \n- tomate: 200 g',
    );
  });
});

describe('plano salvo no navegador', () => {
  it('guarda só id, título e imagem do Spoonacular, e descarta o resto', () => {
    const salvo = JSON.stringify({
      'seg-almoco': { id: 1, titulo: 'Salada', imagem: 'https://img.spoonacular.com/recipes/1.jpg', ingredientes: ['x'] },
      'ter-jantar': { id: 2, titulo: 'Sopa', imagem: 'https://outro-site.example/a.jpg' },
      'qua-almoco': { id: '3', titulo: 'Inválida' },
      'xyz-almoco': { id: 4, titulo: 'Dia que não existe' },
    });
    expect(lerPlano(salvo)).toEqual({
      'seg-almoco': { id: 1, titulo: 'Salada', imagem: 'https://img.spoonacular.com/recipes/1.jpg' },
      'ter-jantar': { id: 2, titulo: 'Sopa', imagem: null },
    });
    expect(lerPlano('lixo')).toEqual({});
    expect(lerPlano('[1,2]')).toEqual({});
  });
});
