import { ExternalLink, MapPin, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatarPercentual, formatarValor } from '../alimentos/dados.ts';
import { ehSecao, fotoDaReceita, NUTRICAO_DA_FICHA, type BaseDeReceitas, type ReceitaBrasileira } from '../receitas/dados.ts';
import { BarraDoVd } from './FichaDoAlimento.tsx';
import { PorNaSemana } from './Receitas.tsx';

const kcal = (r: ReceitaBrasileira) => formatarValor(r.nutricao.energia, 'kcal');

function CartaoDaReceita({ receita, onAbrir }: { receita: ReceitaBrasileira; onAbrir: () => void }) {
  return (
    <li className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
      <button type="button" onClick={onAbrir} className="block h-full w-full text-left transition hover:bg-green-50">
        <img src={fotoDaReceita(receita)} alt="" loading="lazy" width={640} height={480} className="h-48 w-full object-cover" />
        <span className="block p-4">
          <span className="block text-xl font-semibold text-gray-800">{receita.nome}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} aria-hidden="true" /> {receita.regiao}
            </span>
            <span>{receita.tipo}</span>
          </span>
          <span className="mt-1 block text-sm text-gray-500">
            {kcal(receita)} por porção{receita.porcao.medida ? ` (${receita.porcao.medida})` : ''}
          </span>
          <span className="mt-4 block font-medium text-green-700">Ver receita completa →</span>
        </span>
      </button>
    </li>
  );
}

