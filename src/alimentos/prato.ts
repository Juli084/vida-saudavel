import { useSyncExternalStore } from 'react';
import type { ItemDoPrato } from './dados.ts';

/* O prato montado fica no navegador, conferido ao ler: id inteiro e gramas entre 1 e 2.000. */

const CHAVE = 'vida-saudavel:prato:v1';
export const LIMITE_DE_ITENS = 20;
export const GRAMAS_MAXIMAS = 2000;
const ouvintes = new Set<() => void>();
let cache: ItemDoPrato[] | null = null;

export function gramasValidas(gramas: number): number {
  if (!Number.isFinite(gramas)) return 100;
  return Math.min(GRAMAS_MAXIMAS, Math.max(1, Math.round(gramas)));
}

export function lerPrato(texto: string | null): ItemDoPrato[] {
  try {
    const bruto: unknown = texto ? JSON.parse(texto) : [];
    if (!Array.isArray(bruto)) return [];
    const itens: ItemDoPrato[] = [];
    for (const item of bruto) {
      if (typeof item !== 'object' || item === null) continue;
      const { id, gramas } = item as Record<string, unknown>;
      if (!Number.isInteger(id) || (id as number) < 1 || typeof gramas !== 'number') continue;
      if (itens.some((i) => i.id === id)) continue;
      itens.push({ id: id as number, gramas: gramasValidas(gramas) });
    }
    return itens.slice(0, LIMITE_DE_ITENS);
  } catch {
    return [];
  }
}

function carregar(): ItemDoPrato[] {
  if (cache) return cache;
  try {
    cache = lerPrato(localStorage.getItem(CHAVE));
  } catch {
    cache = [];
  }
  return cache;
}

function salvar(itens: ItemDoPrato[]) {
  cache = itens;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(itens));
  } catch {
    // Sem armazenamento, o prato vale até fechar a aba.
  }
  ouvintes.forEach((ouvir) => ouvir());
}

/** Põe no prato; se o alimento já está lá, soma as gramas. */
export function porNoPrato(id: number, gramas: number) {
  const atual = carregar();
  const existente = atual.find((i) => i.id === id);
  if (existente) salvar(atual.map((i) => (i.id === id ? { id, gramas: gramasValidas(i.gramas + gramas) } : i)));
  else salvar([...atual, { id, gramas: gramasValidas(gramas) }].slice(0, LIMITE_DE_ITENS));
}

export function mudarGramas(id: number, gramas: number) {
  salvar(carregar().map((i) => (i.id === id ? { id, gramas: gramasValidas(gramas) } : i)));
}

export function tirarDoPrato(id: number) {
  salvar(carregar().filter((i) => i.id !== id));
}

export function esvaziarPrato() {
  salvar([]);
}

export function usePrato(): ItemDoPrato[] {
  return useSyncExternalStore(
    (ouvir) => {
      ouvintes.add(ouvir);
      return () => ouvintes.delete(ouvir);
    },
    carregar,
    () => [],
  );
}
