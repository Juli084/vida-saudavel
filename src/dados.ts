import { useSyncExternalStore } from 'react';

export interface Receita {
  id: number;
  titulo: string;
  imagem: string | null;
  minutos: number | null;
  porcoes: number | null;
  vegetariana: boolean;
  vegana: boolean;
  semGluten: boolean;
  semLactose: boolean;
  fonte: { nome: string; url: string | null };
  nutricao: { calorias: number | null; proteinas: number | null; carboidratos: number | null; gorduras: number | null };
  ingredientes: { nome: string; quantidade: number | null; unidade: string }[];
  passos: string[];
}

export type Resultado<T> = { tipo: 'ok'; dados: T } | { tipo: 'erro'; mensagem: string };

export async function consultar<T>(parametros: URLSearchParams): Promise<Resultado<T>> {
  try {
    const resposta = await fetch(`/api/receitas?${parametros}`);
    const dados = (await resposta.json().catch(() => ({}))) as T & { erro?: string };
    if (!resposta.ok) return { tipo: 'erro', mensagem: dados.erro ?? 'Não foi possível carregar as receitas.' };
    return { tipo: 'ok', dados };
  } catch {
    return { tipo: 'erro', mensagem: 'Não foi possível carregar as receitas. Confira a conexão.' };
  }
}

/* ---------- Plano da semana ----------
 * Os termos do Spoonacular só permitem guardar id, título e imagem da receita. O plano
 * guarda só isso; ingredientes e nutrição são buscados de novo quando a lista é montada.
 */

export const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;
export const NOMES_DOS_DIAS: Record<Dia, string> = {
  seg: 'Segunda',
  ter: 'Terça',
  qua: 'Quarta',
  qui: 'Quinta',
  sex: 'Sexta',
  sab: 'Sábado',
  dom: 'Domingo',
};
export const REFEICOES = ['almoco', 'jantar'] as const;
export const NOMES_DAS_REFEICOES: Record<Refeicao, string> = { almoco: 'Almoço', jantar: 'Jantar' };

export type Dia = (typeof DIAS)[number];
export type Refeicao = (typeof REFEICOES)[number];
export interface ReceitaNoPlano {
  id: number;
  titulo: string;
  imagem: string | null;
}
export type Plano = Partial<Record<`${Dia}-${Refeicao}`, ReceitaNoPlano>>;

const CHAVE_DO_PLANO = 'vida-saudavel:plano:v1';
const ouvintes = new Set<() => void>();
let cache: Plano | null = null;

export function lerPlano(texto: string | null): Plano {
  try {
    const bruto: unknown = texto ? JSON.parse(texto) : {};
    if (typeof bruto !== 'object' || bruto === null || Array.isArray(bruto)) return {};
    const plano: Plano = {};
    for (const dia of DIAS) {
      for (const refeicao of REFEICOES) {
        const item = (bruto as Record<string, unknown>)[`${dia}-${refeicao}`];
        if (typeof item !== 'object' || item === null) continue;
        const { id, titulo, imagem } = item as Record<string, unknown>;
        if (!Number.isInteger(id) || typeof titulo !== 'string') continue;
        // Só imagem do próprio Spoonacular: a CSP não carrega de outros domínios.
        const imagemValida = typeof imagem === 'string' && /^https:\/\/img\.spoonacular\.com\//.test(imagem) ? imagem : null;
        plano[`${dia}-${refeicao}`] = { id: id as number, titulo: titulo.slice(0, 200), imagem: imagemValida };
      }
    }
    return plano;
  } catch {
    return {};
  }
}

function carregar(): Plano {
  if (cache) return cache;
  try {
    cache = lerPlano(localStorage.getItem(CHAVE_DO_PLANO));
  } catch {
    cache = {};
  }
  return cache;
}

function salvar(plano: Plano) {
  cache = plano;
  try {
    localStorage.setItem(CHAVE_DO_PLANO, JSON.stringify(plano));
  } catch {
    // Sem armazenamento, o plano vale até fechar a aba.
  }
  ouvintes.forEach((ouvir) => ouvir());
}

export function colocarNoPlano(dia: Dia, refeicao: Refeicao, receita: Receita) {
  salvar({ ...carregar(), [`${dia}-${refeicao}`]: { id: receita.id, titulo: receita.titulo, imagem: receita.imagem } });
}

export function tirarDoPlano(dia: Dia, refeicao: Refeicao) {
  const plano = { ...carregar() };
  delete plano[`${dia}-${refeicao}`];
  salvar(plano);
}

export function limparPlano() {
  salvar({});
}

export function usePlano(): Plano {
  return useSyncExternalStore(
    (ouvir) => {
      ouvintes.add(ouvir);
      return () => ouvintes.delete(ouvir);
    },
    carregar,
    () => ({}),
  );
}

/* ---------- Lista de compras ---------- */

const UNIDADES: Record<string, string> = {
  tbsp: 'colher de sopa',
  tbsps: 'colheres de sopa',
  tsp: 'colher de chá',
  tsps: 'colheres de chá',
  cup: 'xícara',
  cups: 'xícaras',
  clove: 'dente',
  cloves: 'dentes',
  pinch: 'pitada',
  pinches: 'pitadas',
  serving: 'porção',
  servings: 'porções',
  large: 'grande',
  medium: 'média',
  small: 'pequena',
  slice: 'fatia',
  slices: 'fatias',
  can: 'lata',
  cans: 'latas',
  handful: 'punhado',
};

export function unidadeEmPortugues(unidade: string): string {
  return UNIDADES[unidade.toLowerCase()] ?? unidade;
}

export interface ItemDaLista {
  nome: string;
  quantidade: number | null;
  unidade: string;
  /** Receitas que pedem este ingrediente, para a pessoa saber de onde veio. */
  receitas: string[];
}

/**
 * Soma o mesmo ingrediente na mesma unidade; unidades diferentes ficam em linhas
 * separadas, porque 2 xícaras e 200 g de farinha não se somam sem a densidade.
 */
export function montarLista(receitas: { titulo: string; ingredientes: Receita['ingredientes'] }[]): ItemDaLista[] {
  const itens = new Map<string, ItemDaLista>();
  for (const receita of receitas) {
    for (const ingrediente of receita.ingredientes) {
      const nome = ingrediente.nome.trim();
      if (!nome) continue;
      const unidade = unidadeEmPortugues(ingrediente.unidade.trim());
      const chave = `${nome.toLowerCase()}|${unidade.toLowerCase()}`;
      const existente = itens.get(chave);
      if (existente) {
        existente.quantidade =
          existente.quantidade !== null && ingrediente.quantidade !== null ? existente.quantidade + ingrediente.quantidade : existente.quantidade ?? ingrediente.quantidade;
        if (!existente.receitas.includes(receita.titulo)) existente.receitas.push(receita.titulo);
      } else {
        itens.set(chave, { nome, quantidade: ingrediente.quantidade, unidade, receitas: [receita.titulo] });
      }
    }
  }
  return [...itens.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export function formatarQuantidade(quantidade: number | null, unidade: string): string {
  if (quantidade === null) return unidade;
  const arredondada = ['g', 'ml'].includes(unidade) ? Math.round(quantidade) : Math.round(quantidade * 10) / 10;
  return `${arredondada.toLocaleString('pt-BR')}${unidade ? ` ${unidade}` : ''}`;
}

export function listaComoTexto(itens: ItemDaLista[]): string {
  return ['Lista de compras', '', ...itens.map((item) => `- ${item.nome}: ${formatarQuantidade(item.quantidade, item.unidade)}`)].join('\n');
}
