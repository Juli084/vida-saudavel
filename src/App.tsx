import { ExternalLink, Leaf } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alimentos } from './componentes/Alimentos.tsx';
import { Prato } from './componentes/Prato.tsx';
import { Receitas } from './componentes/Receitas.tsx';
import { Semana } from './componentes/Semana.tsx';
import { Sugestoes } from './componentes/Sugestoes.tsx';
import { DEZ_PASSOS, GUIA_ALIMENTAR } from './guia.ts';

function Guia() {
  return (
    <section id="guia" aria-labelledby="titulo-guia" className="scroll-mt-20">
      <h2 id="titulo-guia" className="text-2xl font-bold">
        Dez passos para comer bem
      </h2>
      <p className="mt-1 text-sm text-suave">
        Do{' '}
        <a href={GUIA_ALIMENTAR.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-folha underline">
          {GUIA_ALIMENTAR.titulo} <ExternalLink size={13} aria-hidden="true" />
        </a>{' '}
        ({GUIA_ALIMENTAR.edicao}). Os títulos são do guia; os resumos são meus.
      </p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2">
        {DEZ_PASSOS.map((passo, i) => (
          <li key={passo.titulo} className="flex gap-3 rounded-2xl border border-linha bg-cartao p-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-folha-clara font-bold text-folha-escura">{i + 1}</span>
            <span>
              <span className="block font-semibold">{passo.titulo}</span>
              <span className="mt-1 block text-sm text-suave">{passo.resumo}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * As receitas dependem da chave do Spoonacular no servidor. Sem ela, a página não mostra uma
 * busca que só daria erro: diz o motivo e segue com a parte de alimentos, que não depende de
 * serviço externo. Se a pergunta falhar (rede), as receitas aparecem e o erro vem na busca.
 */
function useReceitasConfiguradas(): boolean | null {
  const [configuradas, setConfiguradas] = useState<boolean | null>(null);
  useEffect(() => {
    let ativo = true;
    fetch('/api/receitas?status=1')
      .then((r) => r.json() as Promise<{ configurada?: boolean }>)
      .then((dados) => ativo && setConfiguradas(dados.configurada !== false))
      .catch(() => ativo && setConfiguradas(true));
    return () => {
      ativo = false;
    };
  }, []);
  return configuradas;
}

function ReceitasIndisponiveis() {
  return (
    <section id="receitas" aria-labelledby="titulo-receitas" className="scroll-mt-20 rounded-2xl border border-dashed border-linha bg-cartao p-5">
      <h2 id="titulo-receitas" className="text-xl font-bold">
        Receitas e plano da semana
      </h2>
      <p className="mt-1 text-sm text-suave">
        As receitas vêm do Spoonacular, um serviço que exige chave de acesso, e ela ainda não está configurada nesta versão
        publicada. Enquanto isso, busca, sugestões e prato funcionam com a tabela oficial de alimentos, sem depender de serviço
        externo.
      </p>
    </section>
  );
}

export function App() {
  const receitas = useReceitasConfiguradas();
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-linha bg-fundo/90 backdrop-blur">
        <nav aria-label="Principal" className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3">
          <a href="#inicio" className="mr-auto inline-flex items-center gap-2 text-lg font-bold">
            <Leaf size={22} className="text-folha" aria-hidden="true" />
            Vida Saudável
          </a>
          <a href="#alimentos" className="text-sm font-medium text-suave hover:text-tinta">
            Alimentos
          </a>
          <a href="#sugestoes" className="text-sm font-medium text-suave hover:text-tinta">
            Sugestões
          </a>
          <a href="#prato" className="text-sm font-medium text-suave hover:text-tinta">
            Meu prato
          </a>
          {receitas ? (
            <a href="#receitas" className="text-sm font-medium text-suave hover:text-tinta">
              Receitas
            </a>
          ) : null}
          <a href="#guia" className="text-sm font-medium text-suave hover:text-tinta">
            Guia alimentar
          </a>
        </nav>
      </header>
      <main id="inicio" className="mx-auto max-w-6xl space-y-14 px-4 pt-8 pb-16">
        <div className="max-w-2xl">
          <h1 className="text-3xl leading-tight font-bold sm:text-4xl">Saiba o que tem no que você come e monte um prato equilibrado.</h1>
          <p className="mt-3 text-suave">
            Composição de 597 alimentos da tabela oficial da UNICAMP, sugestões por nutriente e o total do seu prato em relação
            ao valor diário da Anvisa. Para ir além dos números, os dez passos do guia do Ministério da Saúde.
          </p>
        </div>
        <Alimentos />
        <Sugestoes />
        <Prato />
        {receitas === false ? <ReceitasIndisponiveis /> : null}
        {receitas ? (
          <>
            <Receitas />
            <Semana />
          </>
        ) : null}
        <Guia />
      </main>
      <footer className="mx-auto max-w-6xl space-y-2 px-4 pb-10 text-xs text-suave">
        <p>
          Composição dos alimentos: Tabela Brasileira de Composição de Alimentos (TACO), 4ª edição revisada e ampliada,
          NEPA/UNICAMP, 2011. Valores diários de referência: Anvisa, Instrução Normativa nº 75/2020, Anexo II.
        </p>
        {receitas ? (
          <p>
            Receitas e estimativas nutricionais das receitas do{' '}
            <a href="https://spoonacular.com/food-api" target="_blank" rel="noopener noreferrer" className="underline">
              Spoonacular
            </a>
            , com o crédito da fonte original em cada receita.
          </p>
        ) : null}
        <p>As informações não substituem orientação de nutricionista ou médico.</p>
      </footer>
    </>
  );
}
