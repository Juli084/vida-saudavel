import { CalendarPlus, Clock, ExternalLink, Flame, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  colocarNoPlano,
  consultar,
  DIAS,
  formatarQuantidade,
  NOMES_DAS_REFEICOES,
  NOMES_DOS_DIAS,
  REFEICOES,
  unidadeEmPortugues,
  type Dia,
  type Receita,
  type Refeicao,
  type ReceitaNoPlano,
  type Resultado,
} from '../dados.ts';

const DIETAS = [
  { valor: 'vegetariana', nome: 'Vegetariana' },
  { valor: 'vegana', nome: 'Vegana' },
] as const;
const RESTRICOES = [
  { valor: 'gluten', nome: 'Sem glúten' },
  { valor: 'lactose', nome: 'Sem lactose' },
] as const;

interface Filtros {
  dieta: string;
  sem: string[];
  tempo: string;
  refeicao: string;
}
const SEM_FILTROS: Filtros = { dieta: '', sem: [], tempo: '', refeicao: '' };

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'erro'; mensagem: string }
  | { tipo: 'ok'; receitas: Receita[]; total: number; termoUsado: string };

function parametrosDaBusca(termo: string, filtros: Filtros): URLSearchParams {
  const parametros = new URLSearchParams({ q: termo });
  if (filtros.dieta) parametros.set('dieta', filtros.dieta);
  for (const restricao of filtros.sem) parametros.append('sem', restricao);
  if (filtros.tempo) parametros.set('tempo', filtros.tempo);
  if (filtros.refeicao) parametros.set('refeicao', filtros.refeicao);
  return parametros;
}

type Resposta = { receitas: Receita[]; total: number; termoUsado: string };

function paraEstado(resultado: Resultado<Resposta>): Estado {
  return resultado.tipo === 'ok' ? { tipo: 'ok', ...resultado.dados } : resultado;
}

function Selos({ receita }: { receita: Receita }) {
  const selos = [
    receita.vegana ? 'Vegana' : receita.vegetariana ? 'Vegetariana' : null,
    receita.semGluten ? 'Sem glúten' : null,
    receita.semLactose ? 'Sem lactose' : null,
  ].filter(Boolean);
  return selos.length ? (
    <span className="flex flex-wrap gap-1">
      {selos.map((selo) => (
        <span key={selo} className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
          {selo}
        </span>
      ))}
    </span>
  ) : null;
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${ativo ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-green-50'}`}
    >
      {children}
    </button>
  );
}

