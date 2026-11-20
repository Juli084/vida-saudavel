import { useId, useMemo, useState, type FormEvent } from 'react';
import {
  buscar,
  formatarPercentual,
  formatarValor,
  nutriente,
  OBJETIVOS,
  percentualDoVd,
  sugerir,
  valorNaBase,
  type Alimento,
  type Base,
  type ChaveDeNutriente,
  type Objetivo,
} from '../alimentos/dados.ts';
import { useTabela } from '../alimentos/useTabela.ts';
import { buscarReceitas, useReceitasBrasileiras } from '../receitas/dados.ts';
import { FichaDoAlimento } from './FichaDoAlimento.tsx';
import { ReceitasBrasileiras } from './ReceitasBrasileiras.tsx';
import { ReceitasDaBusca } from './Receitas.tsx';

const EXEMPLOS = ['banana', 'feijão preto', 'moqueca', 'frango', 'abóbora', 'mandioca'];
const POR_VEZ = 6;

/** O que aparece em cada cartão; o resto fica na ficha completa. */
const NO_CARTAO: [ChaveDeNutriente, string, string][] = [
  ['energia', 'Energia', 'kcal'],
  ['proteina', 'Proteínas', 'g'],
  ['carboidrato', 'Carboidratos', 'g'],
  ['lipideos', 'Gorduras', 'g'],
  ['fibra', 'Fibras', 'g'],
  ['sodio', 'Sódio', 'mg'],
];

type Consulta = { tipo: 'busca'; termo: string } | { tipo: 'nutriente'; objetivo: Objetivo };

function CartaoDoAlimento({ alimento, grupo, destaque, onAbrir }: { alimento: Alimento; grupo: string; destaque?: string; onAbrir: () => void }) {
  return (
    <li className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
      <button type="button" onClick={onAbrir} className="flex h-full w-full flex-col p-5 text-left transition hover:bg-green-50">
        <span className="text-lg font-semibold text-gray-800">{alimento.nome}</span>
        <span className="mt-0.5 text-sm text-gray-500">{grupo}</span>
        {destaque ? <span className="mt-3 rounded-lg bg-green-100 px-3 py-1.5 text-sm font-semibold text-green-800">{destaque}</span> : null}
        <span className="mt-4 grid grid-cols-3 gap-2 text-center">
          {NO_CARTAO.map(([chave, nome, unidade]) => (
            <span key={chave} className="rounded-lg bg-gray-50 px-1 py-2">
              <span className="block font-bold text-gray-800">{formatarValor(alimento[chave], unidade)}</span>
              <span className="block text-xs text-gray-500">{nome}</span>
            </span>
          ))}
        </span>
        <span className="mt-auto pt-4 font-medium text-green-700">Ver todos os nutrientes →</span>
      </button>
    </li>
  );
}

