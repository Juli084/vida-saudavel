/*
 * Composição dos alimentos: TACO 4ª edição (NEPA/UNICAMP, 2011), valores por 100 g de parte
 * comestível. Valores diários de referência: Anvisa, IN nº 75/2020, Anexo II (população acima
 * de 3 anos). Como os números foram extraídos e conferidos está em docs/dados.md.
 */

/** Número, "Tr" (traço: presente, mas abaixo do limite de quantificação) ou null (sem dado). */
export type Valor = number | 'Tr' | null;

export const NUTRIENTES = [
  { chave: 'energia', nome: 'Energia', unidade: 'kcal', vd: 2000 },
  { chave: 'carboidrato', nome: 'Carboidratos', unidade: 'g', vd: 300 },
  { chave: 'proteina', nome: 'Proteínas', unidade: 'g', vd: 50 },
  { chave: 'lipideos', nome: 'Gorduras totais', unidade: 'g', vd: 65 },
  { chave: 'saturados', nome: 'Gorduras saturadas', unidade: 'g', vd: 20 },
  { chave: 'fibra', nome: 'Fibra alimentar', unidade: 'g', vd: 25 },
  { chave: 'sodio', nome: 'Sódio', unidade: 'mg', vd: 2000 },
  { chave: 'colesterol', nome: 'Colesterol', unidade: 'mg', vd: 300 },
  { chave: 'calcio', nome: 'Cálcio', unidade: 'mg', vd: 1000 },
  { chave: 'ferro', nome: 'Ferro', unidade: 'mg', vd: 14 },
  { chave: 'potassio', nome: 'Potássio', unidade: 'mg', vd: 3500 },
  { chave: 'magnesio', nome: 'Magnésio', unidade: 'mg', vd: 420 },
  { chave: 'zinco', nome: 'Zinco', unidade: 'mg', vd: 11 },
  { chave: 'fosforo', nome: 'Fósforo', unidade: 'mg', vd: 700 },
  { chave: 'vitaminaC', nome: 'Vitamina C', unidade: 'mg', vd: 100 },
  { chave: 'vitaminaA', nome: 'Vitamina A', unidade: 'µg', vd: 800 },
  { chave: 'tiamina', nome: 'Tiamina (B1)', unidade: 'mg', vd: 1.2 },
  { chave: 'riboflavina', nome: 'Riboflavina (B2)', unidade: 'mg', vd: 1.2 },
  { chave: 'piridoxina', nome: 'Vitamina B6', unidade: 'mg', vd: 1.3 },
  // A TACO dá a niacina pré-formada; a referência da Anvisa é em equivalentes de niacina,
  // que incluem a conversão do triptofano. Por isso a niacina aparece sem %VD.
  { chave: 'niacina', nome: 'Niacina (B3)', unidade: 'mg', vd: null },
] as const;

export type ChaveDeNutriente = (typeof NUTRIENTES)[number]['chave'];
export type Nutriente = (typeof NUTRIENTES)[number];

export interface Alimento extends Record<ChaveDeNutriente, Valor> {
  id: number;
  nome: string;
  grupo: number;
}

export interface Tabela {
  fonte: string;
  grupos: string[];
  alimentos: Alimento[];
}

export function nutriente(chave: ChaveDeNutriente): Nutriente {
  return NUTRIENTES.find((n) => n.chave === chave)!;
}

/** A tabela tem 200 KB: só é baixada quando alguém usa a parte de alimentos. */
let carregando: Promise<Tabela> | null = null;
export function carregarTabela(): Promise<Tabela> {
  carregando ??= import('./taco.json').then((m) => m.default as Tabela).catch((erro: unknown) => {
    carregando = null;
    throw erro;
  });
  return carregando;
}

/* ---------- Busca ---------- */

export function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/**
 * Todas as palavras digitadas precisam aparecer no nome, sem importar acento ou ordem
 * ("feijao preto" acha "Feijão, preto, cozido"). Quem começa com a primeira palavra vem antes,
 * e o cozido vem antes do cru, porque é o que se come.
 */
