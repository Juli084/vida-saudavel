import { Check, Copy, Trash2, UtensilsCrossed, X } from 'lucide-react';
import { useState } from 'react';
import { formatarPercentual, formatarValor, naPorcao, NUTRIENTES, percentualDoVd, totalDoPrato, type ChaveDeNutriente } from '../alimentos/dados.ts';
import { esvaziarPrato, GRAMAS_MAXIMAS, mudarGramas, tirarDoPrato, usePrato } from '../alimentos/prato.ts';
import { useTabela } from '../alimentos/useTabela.ts';
import { BarraDoVd } from './FichaDoAlimento.tsx';

const NO_RESUMO: ChaveDeNutriente[] = ['energia', 'carboidrato', 'proteina', 'lipideos', 'saturados', 'fibra', 'sodio', 'calcio', 'ferro', 'potassio', 'vitaminaC', 'vitaminaA'];

export function Prato() {
  const estado = useTabela();
  const itens = usePrato();
  const [copiado, setCopiado] = useState(false);

  if (estado.tipo !== 'ok') return null;
  const conhecidos = itens.filter((i) => estado.porId.has(i.id));
  const totais = totalDoPrato(conhecidos, estado.porId);
  const resumo = NUTRIENTES.filter((n) => NO_RESUMO.includes(n.chave));

  function comoTexto() {
    const linhas = conhecidos.map((i) => `- ${estado.tipo === 'ok' ? estado.porId.get(i.id)!.nome : ''}: ${i.gramas} g`);
    const valores = resumo.map((n) => {
      const t = totais[n.chave];
      if (t.semDado === conhecidos.length) return `${n.nome}: sem dado na tabela`;
      const pct = formatarPercentual(percentualDoVd(t.valor, n));
      return `${n.nome}: ${formatarValor(t.valor, n.unidade)}${pct ? ` (${pct} VD)` : ''}${t.semDado ? ' (parcial)' : ''}`;
    });
    return ['Meu prato', '', ...linhas, '', ...valores, '', 'Fonte: TACO 4ª ed. (NEPA/UNICAMP). %VD: Anvisa, IN 75/2020.'].join('\n');
  }

  return (
    <section id="prato" aria-labelledby="titulo-prato" className="scroll-mt-20">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="titulo-prato" className="text-2xl font-bold">
            Meu prato
          </h2>
          <p className="mt-1 text-sm text-suave">Abra um alimento e use "Pôr no prato". O prato fica neste navegador.</p>
        </div>
        {conhecidos.length ? (
          <button type="button" onClick={esvaziarPrato} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-suave hover:text-alerta">
            <Trash2 size={15} aria-hidden="true" />
            Esvaziar prato
          </button>
        ) : null}
      </div>

      {conhecidos.length === 0 ? (
        <p className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-linha bg-cartao px-4 py-6 text-suave">
          <UtensilsCrossed size={22} aria-hidden="true" className="shrink-0 text-folha" />
          O prato está vazio. Busque um alimento acima, escolha a porção e ponha no prato para ver o total.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <ul className="space-y-2" aria-label="Alimentos no prato">
            {conhecidos.map((item) => {
              const alimento = estado.porId.get(item.id)!;
              return (
                <li key={item.id} className="flex items-center gap-3 rounded-xl border border-linha bg-cartao px-3 py-2">
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{alimento.nome}</span>
                    <span className="text-xs text-suave">{formatarValor(naPorcao(alimento.energia, item.gramas), 'kcal')}</span>
                  </span>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={GRAMAS_MAXIMAS}
                      defaultValue={item.gramas}
                      key={item.gramas}
                      onBlur={(e) => mudarGramas(item.id, Number(e.target.value) || item.gramas)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      }}
                      aria-label={`Gramas de ${alimento.nome}`}
                      className="h-9 w-20 rounded-lg border border-linha px-2 text-right"
                    />
                    g
                  </label>
                  <button
                    type="button"
                    onClick={() => tirarDoPrato(item.id)}
                    aria-label={`Tirar ${alimento.nome} do prato`}
                    className="grid size-9 place-items-center rounded-full text-suave hover:bg-fundo"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="rounded-2xl border border-linha bg-cartao p-4">
            <h3 className="font-bold">Total do prato</h3>
            <table className="mt-2 w-full text-sm">
              <caption className="sr-only">Total de nutrientes do prato e porcentagem do valor diário</caption>
              <tbody>
                {resumo.map((n) => {
                  const t = totais[n.chave];
                  // Se nenhum alimento do prato tem o dado, não há total: aparece "–", não zero.
                  const semNenhumDado = t.semDado === conhecidos.length;
                  const percentual = semNenhumDado ? null : percentualDoVd(t.valor, n);
                  return (
                    <tr key={n.chave} className="border-t border-linha/70">
                      <th scope="row" className="py-1.5 text-left font-normal">
                        {n.nome}
                        {t.semDado && !semNenhumDado ? <span className="text-alerta"> *</span> : null}
                      </th>
                      <td className="py-1.5 text-right tabular-nums">{semNenhumDado ? '–' : formatarValor(t.valor, n.unidade)}</td>
                      <td className="w-28 py-1.5 pl-3">
                        <span className="block text-right text-xs text-suave tabular-nums">{formatarPercentual(percentual)}</span>
                        <BarraDoVd percentual={percentual} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {resumo.some((n) => totais[n.chave].semDado && totais[n.chave].semDado < conhecidos.length) ? (
              <p className="mt-2 text-xs text-alerta">* Algum alimento do prato não tem este dado na tabela: o total real pode ser maior.</p>
            ) : null}
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(comoTexto());
                  setCopiado(true);
                } catch {
                  setCopiado(false);
                }
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-linha px-3 py-2 text-sm font-medium"
            >
              {copiado ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              {copiado ? 'Resumo copiado' : 'Copiar resumo'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
