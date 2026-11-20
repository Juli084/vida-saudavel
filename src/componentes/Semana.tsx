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
  type ReceitaNoPlano,
} from '../dados.ts';
import { carregarReceitas, ingredientesParaLista } from '../receitas/dados.ts';

export function Semana() {
  const plano = usePlano();
  const planejadas = Object.values(plano);
  // Só aparece depois que a pessoa põe alguma receita na semana.
  if (planejadas.length === 0) return null;
  return (
    <section id="semana" aria-labelledby="titulo-semana" className="scroll-mt-20 bg-white px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 id="titulo-semana" className="mb-2 text-center text-3xl font-bold text-green-800">
          Minha semana
        </h2>
        <p className="text-center text-sm text-gray-600">As receitas que você pôs na semana. O plano fica salvo neste navegador.</p>
        <div className="mt-2 text-center">
          <button type="button" onClick={limparPlano} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-gray-500 hover:text-red-700">
            <Trash2 size={15} aria-hidden="true" />
            Limpar semana
          </button>
        </div>
        <ol className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {DIAS.map((dia) => (
            <li key={dia} className="rounded-2xl bg-green-50 p-3">
              <h3 className="font-semibold">{NOMES_DOS_DIAS[dia]}</h3>
              <ul className="mt-2 space-y-2">
                {REFEICOES.map((refeicao) => {
                  const receita = plano[`${dia}-${refeicao}`];
                  return (
                    <li key={refeicao} className="text-sm">
                      <span className="text-xs text-gray-500">{NOMES_DAS_REFEICOES[refeicao]}</span>
                      {receita ? (
                        <span className="mt-0.5 flex items-center gap-2">
                          {receita.imagem ? <img src={receita.imagem} alt="" className="size-9 rounded-md object-cover" /> : null}
                          <span className="line-clamp-2 flex-1">{receita.titulo}</span>
                          <button
                            type="button"
                            onClick={() => tirarDoPlano(dia, refeicao)}
                            aria-label={`Tirar ${receita.titulo} de ${NOMES_DOS_DIAS[dia]}, ${NOMES_DAS_REFEICOES[refeicao]}`}
                            className="grid size-8 shrink-0 place-items-center rounded-full text-gray-500 hover:bg-gray-100"
                          >
                            <X size={15} aria-hidden="true" />
                          </button>
                        </span>
                      ) : (
                        <span className="mt-0.5 block text-gray-400">Livre</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
        <ListaDeCompras planejadas={planejadas} />
      </div>
    </section>
  );
}

function ListaDeCompras({ planejadas }: { planejadas: ReceitaNoPlano[] }) {
  const [estado, setEstado] = useState<
    { tipo: 'parado' } | { tipo: 'carregando' } | { tipo: 'erro'; mensagem: string } | { tipo: 'ok'; itens: ItemDaLista[]; chave: string }
  >({ tipo: 'parado' });
  // Marcações só em memória: os termos do Spoonacular não permitem guardar ingredientes.
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [copiado, setCopiado] = useState(false);
  // Receitas brasileiras vêm do próprio site; as internacionais, do Spoonacular, de novo a cada lista.
  const brasileiras = [...new Set(planejadas.filter((r) => r.fonte === 'ms').map((r) => r.id))];
  const internacionais = [...new Set(planejadas.filter((r) => r.fonte !== 'ms').map((r) => r.id))];
  const total = brasileiras.length + internacionais.length;
  const chave = `ms:${brasileiras.join(',')}|sp:${internacionais.join(',')}`;

  async function gerar() {
    setEstado({ tipo: 'carregando' });
    setMarcados(new Set());
    setCopiado(false);
    const receitas: { titulo: string; ingredientes: { nome: string; quantidade: number | null; unidade: string }[] }[] = [];
    if (brasileiras.length) {
      try {
        const base = await carregarReceitas();
        for (const r of base.receitas.filter((x) => brasileiras.includes(x.id))) receitas.push({ titulo: r.nome, ingredientes: ingredientesParaLista(r) });
      } catch {
        setEstado({ tipo: 'erro', mensagem: 'Não foi possível carregar as receitas. Recarregue a página.' });
        return;
      }
    }
    if (internacionais.length) {
      const resultado = await consultar<{ receitas: Receita[] }>(new URLSearchParams({ ids: internacionais.join(',') }));
      if (resultado.tipo === 'erro') {
        setEstado(resultado);
        return;
      }
      receitas.push(...resultado.dados.receitas);
    }
    setEstado({ tipo: 'ok', itens: montarLista(receitas), chave });
  }

  if (total === 0) return null;
  const desatualizada = estado.tipo === 'ok' && estado.chave !== chave;
  const faltando = estado.tipo === 'ok' ? estado.itens.filter((item) => !marcados.has(`${item.nome}|${item.unidade}`)) : [];

  return (
    <div id="lista" className="mt-6 scroll-mt-20 rounded-2xl bg-white p-5 shadow-md border border-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <ShoppingBasket size={20} className="text-green-600" aria-hidden="true" />
          Lista de compras
        </h3>
        <button type="button" onClick={gerar} className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
          {estado.tipo === 'ok' ? 'Atualizar lista' : `Montar com ${total} ${total === 1 ? 'receita' : 'receitas'}`}
        </button>
      </div>
      {estado.tipo === 'carregando' ? <p className="mt-3 text-gray-500">Somando os ingredientes...</p> : null}
      {estado.tipo === 'erro' ? (
        <p role="alert" className="mt-3 text-red-700">
          {estado.mensagem}
        </p>
      ) : null}
      {desatualizada ? <p className="mt-3 text-sm text-red-700">A semana mudou. Atualize a lista.</p> : null}
      {estado.tipo === 'ok' ? (
        <>
          <p className="mt-2 text-sm text-gray-500">
            O mesmo ingrediente na mesma unidade é somado. Toque para riscar o que já tem em casa.
          </p>
          <ul className="mt-3 grid gap-x-6 sm:grid-cols-2">
            {estado.itens.map((item) => {
              const id = `${item.nome}|${item.unidade}`;
              const marcado = marcados.has(id);
              return (
                <li key={id} className="border-b border-gray-100">
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
                      className="size-4 accent-green-600"
                    />
                    <span className={`flex-1 ${marcado ? 'text-gray-500 line-through' : ''}`}>{item.nome}</span>
                    <span className="text-gray-500">{formatarQuantidade(item.quantidade, item.unidade)}</span>
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
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium"
            >
              {copiado ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              {copiado ? 'Copiada' : 'Copiar o que falta'}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(listaComoTexto(faltando))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium"
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
