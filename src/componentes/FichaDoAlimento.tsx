import { Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatarPercentual, formatarValor, naPorcao, NUTRIENTES, percentualDoVd, type Alimento } from '../alimentos/dados.ts';
import { GRAMAS_MAXIMAS, gramasValidas, porNoPrato } from '../alimentos/prato.ts';

const PORCOES = [50, 100, 150, 200];

/** Barra do %VD: até 100% preenche; acima disso fica cheia e o número diz quanto passou. */
export function BarraDoVd({ percentual }: { percentual: number | null }) {
  if (percentual === null) return null;
  return (
    <span aria-hidden="true" className="block h-1.5 w-full overflow-hidden rounded-full bg-green-100">
      <span className="block h-full rounded-full bg-green-600" style={{ width: `${Math.min(100, percentual)}%` }} />
    </span>
  );
}

export function FichaDoAlimento({ alimento, grupo, onFechar }: { alimento: Alimento | null; grupo: string; onFechar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [gramas, setGramas] = useState(100);
  const [texto, setTexto] = useState('100');
  const [adicionado, setAdicionado] = useState('');

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (alimento && !dialogo.open) dialogo.showModal();
    if (!alimento && dialogo.open) dialogo.close();
  }, [alimento]);

  function escolher(valor: number) {
    const g = gramasValidas(valor);
    setGramas(g);
    setTexto(String(g));
  }

  return (
    <dialog
      ref={ref}
      className="janela"
      aria-label={alimento?.nome ?? 'Alimento'}
      onCancel={(e) => {
        e.preventDefault();
        onFechar();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onFechar();
      }}
    >
      {alimento ? (
        <>
          <div className="flex items-start gap-3 border-b border-gray-200 px-5 py-3">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-green-800">{alimento.nome}</h2>
              <p className="text-xs text-gray-500">{grupo}</p>
            </div>
            <button type="button" onClick={onFechar} aria-label="Fechar" className="grid size-10 place-items-center rounded-full text-gray-500 hover:bg-gray-100">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <fieldset>
              <legend className="text-sm font-semibold text-gray-800">Porção</legend>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {PORCOES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={gramas === p}
                    onClick={() => escolher(p)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${gramas === p ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300 text-gray-700 hover:bg-green-50'}`}
                  >
                    {p} g
                  </button>
                ))}
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Outra:</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={GRAMAS_MAXIMAS}
                    value={texto}
                    onChange={(e) => {
                      setTexto(e.target.value);
                      const n = Number(e.target.value);
                      if (e.target.value !== '' && Number.isFinite(n) && n >= 1) setGramas(gramasValidas(n));
                    }}
                    onBlur={() => setTexto(String(gramas))}
                    aria-label="Gramas da porção"
                    className="h-9 w-20 rounded-lg border border-gray-300 bg-white px-2"
                  />
                  <span className="text-gray-500">g</span>
                </label>
              </div>
            </fieldset>

            <table className="mt-4 w-full text-sm">
              <caption className="sr-only">Composição em {gramas} g</caption>
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th scope="col" className="pb-1 font-medium">
                    Em {gramas} g
                  </th>
                  <th scope="col" className="pb-1 text-right font-medium">
                    Quantidade
                  </th>
                  <th scope="col" className="w-28 pb-1 pl-3 text-right font-medium">
                    %VD
                  </th>
                </tr>
              </thead>
              <tbody>
                {NUTRIENTES.map((n) => {
                  const valor = naPorcao(alimento[n.chave], gramas);
                  const percentual = percentualDoVd(valor, n);
                  return (
                    <tr key={n.chave} className="border-t border-gray-100">
                      <th scope="row" className="py-1.5 text-left font-normal">
                        {n.nome}
                      </th>
                      <td className="py-1.5 text-right tabular-nums">{formatarValor(valor, n.unidade)}</td>
                      <td className="py-1.5 pl-3">
                        <span className="block text-right text-xs text-gray-500 tabular-nums">
                          {valor === 'Tr' && n.vd !== null ? 'menos de 1%' : formatarPercentual(percentual)}
                        </span>
                        <BarraDoVd percentual={percentual} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-gray-500">
              Fonte: TACO, 4ª edição (NEPA/UNICAMP). %VD: valores diários de referência da Anvisa (IN nº 75/2020), com base em 2.000
              kcal. "Traços": presente em quantidade muito pequena para medir. "–": sem dado na tabela ou não se aplica.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 bg-green-50 px-5 py-3">
            <button
              type="button"
              onClick={() => {
                porNoPrato(alimento.id, gramas);
                setAdicionado(`${gramas} g no prato.`);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700"
            >
              <Plus size={17} aria-hidden="true" />
              Pôr {gramas} g no prato
            </button>
            {adicionado ? (
              <>
                <p role="status" className="text-sm text-green-800">
                  {adicionado}
                </p>
                <a
                  href="#prato"
                  onClick={(e) => {
                    // Fecha a ficha antes de rolar: com o diálogo aberto, a página fica travada.
                    e.preventDefault();
                    onFechar();
                    setTimeout(() => document.getElementById('prato')?.scrollIntoView(), 50);
                  }}
                  className="text-sm font-medium text-green-700 underline"
                >
                  Ver meu prato
                </a>
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </dialog>
  );
}
