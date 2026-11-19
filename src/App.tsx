import { useEffect, useState } from 'react';
import { Busca } from './componentes/Busca.tsx';
import { Dicas } from './componentes/Dicas.tsx';
import { Inicio } from './componentes/Inicio.tsx';
import { Navbar } from './componentes/Navbar.tsx';
import { Prato } from './componentes/Prato.tsx';
import { Semana } from './componentes/Semana.tsx';

/**
 * As receitas dependem da chave do Spoonacular no servidor. Sem ela, a busca mostra só a
 * composição dos alimentos e avisa que as receitas não estão disponíveis, em vez de um erro.
 * Se a pergunta falhar (rede), a busca tenta as receitas e o erro aparece lá.
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

export function App() {
  const receitas = useReceitasConfiguradas();
  return (
    <>
      <Navbar />
      <main>
        <Inicio />
        <Busca receitas={receitas} />
        <Prato />
        <Semana />
        <Dicas />
      </main>
      <footer className="border-t border-gray-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-6xl space-y-2 text-center text-xs text-gray-500">
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
        </div>
      </footer>
    </>
  );
}