function AlimentosDaBusca({ achados, onAbrir }: { achados: Alimento[]; onAbrir: (a: Alimento) => void }) {
  const estado = useTabela();
  const [quantos, setQuantos] = useState(POR_VEZ);
  const grupos = estado.tipo === 'ok' ? estado.tabela.grupos : [];

  return (
    <section aria-labelledby="titulo-composicao">
      <h3 id="titulo-composicao" className="text-2xl font-bold text-green-800">
        Composição nutricional
      </h3>
      <p className="mt-1 text-sm text-gray-600">
        Valores em 100 g, da Tabela Brasileira de Composição de Alimentos (TACO). Abra um alimento para escolher a porção e
        ver vitaminas, minerais e o percentual do valor diário.
      </p>
      <div className="mt-6" aria-live="polite">
        {estado.tipo === 'carregando' ? <p className="text-center text-gray-500">Carregando a tabela de alimentos...</p> : null}
        {estado.tipo === 'erro' ? (
          <p role="alert" className="text-center text-red-700">
            Não foi possível carregar a tabela de alimentos. Recarregue a página.
          </p>
        ) : null}
        {estado.tipo === 'ok' && achados.length === 0 ? (
          <p className="text-center text-gray-500">Nenhum alimento com esse nome na tabela. Tente uma palavra só, como “feijão”.</p>
        ) : null}
        {estado.tipo === 'ok' && achados.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-gray-500">
              {achados.length} {achados.length === 1 ? 'alimento encontrado' : 'alimentos encontrados'}
            </p>
            <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {achados.slice(0, quantos).map((alimento) => (
                <CartaoDoAlimento key={alimento.id} alimento={alimento} grupo={grupos[alimento.grupo] ?? ''} onAbrir={() => onAbrir(alimento)} />
              ))}
            </ul>
            {achados.length > quantos ? (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setQuantos(quantos + POR_VEZ * 2)}
                  className="rounded-full border border-green-600 px-6 py-2 font-semibold text-green-700 transition hover:bg-green-50"
                >
                  Mostrar mais {Math.min(POR_VEZ * 2, achados.length - quantos)}
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}

function AlimentosDoNutriente({ objetivo, onAbrir }: { objetivo: Objetivo; onAbrir: (a: Alimento) => void }) {
  const estado = useTabela();
  const [grupo, setGrupo] = useState<number | null>(null);
  const [baseEscolhida, setBase] = useState<Base>('100g');
  // "Menos calorias" só faz sentido por 100 g.
  const base: Base = objetivo.chave === 'energia' ? '100g' : baseEscolhida;
  const lista = useMemo(() => (estado.tipo === 'ok' ? sugerir(estado.tabela, objetivo, grupo, 12, base) : []), [estado, objetivo, grupo, base]);
  const grupos = estado.tipo === 'ok' ? estado.tabela.grupos : [];
  const n = nutriente(objetivo.chave);

  return (
    <section aria-labelledby="titulo-sugestoes">
      <h3 id="titulo-sugestoes" className="text-2xl font-bold text-green-800">
        Alimentos com {objetivo.nome.toLowerCase()}
      </h3>
      <p className="mt-1 text-sm text-gray-600">
        Ficam de fora sal, temperos, doces, bebidas, óleos, farinhas e ultraprocessados, e o que só se come cozido aparece
        cozido.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        {objetivo.chave !== 'energia' ? (
          <span className="flex flex-wrap items-center gap-2" role="group" aria-label="Comparar por">
            <span className="text-gray-600">Comparar por:</span>
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
                className={`rounded-full border px-3 py-1.5 transition ${base === valor ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-green-50'}`}
              >
                {nome}
              </button>
            ))}
          </span>
        ) : null}
        <label>
          <span className="sr-only">Grupo das sugestões</span>
          <select
            value={grupo ?? ''}
            onChange={(e) => setGrupo(e.target.value === '' ? null : Number(e.target.value))}
            className="h-9 rounded-full border border-gray-300 bg-white px-3 text-gray-700"
          >
            <option value="">Todos os grupos</option>
            {grupos.map((nome, i) => (
              <option key={nome} value={i}>
                {nome}
              </option>
            ))}
          </select>
        </label>
        {objetivo.chave !== 'energia' ? (
          <span className="w-full text-xs text-gray-500">
            {base === '100kcal'
              ? 'Por 100 kcal aparecem os alimentos que entregam mais do nutriente com menos calorias.'
              : 'Por 100 g aparecem os alimentos com mais do nutriente no mesmo peso.'}
          </span>
        ) : null}
      </div>
      <div className="mt-6">
        {estado.tipo === 'carregando' ? <p className="text-center text-gray-500">Carregando a tabela de alimentos...</p> : null}
        {estado.tipo === 'ok' && lista.length === 0 ? <p className="text-center text-gray-500">Nenhum alimento deste grupo entra nesta sugestão.</p> : null}
        {estado.tipo === 'ok' && lista.length > 0 ? (
          <ol className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3" aria-label={`${objetivo.nome}: alimentos sugeridos`}>
            {lista.map((alimento) => {
              const valor = valorNaBase(alimento, objetivo.chave, base);
              const percentual = percentualDoVd(valor, n);
              const sufixo = base === '100g' ? 'em 100 g' : 'em 100 kcal';
              const vd = percentual !== null && objetivo.ordem === 'maior' ? ` (${formatarPercentual(percentual)} VD)` : '';
              return (
                <CartaoDoAlimento
                  key={alimento.id}
                  alimento={alimento}
                  grupo={grupos[alimento.grupo] ?? ''}
                  destaque={`${n.nome}: ${formatarValor(valor, n.unidade)} ${sufixo}${vd}`}
                  onAbrir={() => onAbrir(alimento)}
                />
              );
            })}
          </ol>
        ) : null}
      </div>
    </section>
  );
}