export function buscar(alimentos: Alimento[], termo: string, grupo: number | null = null): Alimento[] {
  const palavras = semAcento(termo).split(/[\s,]+/).filter(Boolean);
  const pontuados: { alimento: Alimento; pontos: number }[] = [];
  for (const alimento of alimentos) {
    if (grupo !== null && alimento.grupo !== grupo) continue;
    const nome = semAcento(alimento.nome);
    if (!palavras.every((p) => nome.includes(p))) continue;
    let pontos = 0;
    const primeira = palavras[0];
    if (primeira && nome.startsWith(primeira)) pontos -= 10;
    if (/\bcru[a]?\b/.test(nome)) pontos += 1;
    pontuados.push({ alimento, pontos });
  }
  return pontuados.sort((a, b) => a.pontos - b.pontos || a.alimento.nome.localeCompare(b.alimento.nome, 'pt-BR')).map((p) => p.alimento);
}

/* ---------- Porção e %VD ---------- */

/** Valor numérico para conta: traço conta como zero; sem dado continua null. */
export function numero(valor: Valor): number | null {
  return valor === 'Tr' ? 0 : valor;
}

/** Valor na porção (a TACO é por 100 g). */
export function naPorcao(valor: Valor, gramas: number): Valor {
  if (valor === null || valor === 'Tr') return valor;
  return (valor * gramas) / 100;
}

export function percentualDoVd(valor: Valor, n: Nutriente): number | null {
  const v = numero(valor);
  if (v === null || n.vd === null) return null;
  return (v / n.vd) * 100;
}

export function formatarValor(valor: Valor, unidade: string): string {
  if (valor === null) return '–';
  if (valor === 'Tr') return 'traços';
  const casas = unidade === 'kcal' ? 0 : valor >= 100 ? 0 : valor >= 10 ? 1 : unidade === 'g' ? 1 : 2;
  const texto = valor.toLocaleString('pt-BR', { maximumFractionDigits: casas, minimumFractionDigits: 0 });
  return `${texto} ${unidade}`;
}

export function formatarPercentual(percentual: number | null): string {
  if (percentual === null) return '';
  if (percentual > 0 && percentual < 1) return 'menos de 1%';
  return `${Math.round(percentual).toLocaleString('pt-BR')}%`;
}

/* ---------- Sugestões ---------- */

export const OBJETIVOS = [
  { id: 'fibra', nome: 'Mais fibra', chave: 'fibra', ordem: 'maior' },
  { id: 'proteina', nome: 'Mais proteína', chave: 'proteina', ordem: 'maior' },
  { id: 'ferro', nome: 'Mais ferro', chave: 'ferro', ordem: 'maior' },
  { id: 'calcio', nome: 'Mais cálcio', chave: 'calcio', ordem: 'maior' },
  { id: 'vitaminaC', nome: 'Mais vitamina C', chave: 'vitaminaC', ordem: 'maior' },
  { id: 'vitaminaA', nome: 'Mais vitamina A', chave: 'vitaminaA', ordem: 'maior' },
  { id: 'potassio', nome: 'Mais potássio', chave: 'potassio', ordem: 'maior' },
  { id: 'calorias', nome: 'Menos calorias', chave: 'energia', ordem: 'menor' },
] as const satisfies readonly { id: string; nome: string; chave: ChaveDeNutriente; ordem: 'maior' | 'menor' }[];

export type Objetivo = (typeof OBJETIVOS)[number];

// Grupos da TACO que não entram nas sugestões: sal, fermento e temperos; doces; bebidas;
// industrializados. O foco é o que o Guia Alimentar recomenda como base da alimentação.
const GRUPOS_FORA_DAS_SUGESTOES = new Set([
  'Miscelâneas',
  'Produtos açucarados',
  'Bebidas (alcoólicas e não alcoólicas)',
  'Outros alimentos industrializados',
  'Gorduras e óleos',
]);
// Nestes grupos o alimento cru não é o que se come (arroz, feijão, carne, peixe, ovo).
const GRUPOS_QUE_SE_COZINHAM = new Set(['Cereais e derivados', 'Leguminosas e derivados', 'Carnes e derivados', 'Pescados e frutos do mar', 'Ovos e derivados']);

