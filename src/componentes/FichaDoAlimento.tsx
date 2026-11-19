import { Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatarPercentual, formatarValor, naPorcao, NUTRIENTES, percentualDoVd, type Alimento } from '../alimentos/dados.ts';
import { GRAMAS_MAXIMAS, gramasValidas, porNoPrato } from '../alimentos/prato.ts';

const PORCOES = [50, 100, 150, 200];

/** Barra do %VD: até 100% preenche; acima disso fica cheia e o número diz quanto passou. */
export function BarraDoVd({ percentual }: { percentual: number | null }) {
  if (percentual === null) return null;
  return (
    <span aria-hidden="true" className="block h-1.5 w-full overflow-hidden rounded-full bg-folha-clara">
      <span className="block h-full rounded-full bg-folha" style={{ width: `${Math.min(100, percentual)}%` }} />
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
          <div className="flex items-start gap-3 border-b border-linha px-5 py-3">
            <div className="flex-1">
              <h2 className="text-lg font-bold">{alimento.nome}</h2>
              <p className="text-xs text-suave">{grupo}</p>
            </div>
            <button type="button" onClick={onFechar} aria-label="Fechar" className="grid size-10 place-items-center rounded-full text-suave hover:bg-fundo">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <fieldset>
              <legend className="text-sm font-semibold">Porção</legend>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {PORCOES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={gramas === p}
                    onClick={() => escolher(p)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${gramas === p ? 'border-folha bg-folha text-white' : 'border-linha'}`}
                  >
                    {p} g
                  </button>
                ))}
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-suave">Outra:</span>
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
                    className="h-9 w-20 rounded-lg border border-linha bg-cartao px-2"
                  />
                  <span className="text-suave">g</span>
                </label>
              </div>
            </fieldset>

            <table className="mt-4 w-full text-sm">
              <caption className="sr-only">Composição em {gramas} g</caption>
              <thead>
                <tr className="text-left text-xs text-suave">
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
                    <tr key={n.chave} className="border-t border-linha/70">
                      <th scope="row" className="py-1.5 text-left font-normal">
                        {n.nome}
                      </th>
                      <td className="py-1.5 text-right tabular-nums">{formatarValor(valor, n.unidade)}</td>
                      <td className="py-1.5 pl-3">
                        <span className="block text-right text-xs text-suave tabular-nums">
                          {valor === 'Tr' && n.vd !== null ? 'menos de 1%' : formatarPercentual(percentual)}
                        </span>
                        <BarraDoVd percentual={percentual} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-suave">
              Fonte: TACO, 4ª edição (NEPA/UNICAMP). %VD: valores diários de referência da Anvisa (IN nº 75/2020), com base em 2.000
              kcal. "Traços": presente em quantidade muito pequena para medir. "–": sem dado na tabela ou não se aplica.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-linha bg-fundo/60 px-5 py-3">
            <button
              type="button"
              onClick={() => {
                porNoPrato(alimento.id, gramas);
                setAdicionado(`${gramas} g no prato.`);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-folha px-4 text-sm font-semibold text-white hover:bg-folha-escura"
            >
              <Plus size={17} aria-hidden="true" />
              Pôr {gramas} g no prato
            </button>
            {adicionado ? (
              <p role="status" className="text-sm text-folha-escura">
                {adicionado}
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </dialog>
  );
}
