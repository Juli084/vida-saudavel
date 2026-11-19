import { useMemo, useState } from 'react';
import {
  formatarPercentual,
  formatarValor,
  nutriente,
  OBJETIVOS,
  percentualDoVd,
  sugerir,
  valorNaBase,
  type Alimento,
  type Base,
  type Objetivo,
} from '../alimentos/dados.ts';
import { useTabela } from '../alimentos/useTabela.ts';
import { CartaoDoAlimento } from './Alimentos.tsx';
import { FichaDoAlimento } from './FichaDoAlimento.tsx';

export function Sugestoes() {
  const estado = useTabela();
  const [objetivo, setObjetivo] = useState<Objetivo>(OBJETIVOS[0]);
  const [grupo, setGrupo] = useState<number | null>(null);
  const [baseEscolhida, setBase] = useState<Base>('100g');
  const [aberto, setAberto] = useState<Alimento | null>(null);
  const grupos = estado.tipo === 'ok' ? estado.tabela.grupos : [];
  // "Menos calorias" só faz sentido por 100 g.
  const base: Base = objetivo.chave === 'energia' ? '100g' : baseEscolhida;
  const lista = useMemo(() => (estado.tipo === 'ok' ? sugerir(estado.tabela, objetivo, grupo, 12, base) : []), [estado, objetivo, grupo, base]);
  const n = nutriente(objetivo.chave);

  return (
    <section id="sugestoes" aria-labelledby="titulo-sugestoes" className="scroll-mt-20">
      <h2 id="titulo-sugestoes" className="text-2xl font-bold">
        Sugestões de alimentos
      </h2>
      <p className="mt-1 text-sm text-suave">
        Os alimentos da tabela com mais (ou menos) de cada nutriente. Ficam de fora sal, temperos, doces, bebidas, óleos,
        farinhas e ultraprocessados, e o que só se come cozido aparece cozido.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Objetivo">
        {OBJETIVOS.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={objetivo.id === o.id}
            onClick={() => setObjetivo(o)}
            className={`rounded-full border px-3 py-1.5 text-sm ${objetivo.id === o.id ? 'border-folha bg-folha text-white' : 'border-linha bg-cartao'}`}
          >
            {o.nome}
          </button>
        ))}
        <label>
          <span className="sr-only">Grupo das sugestões</span>
          <select
            value={grupo ?? ''}
            onChange={(e) => setGrupo(e.target.value === '' ? null : Number(e.target.value))}
            className="h-9 rounded-full border border-linha bg-cartao px-3 text-sm"
          >
            <option value="">Todos os grupos</option>
            {grupos.map((nome, i) => (
              <option key={nome} value={i}>
                {nome}
              </option>
            ))}
          </select>
        </label>
      </div>
      {objetivo.chave !== 'energia' ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="Comparar por">
          <span className="text-suave">Comparar por:</span>
          {(
            [
              ['100g', '100 g do alimento'],
              ['100kcal', '100 kcal do alimento'],
            ] as const
          ).map(([valor, nome]) => (
            <button
              key={valor}
              type="button"
              aria-pressed={base === valor}
              onClick={() => setBase(valor)}
              className={`rounded-lg border px-3 py-1 ${base === valor ? 'border-folha bg-folha-clara font-semibold text-folha-escura' : 'border-linha bg-cartao'}`}
            >
              {nome}
            </button>
          ))}
          <span className="w-full text-xs text-suave">
            {base === '100kcal'
              ? 'Por 100 kcal aparecem os alimentos que entregam mais do nutriente com menos calorias.'
              : 'Por 100 g aparecem os alimentos com mais do nutriente no mesmo peso.'}
          </span>
        </div>
      ) : null}
      <div className="mt-4" aria-live="polite">
        {estado.tipo === 'carregando' ? <p className="text-suave">Carregando a tabela de alimentos...</p> : null}
        {estado.tipo === 'ok' ? (
          lista.length === 0 ? (
            <p className="rounded-xl bg-cartao px-4 py-5 text-center text-suave">Nenhum alimento deste grupo entra nesta sugestão.</p>
          ) : (
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label={`${objetivo.nome}: alimentos sugeridos`}>
              {lista.map((alimento) => {
                const valor = valorNaBase(alimento, objetivo.chave, base);
                const percentual = percentualDoVd(valor, n);
                const sufixo = base === '100g' ? 'em 100 g' : 'em 100 kcal';
                const destaque = `${n.nome}: ${formatarValor(valor, n.unidade)} ${sufixo}${percentual !== null && objetivo.ordem === 'maior' ? ` (${formatarPercentual(percentual)} VD)` : ''}`;
                return (
                  <CartaoDoAlimento
                    key={alimento.id}
                    alimento={alimento}
                    grupo={grupos[alimento.grupo] ?? ''}
                    destaque={destaque}
                    onAbrir={() => setAberto(alimento)}
                  />
                );
              })}
            </ol>
          )
        ) : null}
      </div>
      <FichaDoAlimento key={aberto?.id ?? 'nenhum'} alimento={aberto} grupo={aberto ? (grupos[aberto.grupo] ?? '') : ''} onFechar={() => setAberto(null)} />
    </section>
  );
}