export function entraNasSugestoes(alimento: Alimento, grupos: string[]): boolean {
  const grupo = grupos[alimento.grupo] ?? '';
  if (GRUPOS_FORA_DAS_SUGESTOES.has(grupo)) return false;
  const nome = semAcento(alimento.nome);
  if (GRUPOS_QUE_SE_COZINHAM.has(grupo) && /\bcru[a]?\b/.test(nome) && !/\baveia\b/.test(nome)) return false;
  // Ingredientes concentrados e industrializados: por 100 g ganhariam de tudo (coentro
  // desidratado, leite em pó, farinha de soja), mas não são o que se põe no prato.
  if (/desidratad|\bpo\b|farinha|fuba|polvilho|amido|fecula|mistura para|industrializad|\bchips\b|em conserva/.test(nome)) return false;
  // Ultraprocessados que o Guia Alimentar pede para evitar, mesmo quando têm muito de algum
  // nutriente: embutidos, empanados, pão de forma, biscoitos, bolos e bebidas prontas.
  if (/hamburguer|salsicha|linguica|mortadela|presunto|apresuntado|salame|nuggets|empanad|\bforma\b|biscoito|\bbolo\b|petit suisse|envasad|concentrado|extrato|cereal matinal/.test(nome)) return false;
  return true;
}

/** Base da comparação: por 100 g (o peso) ou por 100 kcal (densidade de nutrientes). */
export type Base = '100g' | '100kcal';

/** Valor do nutriente na base escolhida; null quando não dá para calcular. */
export function valorNaBase(alimento: Alimento, chave: ChaveDeNutriente, base: Base): number | null {
  const v = numero(alimento[chave]);
  if (v === null) return null;
  if (base === '100g') return v;
  const kcal = numero(alimento.energia);
  return kcal ? (v / kcal) * 100 : null;
}

/**
 * Ranking de alimentos para um objetivo. Alimento sem o dado fica de fora; em "menos
 * calorias", também os de valor zero (como água), e a base é sempre 100 g.
 */
export function sugerir(tabela: Tabela, objetivo: Objetivo, grupo: number | null = null, limite = 12, base: Base = '100g'): Alimento[] {
  const baseUsada: Base = objetivo.chave === 'energia' ? '100g' : base;
  const pontuados: { alimento: Alimento; valor: number }[] = [];
  for (const a of tabela.alimentos) {
    if (grupo !== null && a.grupo !== grupo) continue;
    if (!entraNasSugestoes(a, tabela.grupos)) continue;
    const valor = valorNaBase(a, objetivo.chave, baseUsada);
    if (valor !== null && valor > 0) pontuados.push({ alimento: a, valor });
  }
  pontuados.sort((a, b) => (objetivo.ordem === 'maior' ? b.valor - a.valor : a.valor - b.valor));
  return pontuados.slice(0, limite).map((p) => p.alimento);
}

/* ---------- Prato ---------- */

export interface ItemDoPrato {
  id: number;
  gramas: number;
}

export interface Total {
  valor: number;
  /** Quantos itens do prato não têm este nutriente na tabela (o total fica por baixo). */
  semDado: number;
}

export function totalDoPrato(itens: ItemDoPrato[], porId: Map<number, Alimento>): Record<ChaveDeNutriente, Total> {
  const totais = Object.fromEntries(NUTRIENTES.map((n) => [n.chave, { valor: 0, semDado: 0 }])) as Record<ChaveDeNutriente, Total>;
  for (const item of itens) {
    const alimento = porId.get(item.id);
    if (!alimento) continue;
    for (const n of NUTRIENTES) {
      const v = numero(alimento[n.chave]);
      if (v === null) totais[n.chave].semDado += 1;
      else totais[n.chave].valor += (v * item.gramas) / 100;
    }
  }
  return totais;
}
