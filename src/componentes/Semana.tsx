import { Check, Copy, MessageCircle, ShoppingBasket, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import {
  consultar,
  DIAS,
  formatarQuantidade,
  limparPlano,
  listaComoTexto,
  montarLista,
  NOMES_DAS_REFEICOES,
  NOMES_DOS_DIAS,
  REFEICOES,
  tirarDoPlano,
  usePlano,
  type ItemDaLista,
  type Receita,
} from '../dados.ts';

export function Semana() {
  const plano = usePlano();
  const planejadas = Object.values(plano);
  return (
    <section id="semana" aria-labelledby="titulo-semana" className="scroll-mt-20">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="titulo-semana" className="text-2xl font-bold">
            Minha semana
          </h2>
          <p className="mt-1 text-sm text-suave">Escolha uma receita e use "Pôr na semana". O plano fica neste navegador.</p>
        </div>
        {planejadas.length ? (
          <button type="button" onClick={limparPlano} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-suave hover:text-alerta">
            <Trash2 size={15} aria-hidden="true" />
            Limpar semana
          </button>
        ) : null}
      </div>
      <ol className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {DIAS.map((dia) => (
          <li key={dia} className="rounded-2xl border border-linha bg-cartao p-3">
            <h3 className="font-semibold">{NOMES_DOS_DIAS[dia]}</h3>
            <ul className="mt-2 space-y-2">
              {REFEICOES.map((refeicao) => {
                const receita = plano[`${dia}-${refeicao}`];
                return (
                  <li key={refeicao} className="text-sm">
                    <span className="text-xs text-suave">{NOMES_DAS_REFEICOES[refeicao]}</span>
                    {receita ? (
                      <span className="mt-0.5 flex items-center gap-2">
                        {receita.imagem ? <img src={receita.imagem} alt="" className="size-9 rounded-md object-cover" /> : null}
                        <span className="line-clamp-2 flex-1">{receita.titulo}</span>
                        <button
                          type="button"
                          onClick={() => tirarDoPlano(dia, refeicao)}
                          aria-label={`Tirar ${receita.titulo} de ${NOMES_DOS_DIAS[dia]}, ${NOMES_DAS_REFEICOES[refeicao]}`}
                          className="grid size-8 shrink-0 place-items-center rounded-full text-suave hover:bg-fundo"
                        >
                          <X size={15} aria-hidden="true" />
                        </button>
                      </span>
                    ) : (
                      <span className="mt-0.5 block text-suave/70">Livre</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
      <ListaDeCompras ids={[...new Set(planejadas.map((r) => r.id))]} />
    </section>
  );
}

function ListaDeCompras({ ids }: { ids: number[] }) {
  const [estado, setEstado] = useState<
    { tipo: 'parado' } | { tipo: 'carregando' } | { tipo: 'erro'; mensagem: string } | { tipo: 'ok'; itens: ItemDaLista[]; chave: string }
  >({ tipo: 'parado' });
  // Marcações só em memória: os termos do Spoonacular não permitem guardar ingredientes.
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [copiado, setCopiado] = useState(false);
  const chave = ids.join(',');

  async function gerar() {
    setEstado({ tipo: 'carregando' });
    setMarcados(new Set());
    setCopiado(false);
    const resultado = await consultar<{ receitas: Receita[] }>(new URLSearchParams({ ids: chave }));
    setEstado(resultado.tipo === 'ok' ? { tipo: 'ok', itens: montarLista(resultado.dados.receitas), chave } : resultado);
  }

  if (ids.length === 0) return null;
  const desatualizada = estado.tipo === 'ok' && estado.chave !== chave;
  const faltando = estado.tipo === 'ok' ? estado.itens.filter((item) => !marcados.has(`${item.nome}|${item.unidade}`)) : [];

  return (
    <div id="lista" className="mt-6 scroll-mt-20 rounded-2xl border border-linha bg-cartao p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <ShoppingBasket size={20} className="text-folha" aria-hidden="true" />
          Lista de compras
        </h3>
        <button type="button" onClick={gerar} className="rounded-lg bg-folha px-4 py-2 text-sm font-semibold text-white hover:bg-folha-escura">
          {estado.tipo === 'ok' ? 'Atualizar lista' : `Montar com ${ids.length} ${ids.length === 1 ? 'receita' : 'receitas'}`}
        </button>
      </div>
      {estado.tipo === 'carregando' ? <p className="mt-3 text-suave">Somando os ingredientes...</p> : null}
      {estado.tipo === 'erro' ? (
        <p role="alert" className="mt-3 text-alerta">
          {estado.mensagem}
        </p>
      ) : null}
      {desatualizada ? <p className="mt-3 text-sm text-alerta">A semana mudou. Atualize a lista.</p> : null}
      {estado.tipo === 'ok' ? (
        <>
          <p className="mt-2 text-sm text-suave">
            O mesmo ingrediente na mesma unidade é somado. Toque para riscar o que já tem em casa.
          </p>
          <ul className="mt-3 grid gap-x-6 sm:grid-cols-2">
            {estado.itens.map((item) => {
              const id = `${item.nome}|${item.unidade}`;
              const marcado = marcados.has(id);
              return (
                <li key={id} className="border-b border-linha/70">
                  <label className="flex cursor-pointer items-center gap-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => {
                        const novos = new Set(marcados);
                        if (marcado) novos.delete(id);
                        else novos.add(id);
                        setMarcados(novos);
                      }}
                      className="size-4 accent-folha"
                    />
                    <span className={`flex-1 ${marcado ? 'text-suave line-through' : ''}`}>{item.nome}</span>
                    <span className="text-suave">{formatarQuantidade(item.quantidade, item.unidade)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(listaComoTexto(faltando));
                  setCopiado(true);
                } catch {
                  setCopiado(false);
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-linha px-3 py-2 text-sm font-medium"
            >
              {copiado ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              {copiado ? 'Copiada' : 'Copiar o que falta'}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(listaComoTexto(faltando))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-linha px-3 py-2 text-sm font-medium"
            >
              <MessageCircle size={16} aria-hidden="true" />
              Enviar pelo WhatsApp
            </a>
          </div>
        </>
      ) : null}
    </div>
  );
}
