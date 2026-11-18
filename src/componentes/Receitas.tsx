import { CalendarPlus, Clock, ExternalLink, Flame, Search, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
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
} from '../dados.ts';

const DIETAS = [
  { valor: 'vegetariana', nome: 'Vegetariana' },
  { valor: 'vegana', nome: 'Vegana' },
] as const;
const RESTRICOES = [
  { valor: 'gluten', nome: 'Sem glúten' },
  { valor: 'lactose', nome: 'Sem lactose' },
] as const;

function Selos({ receita }: { receita: Receita }) {
  const selos = [
    receita.vegana ? 'Vegana' : receita.vegetariana ? 'Vegetariana' : null,
    receita.semGluten ? 'Sem glúten' : null,
    receita.semLactose ? 'Sem lactose' : null,
  ].filter(Boolean);
  return selos.length ? (
    <span className="flex flex-wrap gap-1">
      {selos.map((selo) => (
        <span key={selo} className="rounded-full bg-folha-clara px-2 py-0.5 text-xs font-medium text-folha-escura">
          {selo}
        </span>
      ))}
    </span>
  ) : null;
}

function DetalheDaReceita({ receita, onFechar }: { receita: Receita | null; onFechar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [dia, setDia] = useState<Dia>('seg');
  const [refeicao, setRefeicao] = useState<Refeicao>('almoco');
  const [adicionado, setAdicionado] = useState('');

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
          <div className="flex items-start gap-3 border-b border-linha px-5 py-3">
            <h2 className="flex-1 text-lg font-bold">{receita.titulo}</h2>
            <button type="button" onClick={onFechar} aria-label="Fechar" className="grid size-10 place-items-center rounded-full text-suave hover:bg-fundo">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {receita.imagem ? <img src={receita.imagem} alt="" className="aspect-[3/2] w-full rounded-xl object-cover" /> : null}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-suave">
              {receita.minutos ? (
                <span className="inline-flex items-center gap-1">
                  <Clock size={15} aria-hidden="true" /> {receita.minutos} min
                </span>
              ) : null}
              {receita.porcoes ? <span>{receita.porcoes} porções</span> : null}
              <Selos receita={receita} />
            </div>
            {receita.nutricao.calorias !== null ? (
              <dl className="mt-4 grid grid-cols-4 gap-2 rounded-xl bg-fundo p-3 text-center text-sm">
                {(
                  [
                    ['Calorias', receita.nutricao.calorias, 'kcal'],
                    ['Proteínas', receita.nutricao.proteinas, 'g'],
                    ['Carboidratos', receita.nutricao.carboidratos, 'g'],
                    ['Gorduras', receita.nutricao.gorduras, 'g'],
                  ] as const
                ).map(([nome, valor, unidade]) => (
                  <div key={nome}>
                    <dt className="text-xs text-suave">{nome}</dt>
                    <dd className="font-bold">{valor === null ? '–' : `${valor} ${unidade}`}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <p className="mt-1 text-xs text-suave">Por porção. Valores estimados pelo Spoonacular, não substituem orientação de nutricionista.</p>

            <h3 className="mt-5 font-bold">Ingredientes</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {receita.ingredientes.map((ingrediente, i) => (
                <li key={i} className="flex justify-between gap-3 border-b border-linha/70 py-1">
                  <span>{ingrediente.nome}</span>
                  <span className="text-suave">{formatarQuantidade(ingrediente.quantidade, unidadeEmPortugues(ingrediente.unidade))}</span>
                </li>
              ))}
            </ul>
            {receita.passos.length ? (
              <>
                <h3 className="mt-5 font-bold">Modo de preparo</h3>
                <p className="text-xs text-suave">Instruções em inglês, como estão na fonte.</p>
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
                <a href={receita.fonte.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-folha underline">
                  {receita.fonte.nome} <ExternalLink size={13} aria-hidden="true" />
                </a>
              ) : (
                receita.fonte.nome
              )}
            </p>
          </div>
          <form
            className="flex flex-wrap items-end gap-2 border-t border-linha bg-fundo/60 px-5 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              colocarNoPlano(dia, refeicao, receita);
              setAdicionado(`${NOMES_DOS_DIAS[dia]}, ${NOMES_DAS_REFEICOES[refeicao].toLowerCase()}`);
            }}
          >
            <label className="text-sm">
              <span className="block text-suave">Dia</span>
              <select value={dia} onChange={(e) => setDia(e.target.value as Dia)} className="mt-1 h-10 rounded-lg border border-linha bg-cartao px-2">
                {DIAS.map((d) => (
                  <option key={d} value={d}>
                    {NOMES_DOS_DIAS[d]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="block text-suave">Refeição</span>
              <select value={refeicao} onChange={(e) => setRefeicao(e.target.value as Refeicao)} className="mt-1 h-10 rounded-lg border border-linha bg-cartao px-2">
                {REFEICOES.map((r) => (
                  <option key={r} value={r}>
                    {NOMES_DAS_REFEICOES[r]}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-lg bg-folha px-4 text-sm font-semibold text-white hover:bg-folha-escura">
              <CalendarPlus size={17} aria-hidden="true" />
              Pôr na semana
            </button>
            {adicionado ? (
              <p role="status" className="w-full text-sm text-folha-escura">
                Adicionada em {adicionado}.
              </p>
            ) : null}
          </form>
        </>
      ) : null}
    </dialog>
  );
}

export function Receitas() {
  const [termo, setTermo] = useState('');
  const [dieta, setDieta] = useState('');
  const [sem, setSem] = useState<string[]>([]);
  const [tempo, setTempo] = useState('');
  const [refeicao, setRefeicao] = useState('');
  const [estado, setEstado] = useState<
    { tipo: 'inicio' } | { tipo: 'carregando' } | { tipo: 'erro'; mensagem: string } | { tipo: 'ok'; receitas: Receita[]; total: number; termoUsado: string }
  >({ tipo: 'inicio' });
  const [aberta, setAberta] = useState<Receita | null>(null);

  async function buscar(evento?: FormEvent) {
    evento?.preventDefault();
    if (!termo.trim()) return;
    const parametros = new URLSearchParams({ q: termo.trim() });
    if (dieta) parametros.set('dieta', dieta);
    for (const restricao of sem) parametros.append('sem', restricao);
    if (tempo) parametros.set('tempo', tempo);
    if (refeicao) parametros.set('refeicao', refeicao);
    setEstado({ tipo: 'carregando' });
    const resultado = await consultar<{ receitas: Receita[]; total: number; termoUsado: string }>(parametros);
    setEstado(resultado.tipo === 'ok' ? { tipo: 'ok', ...resultado.dados } : resultado);
  }

  return (
    <section id="receitas" aria-labelledby="titulo-receitas" className="scroll-mt-20">
      <h2 id="titulo-receitas" className="text-2xl font-bold">
        Receitas
      </h2>
      <p className="mt-1 text-sm text-suave">
        A base de receitas é em inglês. Termos comuns em português, como "frango" ou "grão de bico", são traduzidos na busca.
      </p>
      <form onSubmit={buscar} className="mt-4 space-y-3 rounded-2xl border border-linha bg-cartao p-4">
        <div className="flex gap-2">
          <label className="relative flex-1">
            <span className="sr-only">O que você quer cozinhar</span>
            <Search size={18} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-suave" />
            <input
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Ex.: frango, salada, sopa de lentilha"
              maxLength={80}
              className="h-11 w-full rounded-lg border border-linha bg-fundo/40 pr-3 pl-10 focus:border-folha focus:outline-none"
            />
          </label>
          <button type="submit" className="h-11 rounded-lg bg-folha px-5 font-semibold text-white hover:bg-folha-escura">
            Buscar
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {DIETAS.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              aria-pressed={dieta === opcao.valor}
              onClick={() => setDieta(dieta === opcao.valor ? '' : opcao.valor)}
              className={`rounded-full border px-3 py-1.5 text-sm ${dieta === opcao.valor ? 'border-folha bg-folha text-white' : 'border-linha'}`}
            >
              {opcao.nome}
            </button>
          ))}
          {RESTRICOES.map((opcao) => {
            const ativo = sem.includes(opcao.valor);
            return (
              <button
                key={opcao.valor}
                type="button"
                aria-pressed={ativo}
                onClick={() => setSem(ativo ? sem.filter((s) => s !== opcao.valor) : [...sem, opcao.valor])}
                className={`rounded-full border px-3 py-1.5 text-sm ${ativo ? 'border-folha bg-folha text-white' : 'border-linha'}`}
              >
                {opcao.nome}
              </button>
            );
          })}
          <label className="text-sm">
            <span className="sr-only">Tempo de preparo</span>
            <select value={tempo} onChange={(e) => setTempo(e.target.value)} className="h-9 rounded-full border border-linha bg-cartao px-3">
              <option value="">Qualquer tempo</option>
              <option value="15">Até 15 min</option>
              <option value="30">Até 30 min</option>
              <option value="45">Até 45 min</option>
              <option value="60">Até 1 hora</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="sr-only">Tipo de refeição</span>
            <select value={refeicao} onChange={(e) => setRefeicao(e.target.value)} className="h-9 rounded-full border border-linha bg-cartao px-3">
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
      </form>

      <div className="mt-5" aria-live="polite">
        {estado.tipo === 'carregando' ? <p className="text-suave">Buscando receitas...</p> : null}
        {estado.tipo === 'erro' ? (
          <p role="alert" className="rounded-xl bg-cartao px-4 py-5 text-center text-alerta">
            {estado.mensagem}
          </p>
        ) : null}
        {estado.tipo === 'ok' ? (
          estado.receitas.length === 0 ? (
            <p className="rounded-xl bg-cartao px-4 py-5 text-center text-suave">Nenhuma receita com esses filtros. Tente outro termo ou menos filtros.</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-suave">
                {estado.total} receitas para "{estado.termoUsado}"
              </p>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {estado.receitas.map((receita) => (
                  <li key={receita.id} className="overflow-hidden rounded-2xl border border-linha bg-cartao">
                    <button type="button" onClick={() => setAberta(receita)} className="block w-full text-left">
                      {receita.imagem ? <img src={receita.imagem} alt="" loading="lazy" className="aspect-[3/2] w-full object-cover" /> : null}
                      <span className="block p-4">
                        <span className="block font-semibold">{receita.titulo}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-3 text-sm text-suave">
                          {receita.minutos ? (
                            <span className="inline-flex items-center gap-1">
                              <Clock size={14} aria-hidden="true" /> {receita.minutos} min
                            </span>
                          ) : null}
                          {receita.nutricao.calorias !== null ? (
                            <span className="inline-flex items-center gap-1">
                              <Flame size={14} aria-hidden="true" /> {receita.nutricao.calorias} kcal/porção
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-2 block">
                          <Selos receita={receita} />
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )
        ) : null}
      </div>
      <DetalheDaReceita key={aberta?.id ?? "nenhuma"} receita={aberta} onFechar={() => setAberta(null)} />
    </section>
  );
}
