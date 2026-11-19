import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { buscar, formatarValor, type Alimento } from '../alimentos/dados.ts';
import { useTabela } from '../alimentos/useTabela.ts';
import { FichaDoAlimento } from './FichaDoAlimento.tsx';

const EXEMPLOS = ['feijão', 'banana', 'brócolis', 'ovo', 'arroz integral', 'sardinha'];
const POR_PAGINA = 24;

export function CartaoDoAlimento({ alimento, grupo, destaque, onAbrir }: { alimento: Alimento; grupo: string; destaque?: string; onAbrir: () => void }) {
  return (
    <li>
      <button type="button" onClick={onAbrir} className="flex h-full w-full flex-col rounded-2xl border border-linha bg-cartao p-4 text-left hover:border-folha">
        <span className="font-semibold">{alimento.nome}</span>
        <span className="mt-0.5 text-xs text-suave">{grupo}</span>
        <span className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-3 text-sm text-suave">
          {destaque ? <span className="font-semibold text-folha-escura">{destaque}</span> : null}
          {/* Sem dado na tabela (como a fibra das carnes), o item não aparece no cartão. */}
          {alimento.energia !== null ? <span>{formatarValor(alimento.energia, 'kcal')}</span> : null}
          {alimento.proteina !== null ? <span>Proteína {formatarValor(alimento.proteina, 'g')}</span> : null}
          {alimento.fibra !== null ? <span>Fibra {formatarValor(alimento.fibra, 'g')}</span> : null}
        </span>
      </button>
    </li>
  );
}

export function Alimentos() {
  const estado = useTabela();
  const [termo, setTermo] = useState('');
  const [grupo, setGrupo] = useState<number | null>(null);
  const [quantos, setQuantos] = useState(POR_PAGINA);
  const [aberto, setAberto] = useState<Alimento | null>(null);

  const resultados = useMemo(() => {
    if (estado.tipo !== 'ok' || (!termo.trim() && grupo === null)) return [];
    return buscar(estado.tabela.alimentos, termo, grupo);
  }, [estado, termo, grupo]);
  const grupos = estado.tipo === 'ok' ? estado.tabela.grupos : [];

  return (
    <section id="alimentos" aria-labelledby="titulo-alimentos" className="scroll-mt-20">
      <h2 id="titulo-alimentos" className="text-2xl font-bold">
        O que tem em cada alimento
      </h2>
      <p className="mt-1 text-sm text-suave">
        597 alimentos da Tabela Brasileira de Composição de Alimentos (TACO), da UNICAMP. Escolha a porção e veja quanto cada
        nutriente representa do valor diário.
      </p>
      <div className="mt-4 space-y-3 rounded-2xl border border-linha bg-cartao p-4">
        <div className="flex flex-wrap gap-2">
          <label className="relative min-w-60 flex-1">
            <span className="sr-only">Buscar alimento</span>
            <Search size={18} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-suave" />
            <input
              type="search"
              value={termo}
              onChange={(e) => {
                setTermo(e.target.value);
                setQuantos(POR_PAGINA);
              }}
              placeholder="Ex.: feijão preto, mamão, peito de frango"
              maxLength={60}
              className="h-11 w-full rounded-lg border border-linha bg-fundo/40 pr-3 pl-10 focus:border-folha focus:outline-none"
            />
          </label>
          <label>
            <span className="sr-only">Grupo de alimentos</span>
            <select
              value={grupo ?? ''}
              onChange={(e) => {
                setGrupo(e.target.value === '' ? null : Number(e.target.value));
                setQuantos(POR_PAGINA);
              }}
              className="h-11 rounded-lg border border-linha bg-cartao px-3"
            >
              <option value="">Todos os grupos</option>
              {grupos.map((nome, i) => (
                <option key={nome} value={i}>
                  {nome}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!termo.trim() && grupo === null ? (
          <p className="flex flex-wrap items-center gap-2 text-sm text-suave">
            Experimente:
            {EXEMPLOS.map((exemplo) => (
              <button key={exemplo} type="button" onClick={() => setTermo(exemplo)} className="rounded-full border border-linha px-3 py-1 text-tinta hover:border-folha">
                {exemplo}
              </button>
            ))}
          </p>
        ) : null}
      </div>

      <div className="mt-4" aria-live="polite">
        {estado.tipo === 'carregando' ? <p className="text-suave">Carregando a tabela de alimentos...</p> : null}
        {estado.tipo === 'erro' ? (
          <p role="alert" className="text-alerta">
            Não foi possível carregar a tabela de alimentos. Recarregue a página.
          </p>
        ) : null}
        {estado.tipo === 'ok' && (termo.trim() || grupo !== null) ? (
          resultados.length === 0 ? (
            <p className="rounded-xl bg-cartao px-4 py-5 text-center text-suave">Nenhum alimento com esse nome. Tente uma palavra só, como "feijão".</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-suave">
                {resultados.length} {resultados.length === 1 ? 'alimento' : 'alimentos'} · valores por 100 g
              </p>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {resultados.slice(0, quantos).map((alimento) => (
                  <CartaoDoAlimento key={alimento.id} alimento={alimento} grupo={grupos[alimento.grupo] ?? ''} onAbrir={() => setAberto(alimento)} />
                ))}
              </ul>
              {resultados.length > quantos ? (
                <button type="button" onClick={() => setQuantos(quantos + POR_PAGINA)} className="mt-4 rounded-lg border border-linha px-4 py-2 text-sm font-medium">
                  Mostrar mais {Math.min(POR_PAGINA, resultados.length - quantos)}
                </button>
              ) : null}
            </>
          )
        ) : null}
      </div>
      <FichaDoAlimento key={aberto?.id ?? 'nenhum'} alimento={aberto} grupo={aberto ? (grupos[aberto.grupo] ?? '') : ''} onFechar={() => setAberto(null)} />
    </section>
  );
}