/** Receitas de outros países (Spoonacular, em inglês): ficam recolhidas e só consultam se a pessoa pedir. */
function Internacionais({ termo, configuradas }: { termo: string; configuradas: boolean | null }) {
  const [abertas, setAbertas] = useState(false);
  if (configuradas === false) return null;
  return (
    <div className="mt-16 border-t border-gray-200 pt-10">
      {abertas ? (
        <ReceitasDaBusca termo={termo} />
      ) : (
        <div className="text-center">
          <p className="text-sm text-gray-600">Quer ideias de outros países? Há também receitas internacionais, em inglês.</p>
          <button
            type="button"
            onClick={() => setAbertas(true)}
            className="mt-3 rounded-full border border-green-600 px-6 py-2 font-semibold text-green-700 transition hover:bg-green-50"
          >
            Ver receitas internacionais
          </button>
        </div>
      )}
    </div>
  );
}

type Aba = 'alimentos' | 'receitas';

/** Resultado da pesquisa em duas abas: alimentos (TACO) e receitas. Uma de cada vez. */
function ResultadoDaBusca({ termo, internacionais, onAbrir }: { termo: string; internacionais: boolean | null; onAbrir: (a: Alimento) => void }) {
  const tabela = useTabela();
  const livro = useReceitasBrasileiras();
  const achados = useMemo(() => (tabela.tipo === 'ok' ? buscar(tabela.tabela.alimentos, termo, null, tabela.tabela.grupos) : []), [tabela, termo]);
  const receitas = useMemo(() => (livro.tipo === 'ok' ? buscarReceitas(livro.base.receitas, termo) : { exatas: [], parecidas: [] }), [livro, termo]);
  const [escolhida, setEscolhida] = useState<Aba | null>(null);
  // Sem alimento com esse nome e com receita, abre direto em receitas ("moqueca", "pierogui").
  const aba: Aba = escolhida ?? (tabela.tipo === 'ok' && achados.length === 0 && receitas.exatas.length > 0 ? 'receitas' : 'alimentos');
  const id = useId();
  const abas: { valor: Aba; rotulo: string }[] = [
    { valor: 'alimentos', rotulo: tabela.tipo === 'ok' ? `Alimentos (${achados.length})` : 'Alimentos' },
    { valor: 'receitas', rotulo: receitas.exatas.length ? `Receitas (${receitas.exatas.length})` : 'Receitas' },
  ];

  return (
    <div className="mt-10">
      <div
        role="tablist"
        aria-label="Resultado da pesquisa"
        className="flex gap-2 border-b border-gray-200"
        onKeyDown={(e) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          const proxima: Aba = aba === 'alimentos' ? 'receitas' : 'alimentos';
          setEscolhida(proxima);
          document.getElementById(`${id}-aba-${proxima}`)?.focus();
        }}
      >
        {abas.map((a) => (
          <button
            key={a.valor}
            id={`${id}-aba-${a.valor}`}
            type="button"
            role="tab"
            aria-selected={aba === a.valor}
            aria-controls={`${id}-painel-${a.valor}`}
            tabIndex={aba === a.valor ? 0 : -1}
            onClick={() => setEscolhida(a.valor)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-base font-semibold transition ${aba === a.valor ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            {a.rotulo}
          </button>
        ))}
      </div>
      <div id={`${id}-painel-alimentos`} role="tabpanel" aria-labelledby={`${id}-aba-alimentos`} hidden={aba !== 'alimentos'} className="pt-8">
        <AlimentosDaBusca achados={achados} onAbrir={onAbrir} />
      </div>
      <div id={`${id}-painel-receitas`} role="tabpanel" aria-labelledby={`${id}-aba-receitas`} hidden={aba !== 'receitas'} className="pt-8">
        {livro.tipo === 'carregando' ? <p className="text-center text-gray-500">Carregando as receitas...</p> : null}
        {livro.tipo === 'erro' ? (
          <p role="alert" className="text-center text-red-700">
            Não foi possível carregar as receitas. Recarregue a página.
          </p>
        ) : null}
        {livro.tipo === 'ok' ? <ReceitasBrasileiras termo={termo} base={livro.base} exatas={receitas.exatas} parecidas={receitas.parecidas} /> : null}
        {aba === 'receitas' ? <Internacionais termo={termo} configuradas={internacionais} /> : null}
      </div>
    </div>
  );
}

export function Busca({ receitas }: { receitas: boolean | null }) {
  // Baixa a tabela já na abertura, para o resultado sair na hora da busca.
  const estado = useTabela();
  const [texto, setTexto] = useState('');
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [aberto, setAberto] = useState<Alimento | null>(null);
  const idCampo = useId();
  const grupos = estado.tipo === 'ok' ? estado.tabela.grupos : [];

  function pesquisar(termo: string) {
    const limpo = termo.trim().slice(0, 80);
    if (!limpo) return;
    setTexto(limpo);
    setConsulta({ tipo: 'busca', termo: limpo });
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    pesquisar(texto);
  }

  return (
    <section id="buscar" aria-labelledby="titulo-busca" className="scroll-mt-20 bg-white px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 id="titulo-busca" className="mb-4 text-center text-3xl font-bold text-green-800">
          Pesquise um alimento ou prato
        </h2>
        <p className="mb-6 text-center text-sm text-gray-600">
          Digite o que você come, como <strong>banana</strong>, <strong>arroz integral</strong> ou <strong>feijoada</strong>, e
          veja a composição nutricional e receitas com ele.
        </p>

        <form role="search" onSubmit={enviar} className="mb-4 flex gap-3">
          <label htmlFor={idCampo} className="sr-only">
            Alimento ou prato
          </label>
          <input
            id={idCampo}
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ex.: banana, feijão, frango, salada..."
            maxLength={80}
            className="w-full rounded-xl border border-gray-300 p-3 shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
          <button type="submit" className="rounded-xl bg-green-600 px-6 text-white transition hover:bg-green-700">
            Buscar
          </button>
        </form>

        <div className="space-y-2 text-sm text-gray-600">
          {consulta === null ? (
            <p className="flex flex-wrap items-center gap-2">
              <span>Experimente:</span>
              {EXEMPLOS.map((exemplo) => (
                <button
                  key={exemplo}
                  type="button"
                  onClick={() => pesquisar(exemplo)}
                  className="rounded-full border border-gray-300 bg-white px-3 py-1 text-gray-700 transition hover:bg-green-50"
                >
                  {exemplo}
                </button>
              ))}
            </p>
          ) : null}
          <p className="flex flex-wrap items-center gap-2" role="group" aria-label="Sugestões por nutriente">
            <span>Ou veja alimentos com:</span>
            {OBJETIVOS.map((o) => {
              const ativo = consulta?.tipo === 'nutriente' && consulta.objetivo.id === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => setConsulta({ tipo: 'nutriente', objetivo: o })}
                  className={`rounded-full border px-3 py-1 transition ${ativo ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-green-50'}`}
                >
                  {o.nome.replace(/^Mais /, 'mais ').replace(/^Menos /, 'menos ')}
                </button>
              );
            })}
          </p>
        </div>

        {consulta?.tipo === 'busca' ? <ResultadoDaBusca key={consulta.termo} termo={consulta.termo} internacionais={receitas} onAbrir={setAberto} /> : null}
        {consulta?.tipo === 'nutriente' ? (
          <div className="mt-12">
            <AlimentosDoNutriente objetivo={consulta.objetivo} onAbrir={setAberto} />
          </div>
        ) : null}
      </div>
      <FichaDoAlimento key={aberto?.id ?? 'nenhum'} alimento={aberto} grupo={aberto ? (grupos[aberto.grupo] ?? '') : ''} onFechar={() => setAberto(null)} />
    </section>
  );
}
