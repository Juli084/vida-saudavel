import { Check, Copy, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { formatarPercentual, formatarValor, naPorcao, NUTRIENTES, percentualDoVd, totalDoPrato, type ChaveDeNutriente } from '../alimentos/dados.ts';
import { esvaziarPrato, GRAMAS_MAXIMAS, mudarGramas, tirarDoPrato, usePrato } from '../alimentos/prato.ts';
import { useTabela } from '../alimentos/useTabela.ts';
import { BarraDoVd } from './FichaDoAlimento.tsx';

const NO_RESUMO: ChaveDeNutriente[] = ['energia', 'carboidrato', 'proteina', 'lipideos', 'saturados', 'fibra', 'sodio', 'calcio', 'ferro', 'potassio', 'vitaminaC', 'vitaminaA'];

/** Só aparece depois que a pessoa põe algum alimento no prato pela ficha. */
export function Prato() {
  const estado = useTabela();
  const itens = usePrato();
  const [copiado, setCopiado] = useState(false);

  if (estado.tipo !== 'ok') return null;
  const conhecidos = itens.filter((i) => estado.porId.has(i.id));
  if (conhecidos.length === 0) return null;
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
    <section id="prato" aria-labelledby="titulo-prato" className="scroll-mt-20 bg-green-50 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 id="titulo-prato" className="mb-2 text-center text-3xl font-bold text-green-800">
          Meu prato
        </h2>
        <p className="mb-8 text-center text-sm text-gray-600">
          A soma do que você pôs no prato, com o percentual do valor diário. O prato fica salvo neste navegador.
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          <ul className="space-y-3" aria-label="Alimentos no prato">
            {conhecidos.map((item) => {
              const alimento = estado.porId.get(item.id)!;
              return (
                <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-md">
                  <span className="flex-1">
                    <span className="block font-medium text-gray-800">{alimento.nome}</span>
                    <span className="text-sm text-gray-500">{formatarValor(naPorcao(alimento.energia, item.gramas), 'kcal')}</span>
                  </span>
                  <label className="flex items-center gap-1 text-sm text-gray-600">
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
                      className="h-9 w-20 rounded-lg border border-gray-300 px-2 text-right"
                    />
                    g
                  </label>
                  <button
                    type="button"
                    onClick={() => tirarDoPrato(item.id)}
                    aria-label={`Tirar ${alimento.nome} do prato`}
                    className="grid size-9 place-items-center rounded-full text-gray-500 hover:bg-gray-100"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="rounded-2xl bg-white p-5 shadow-md">
            <h3 className="text-lg font-bold text-gray-800">Total do prato</h3>
            <table className="mt-2 w-full text-sm">
              <caption className="sr-only">Total de nutrientes do prato e porcentagem do valor diário</caption>
              <tbody>
                {resumo.map((n) => {
                  const t = totais[n.chave];
                  // Se nenhum alimento do prato tem o dado, não há total: aparece "–", não zero.
                  const semNenhumDado = t.semDado === conhecidos.length;
                  const percentual = semNenhumDado ? null : percentualDoVd(t.valor, n);
                  return (
                    <tr key={n.chave} className="border-t border-gray-100">
                      <th scope="row" className="py-1.5 text-left font-normal">
                        {n.nome}
                        {t.semDado && !semNenhumDado ? <span className="text-amber-700"> *</span> : null}
                      </th>
                      <td className="py-1.5 text-right tabular-nums">{semNenhumDado ? '–' : formatarValor(t.valor, n.unidade)}</td>
                      <td className="w-28 py-1.5 pl-3">
                        <span className="block text-right text-xs text-gray-500 tabular-nums">{formatarPercentual(percentual)}</span>
                        <BarraDoVd percentual={percentual} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {resumo.some((n) => totais[n.chave].semDado && totais[n.chave].semDado < conhecidos.length) ? (
              <p className="mt-2 text-xs text-amber-700">* Algum alimento do prato não tem este dado na tabela: o total real pode ser maior.</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
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
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                {copiado ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                {copiado ? 'Resumo copiado' : 'Copiar resumo'}
              </button>
              <button
                type="button"
                onClick={esvaziarPrato}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-gray-500 hover:text-red-700"
              >
                <Trash2 size={15} aria-hidden="true" />
                Esvaziar prato
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
