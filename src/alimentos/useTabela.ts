import { useEffect, useState } from 'react';
import { carregarTabela, type Alimento, type Tabela } from './dados.ts';

export type EstadoDaTabela =
  | { tipo: 'carregando' }
  | { tipo: 'erro' }
  | { tipo: 'ok'; tabela: Tabela; porId: Map<number, Alimento> };

let pronta: Extract<EstadoDaTabela, { tipo: 'ok' }> | null = null;

/** A tabela é a mesma para todas as seções: é baixada uma vez e fica na memória. */
export function useTabela(): EstadoDaTabela {
  const [estado, setEstado] = useState<EstadoDaTabela>(pronta ?? { tipo: 'carregando' });
  useEffect(() => {
    if (pronta) return;
    let ativo = true;
    carregarTabela()
      .then((tabela) => {
        pronta = { tipo: 'ok', tabela, porId: new Map(tabela.alimentos.map((a) => [a.id, a])) };
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