/** Receitas do termo pesquisado. Monta uma vez por termo (key no componente pai). */
export function ReceitasDaBusca({ termo }: { termo: string }) {
  const [filtros, setFiltros] = useState<Filtros>(SEM_FILTROS);
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [aberta, setAberta] = useState<Receita | null>(null);
  // Se a pessoa mudar um filtro antes da resposta chegar, vale só a última consulta.
  const pedido = useRef(0);

  useEffect(() => {
    const numero = ++pedido.current;
    consultar<Resposta>(parametrosDaBusca(termo, SEM_FILTROS)).then((resultado) => {
      if (numero === pedido.current) setEstado(paraEstado(resultado));
    });
  }, [termo]);

  function aplicar(novos: Filtros) {
    setFiltros(novos);
    setEstado({ tipo: 'carregando' });
    const numero = ++pedido.current;
    consultar<Resposta>(parametrosDaBusca(termo, novos)).then((resultado) => {
      if (numero === pedido.current) setEstado(paraEstado(resultado));
    });
  }

  return (
    <section aria-labelledby="titulo-receitas">
      <h3 id="titulo-receitas" className="text-2xl font-bold text-green-800">
        Receitas internacionais
      </h3>
      <p className="mt-1 text-sm text-gray-600">
        Da base do Spoonacular, em inglês, primeiro as de melhor nota de saúde. Termos comuns em português, como “frango” ou
        “grão de bico”, são traduzidos na busca.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filtros das receitas">
        {DIETAS.map((opcao) => (
          <Chip key={opcao.valor} ativo={filtros.dieta === opcao.valor} onClick={() => aplicar({ ...filtros, dieta: filtros.dieta === opcao.valor ? '' : opcao.valor })}>
            {opcao.nome}
          </Chip>
        ))}
        {RESTRICOES.map((opcao) => {
          const ativo = filtros.sem.includes(opcao.valor);
          return (
            <Chip
              key={opcao.valor}
              ativo={ativo}
              onClick={() => aplicar({ ...filtros, sem: ativo ? filtros.sem.filter((s) => s !== opcao.valor) : [...filtros.sem, opcao.valor] })}
            >
              {opcao.nome}
            </Chip>
          );
        })}
        <label>
          <span className="sr-only">Tempo de preparo</span>
          <select
            value={filtros.tempo}
            onChange={(e) => aplicar({ ...filtros, tempo: e.target.value })}
            className="h-9 rounded-full border border-gray-300 bg-white px-3 text-sm text-gray-700"
          >
            <option value="">Qualquer tempo</option>
            <option value="15">Até 15 min</option>
            <option value="30">Até 30 min</option>
            <option value="45">Até 45 min</option>
            <option value="60">Até 1 hora</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Tipo de refeição</span>
          <select
            value={filtros.refeicao}
            onChange={(e) => aplicar({ ...filtros, refeicao: e.target.value })}
            className="h-9 rounded-full border border-gray-300 bg-white px-3 text-sm text-gray-700"
          >
            <option value="">Qualquer refeição</option>
            <option value="principal">Prato principal</option>
            <option value="cafe-da-manha">Café da manhã</option>
            <option value="salada">Salada</option>
            <option value="sopa">Sopa</option>
            <option value="lanche">Lanche</option>
            <option value="sobremesa">Sobremesa</option>
          </select>
        </label>
      </div>

      <div className="mt-6" aria-live="polite">
        {estado.tipo === 'carregando' ? (
          <p role="status" className="text-center text-gray-500">
            Carregando receitas...
          </p>
        ) : null}
        {estado.tipo === 'erro' ? (
          <p role="alert" className="text-center text-red-700">
            {estado.mensagem}
          </p>
        ) : null}
        {estado.tipo === 'ok' && estado.receitas.length === 0 ? (
          <p className="text-center text-gray-500">
            Nenhuma receita encontrada para essa busca. Tente outro termo, como “chicken” ou “salad”, ou tire algum filtro.
          </p>
        ) : null}
        {estado.tipo === 'ok' && estado.receitas.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-gray-500">
              {estado.total} {estado.total === 1 ? 'receita' : 'receitas'} para “{estado.termoUsado}”
            </p>
            <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {estado.receitas.map((receita) => (
                <li key={receita.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
                  <button type="button" onClick={() => setAberta(receita)} className="block h-full w-full text-left transition hover:bg-green-50">
                    {receita.imagem ? <img src={receita.imagem} alt="" loading="lazy" className="h-48 w-full object-cover" /> : null}
                    <span className="block p-4">
                      <span className="block text-xl font-semibold text-gray-800">{receita.titulo}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        {receita.minutos ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={14} aria-hidden="true" /> {receita.minutos} min
                          </span>
                        ) : null}
                        {receita.nutricao.calorias !== null ? (
                          <span className="inline-flex items-center gap-1">
                            <Flame size={14} aria-hidden="true" /> {receita.nutricao.calorias} kcal por porção
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-2 block">
                        <Selos receita={receita} />
                      </span>
                      <span className="mt-4 block font-medium text-green-700">Ver receita completa →</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
      <DetalheDaReceita key={aberta?.id ?? 'nenhuma'} receita={aberta} onFechar={() => setAberta(null)} />
    </section>
  );
}

function DetalheDaReceita({ receita, onFechar }: { receita: Receita | null; onFechar: () => void }) {
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
      aria-label={receita?.titulo ?? 'Receita'}
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
            <h2 className="flex-1 text-lg font-bold text-green-800">{receita.titulo}</h2>
            <button type="button" onClick={onFechar} aria-label="Fechar" className="grid size-10 place-items-center rounded-full text-gray-500 hover:bg-gray-100">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {receita.imagem ? <img src={receita.imagem} alt="" className="aspect-[3/2] w-full rounded-xl object-cover" /> : null}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              {receita.minutos ? (
                <span className="inline-flex items-center gap-1">
                  <Clock size={15} aria-hidden="true" /> {receita.minutos} min
                </span>
              ) : null}
              {receita.porcoes ? <span>{receita.porcoes} porções</span> : null}
              <Selos receita={receita} />
            </div>
            {receita.nutricao.calorias !== null ? (
              <dl className="mt-4 grid grid-cols-4 gap-2 rounded-xl bg-green-50 p-3 text-center text-sm">
                {(
                  [
                    ['Calorias', receita.nutricao.calorias, 'kcal'],
                    ['Proteínas', receita.nutricao.proteinas, 'g'],
                    ['Carboidratos', receita.nutricao.carboidratos, 'g'],
                    ['Gorduras', receita.nutricao.gorduras, 'g'],
                  ] as const
                ).map(([nome, valor, unidade]) => (
                  <div key={nome}>
                    <dt className="text-xs text-gray-500">{nome}</dt>
                    <dd className="font-bold text-gray-800">{valor === null ? '–' : `${valor} ${unidade}`}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <p className="mt-1 text-xs text-gray-500">Por porção. Valores estimados pelo Spoonacular, não substituem orientação de nutricionista.</p>

            <h3 className="mt-5 font-bold text-gray-800">Ingredientes</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {receita.ingredientes.map((ingrediente, i) => (
                <li key={i} className="flex justify-between gap-3 border-b border-gray-100 py-1">
                  <span>{ingrediente.nome}</span>
                  <span className="text-gray-500">{formatarQuantidade(ingrediente.quantidade, unidadeEmPortugues(ingrediente.unidade))}</span>
                </li>
              ))}
            </ul>
            {receita.passos.length ? (
              <>
                <h3 className="mt-5 font-bold text-gray-800">Modo de preparo</h3>
                <p className="text-xs text-gray-500">Instruções em inglês, como estão na fonte.</p>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
                  {receita.passos.map((passo, i) => (
                    <li key={i}>{passo}</li>
                  ))}
                </ol>
              </>
            ) : null}
            <p className="mt-5 text-sm">
              Fonte:{' '}
              {receita.fonte.url ? (
                <a href={receita.fonte.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-green-700 underline">
                  {receita.fonte.nome} <ExternalLink size={13} aria-hidden="true" />
                </a>
              ) : (
                receita.fonte.nome
              )}
            </p>
          </div>
          <PorNaSemana receita={{ id: receita.id, titulo: receita.titulo, imagem: receita.imagem }} />
        </>
      ) : null}
    </dialog>
  );
}

/** Rodapé das fichas de receita: escolhe o dia e a refeição e põe a receita na semana. */
export function PorNaSemana({ receita }: { receita: ReceitaNoPlano }) {
  const [dia, setDia] = useState<Dia>('seg');
  const [refeicao, setRefeicao] = useState<Refeicao>('almoco');
  const [adicionado, setAdicionado] = useState('');
  return (
    <form
      className="flex flex-wrap items-end gap-2 border-t border-gray-200 bg-green-50 px-5 py-3"
      onSubmit={(e) => {
        e.preventDefault();
        colocarNoPlano(dia, refeicao, receita);
        setAdicionado(`${NOMES_DOS_DIAS[dia]}, ${NOMES_DAS_REFEICOES[refeicao].toLowerCase()}`);
      }}
    >
      <label className="text-sm">
        <span className="block text-gray-600">Dia</span>
        <select value={dia} onChange={(e) => setDia(e.target.value as Dia)} className="mt-1 h-10 rounded-lg border border-gray-300 bg-white px-2">
          {DIAS.map((d) => (
            <option key={d} value={d}>
              {NOMES_DOS_DIAS[d]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="block text-gray-600">Refeição</span>
        <select value={refeicao} onChange={(e) => setRefeicao(e.target.value as Refeicao)} className="mt-1 h-10 rounded-lg border border-gray-300 bg-white px-2">
          {REFEICOES.map((r) => (
            <option key={r} value={r}>
              {NOMES_DAS_REFEICOES[r]}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700">
        <CalendarPlus size={17} aria-hidden="true" />
        Pôr na semana
      </button>
      {adicionado ? (
        <p role="status" className="w-full text-sm text-green-800">
          Adicionada em {adicionado}.
        </p>
      ) : null}
    </form>
  );
}
