import { useEffect, useState } from 'react';
import { semAcento } from '../alimentos/dados.ts';

/*
 * Receitas de "Alimentos Regionais Brasileiros" (Ministério da Saúde, 2ª ed., 2015): 111 fichas
 * técnicas testadas no laboratório de técnica dietética da UnB, com peso bruto, medida caseira e
 * informação nutricional por porção calculadas pelo Ministério. Licença CC BY-NC-SA 4.0.
 * A extração e as conferências estão em docs/receitas.md.
 */

export interface Ingrediente {
  nome: string;
  peso: string | null;
  gramas: number | null;
  medida: string | null;
}
export type ItemDaReceita = Ingrediente | { secao: string };
export const ehSecao = (item: ItemDaReceita): item is { secao: string } => 'secao' in item;

export type ChaveNutricional = 'energia' | 'carboidrato' | 'proteina' | 'gorduras' | 'saturadas' | 'trans' | 'fibra' | 'sodio';

export interface ReceitaBrasileira {
  id: number;
  nome: string;
  regiao: string;
  tipo: string;
  ingredientes: ItemDaReceita[];
  rendimento: { peso: string | null; medida: string | null };
  porcao: { peso: string | null; medida: string | null };
  /** Por porção, como na ficha técnica do livro. */
  nutricao: Record<ChaveNutricional, number>;
  preparo: { titulo: string | null; passos: string[] }[];
  /** Página da ficha técnica no livro impresso. */
  pagina: number;
}

export interface BaseDeReceitas {
  fonte: { titulo: string; edicao: string; url: string; licenca: string; licencaUrl: string };
  receitas: ReceitaBrasileira[];
}

/** Informação nutricional da ficha, com o valor diário da Anvisa (IN 75/2020) quando existe. */
export const NUTRICAO_DA_FICHA: { chave: ChaveNutricional; nome: string; unidade: string; vd: number | null }[] = [
  { chave: 'energia', nome: 'Valor energético', unidade: 'kcal', vd: 2000 },
  { chave: 'carboidrato', nome: 'Carboidratos', unidade: 'g', vd: 300 },
  { chave: 'proteina', nome: 'Proteínas', unidade: 'g', vd: 50 },
  { chave: 'gorduras', nome: 'Gorduras totais', unidade: 'g', vd: 65 },
  { chave: 'saturadas', nome: 'Gorduras saturadas', unidade: 'g', vd: 20 },
  { chave: 'trans', nome: 'Gorduras trans', unidade: 'g', vd: null },
  { chave: 'fibra', nome: 'Fibra alimentar', unidade: 'g', vd: 25 },
  { chave: 'sodio', nome: 'Sódio', unidade: 'mg', vd: 2000 },
];

export const fotoDaReceita = (receita: { id: number }) => `/receitas/ms-${receita.id}.webp`;

export function carregarReceitas(): Promise<BaseDeReceitas> {
  // Arquivo à parte (cerca de 40 KB comprimido): só baixa quando alguém pesquisa.
  return import('./ministerio.json').then((m) => m.default as unknown as BaseDeReceitas);
}

const LIGACOES = new Set(['de', 'da', 'do', 'das', 'dos', 'com', 'e', 'em', 'na', 'no', 'para', 'a', 'o']);
const palavrasDe = (termo: string) => {
  const todas = semAcento(termo).split(/[^a-z0-9]+/).filter(Boolean);
  const uteis = todas.filter((p) => !LIGACOES.has(p));
  return uteis.length ? uteis : todas;
};

/**
 * Receitas com todas as palavras no nome ou nos ingredientes; as que trazem tudo no nome vêm
 * antes. Sem nenhuma assim, "parecidas" traz as que têm alguma das palavras no nome
 * ("bolo de milho" mostra os bolos), para a pesquisa não terminar vazia.
 */
export function buscarReceitas(receitas: ReceitaBrasileira[], termo: string): { exatas: ReceitaBrasileira[]; parecidas: ReceitaBrasileira[] } {
  const palavras = palavrasDe(termo);
  if (!palavras.length) return { exatas: [], parecidas: [] };
  const pontuadas: { receita: ReceitaBrasileira; pontos: number }[] = [];
  for (const receita of receitas) {
    const nome = semAcento(receita.nome);
    const corpo = `${nome} ${semAcento(receita.ingredientes.map((i) => (ehSecao(i) ? '' : i.nome)).join(' '))}`;
    if (palavras.every((p) => nome.includes(p))) pontuadas.push({ receita, pontos: 0 });
    else if (palavras.every((p) => corpo.includes(p))) pontuadas.push({ receita, pontos: 1 });
  }
  const exatas = pontuadas.sort((a, b) => a.pontos - b.pontos || a.receita.nome.localeCompare(b.receita.nome, 'pt-BR')).map((p) => p.receita);
  if (exatas.length || palavras.length < 2) return { exatas, parecidas: [] };
  // A primeira palavra costuma ser o prato ("bolo"); as outras, o ingrediente ("milho").
  const [prato, ...resto] = palavras;
  const parecidas = receitas
    .map((receita) => {
      const nome = semAcento(receita.nome);
      const ingredientes = semAcento(receita.ingredientes.map((i) => (ehSecao(i) ? '' : i.nome)).join(' '));
      const noNome = palavras.filter((p) => nome.includes(p)).length;
      const pontos = (prato && nome.includes(prato) ? 4 : 0) + 2 * resto.filter((p) => nome.includes(p)).length + resto.filter((p) => ingredientes.includes(p)).length;
      return { receita, noNome, pontos };
    })
    .filter((p) => p.noNome > 0)
    .sort((a, b) => b.pontos - a.pontos || a.receita.nome.localeCompare(b.receita.nome, 'pt-BR'))
    .map((p) => p.receita);
  return { exatas, parecidas };
}

/** Ingredientes no formato da lista de compras: peso bruto em g ou ml (kg e l já convertidos). */
export function ingredientesParaLista(receita: ReceitaBrasileira): { nome: string; quantidade: number | null; unidade: string }[] {
  return receita.ingredientes.filter((i): i is Ingrediente => !ehSecao(i)).map((i) => {
    const unidade = i.peso?.match(/(kg|g|ml|l)$/i)?.[1]?.toLowerCase();
    return { nome: i.nome, quantidade: i.gramas, unidade: unidade === 'kg' ? 'g' : unidade === 'l' ? 'ml' : (unidade ?? '') };
  });
}

type Estado ={ tipo: 'carregando' } | { tipo: 'erro' } | { tipo: 'ok'; base: BaseDeReceitas };
let pronta: Extract<Estado, { tipo: 'ok' }> | null = null;

export function useReceitasBrasileiras(): Estado {
  const [estado, setEstado] = useState<Estado>(pronta ?? { tipo: 'carregando' });
  useEffect(() => {
    if (pronta) return;
    let ativo = true;
    carregarReceitas()
      .then((base) => {
        pronta = { tipo: 'ok', base };
        if (ativo) setEstado(pronta);
      })
      .catch(() => {
        if (ativo) setEstado({ tipo: 'erro' });
      });
    return () => {
      ativo = false;
    };
  }, []);
  return estado;
}