function FichaDaReceita({ receita, fonte, onFechar }: { receita: ReceitaBrasileira | null; fonte: BaseDeReceitas['fonte']; onFechar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (receita && !dialogo.open) dialogo.showModal();
    if (!receita && dialogo.open) dialogo.close();
  }, [receita]);

  return (
    <dialog
      ref={ref}
      className="janela"
      aria-label={receita?.nome ?? 'Receita'}
      onCancel={(e) => {
        e.preventDefault();
        onFechar();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onFechar();
      }}
    >
      {receita ? (
        <>
          <div className="flex items-start gap-3 border-b border-gray-200 px-5 py-3">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-green-800">{receita.nome}</h2>
              <p className="text-xs text-gray-500">
                Região {receita.regiao} · {receita.tipo}
              </p>
            </div>
            <button type="button" onClick={onFechar} aria-label="Fechar" className="grid size-10 place-items-center rounded-full text-gray-500 hover:bg-gray-100">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <img src={fotoDaReceita(receita)} alt={`Foto de ${receita.nome}`} width={640} height={480} className="aspect-video w-full rounded-xl object-cover" />

            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-green-50 p-3">
                <dt className="text-xs text-gray-500">Rendimento</dt>
                <dd className="font-semibold text-gray-800">{[receita.rendimento.medida, receita.rendimento.peso].filter(Boolean).join(' · ')}</dd>
              </div>
              <div className="rounded-xl bg-green-50 p-3">
                <dt className="text-xs text-gray-500">Porção</dt>
                <dd className="font-semibold text-gray-800">{[receita.porcao.medida, receita.porcao.peso].filter(Boolean).join(' · ')}</dd>
              </div>
            </dl>

            <h3 className="mt-5 font-bold text-gray-800">Ingredientes</h3>
            <ul className="mt-2 text-sm">
              {receita.ingredientes.map((item, i) =>
                ehSecao(item) ? (
                  <li key={i} className="pt-3 pb-1 text-xs font-semibold tracking-wide text-green-800 uppercase">
                    {item.secao}
                  </li>
                ) : (
                  <li key={i} className="flex justify-between gap-3 border-b border-gray-100 py-1.5">
                    <span>{item.nome}</span>
                    <span className="text-right text-gray-500">
                      {item.medida ?? ''}
                      {item.medida && item.peso ? ' · ' : ''}
                      {item.peso ?? ''}
                    </span>
                  </li>
                ),
              )}
            </ul>
            <p className="mt-1 text-xs text-gray-500">Peso bruto, como vem da feira ou do mercado, antes de descascar ou limpar.</p>

            <h3 className="mt-5 font-bold text-gray-800">Modo de preparo</h3>
            {receita.preparo.map((secao, i) => (
              <div key={i}>
                {secao.titulo ? <h4 className="mt-3 text-sm font-semibold text-green-800">{secao.titulo}</h4> : null}
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
                  {secao.passos.map((passo, j) => (
                    <li key={j}>{passo}</li>
                  ))}
                </ol>
              </div>
            ))}

            <table className="mt-5 w-full text-sm">
              <caption className="pb-2 text-left font-bold text-gray-800">Informação nutricional por porção ({receita.porcao.peso})</caption>
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th scope="col" className="pb-1 font-medium">
                    Nutriente
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
                {NUTRICAO_DA_FICHA.map((n) => {
                  const valor = receita.nutricao[n.chave];
                  const percentual = n.vd ? (valor / n.vd) * 100 : null;
                  return (
                    <tr key={n.chave} className="border-t border-gray-100">
                      <th scope="row" className="py-1.5 text-left font-normal">
                        {n.nome}
                      </th>
                      <td className="py-1.5 text-right tabular-nums">{formatarValor(valor, n.unidade)}</td>
                      <td className="py-1.5 pl-3">
                        <span className="block text-right text-xs text-gray-500 tabular-nums">{formatarPercentual(percentual)}</span>
                        <BarraDoVd percentual={percentual} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-gray-500">
              Valores da ficha técnica do Ministério da Saúde, calculados com a TACO e outras tabelas brasileiras. %VD: Anvisa (IN
              nº 75/2020), com base em 2.000 kcal.
            </p>

            <p className="mt-5 text-xs text-gray-600">
              Receita e foto:{' '}
              <a href={fonte.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-green-700 underline">
                {fonte.titulo} <ExternalLink size={12} aria-hidden="true" />
              </a>{' '}
              ({fonte.edicao}), p. {receita.pagina}. Licença{' '}
              <a href={fonte.licencaUrl} target="_blank" rel="noopener noreferrer" className="underline">
                {fonte.licenca}
              </a>
              .
            </p>
          </div>
          <PorNaSemana receita={{ id: receita.id, titulo: receita.nome, imagem: fotoDaReceita(receita), fonte: 'ms' }} />
        </>
      ) : null}
    </dialog>
  );
}

const POR_VEZ = 6;

/** Receitas brasileiras do termo pesquisado: as exatas ou, se não houver, as parecidas. */
export function ReceitasBrasileiras({ termo, base, exatas, parecidas }: { termo: string; base: BaseDeReceitas; exatas: ReceitaBrasileira[]; parecidas: ReceitaBrasileira[] }) {
  const [aberta, setAberta] = useState<ReceitaBrasileira | null>(null);
  const [quantas, setQuantas] = useState(POR_VEZ);
  const lista = exatas.length ? exatas : parecidas;

  return (
    <section aria-labelledby="titulo-receitas-br">
      <h3 id="titulo-receitas-br" className="text-2xl font-bold text-green-800">
        Receitas brasileiras
      </h3>
      <p className="mt-1 text-sm text-gray-600">
        Do livro {base.fonte.titulo}, do Ministério da Saúde: {base.receitas.length} receitas das cinco regiões, testadas por
        nutricionistas, com medida caseira e informação nutricional.
      </p>
      <div className="mt-6" aria-live="polite">
        {exatas.length === 0 && parecidas.length === 0 ? (
          <p className="text-center text-gray-500">Nenhuma receita do livro com “{termo}”. Tente o nome de um ingrediente, como “milho” ou “abóbora”.</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500">
              {exatas.length
                ? `${exatas.length} ${exatas.length === 1 ? 'receita' : 'receitas'} com “${termo}”`
                : `Nenhuma receita do livro com todas essas palavras. ${parecidas.length === 1 ? 'Uma parecida' : `${parecidas.length} parecidas`}:`}
            </p>
            <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {lista.slice(0, quantas).map((receita) => (
                <CartaoDaReceita key={receita.id} receita={receita} onAbrir={() => setAberta(receita)} />
              ))}
            </ul>
            {lista.length > quantas ? (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setQuantas(quantas + POR_VEZ)}
                  className="rounded-full border border-green-600 px-6 py-2 font-semibold text-green-700 transition hover:bg-green-50"
                >
                  Mostrar mais {Math.min(POR_VEZ, lista.length - quantas)}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
      <FichaDaReceita key={aberta?.id ?? 'nenhuma'} receita={aberta} fonte={base.fonte} onFechar={() => setAberta(null)} />
    </section>
  );
}
