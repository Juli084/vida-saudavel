import { useEffect, useId, useRef, useState } from 'react';

const BUSCA_INICIAL = 'healthy breakfast';
const FALHA = 'Não foi possível buscar receitas agora.';

// Devolve o próximo estado da seção; não mexe em estado do React.
async function pedirReceitas(termo) {
  try {
    const resposta = await fetch(`/api/receitas?q=${encodeURIComponent(termo)}`);
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) return { tipo: 'erro', mensagem: dados.erro ?? FALHA };
    return { tipo: 'ok', receitas: dados.receitas ?? [] };
  } catch {
    return { tipo: 'erro', mensagem: FALHA };
  }
}

export default function RecipeSection() {
  const [busca, setBusca] = useState(BUSCA_INICIAL);
  const [estado, setEstado] = useState({ tipo: 'carregando' });
  const ultimaBusca = useRef(0);
  const idCampo = useId();

  useEffect(() => {
    let ignorar = false;
    pedirReceitas(BUSCA_INICIAL).then((proximo) => {
      if (!ignorar && ultimaBusca.current === 0) setEstado(proximo);
    });
    return () => {
      ignorar = true;
    };
  }, []);

  function enviar(event) {
    event.preventDefault();
    const termo = busca.trim();
    if (!termo) return;

    // Se o usuário buscar de novo antes da resposta, vale só a última.
    const numero = ++ultimaBusca.current;
    setEstado({ tipo: 'carregando' });
    pedirReceitas(termo).then((proximo) => {
      if (numero === ultimaBusca.current) setEstado(proximo);
    });
  }

  return (
    <section id="receitas" className="bg-white py-20 px-6 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-green-800 mb-4 text-center">Encontre receitas saudáveis</h2>

        <p className="text-center text-sm text-gray-600 mb-6">
          As receitas vêm da base do Spoonacular e estão em inglês. Pesquise com termos como{' '}
          <strong>breakfast</strong>, <strong>chicken</strong> ou <strong>smoothie</strong>.
        </p>

        <form onSubmit={enviar} className="mb-8 flex gap-3">
          <label htmlFor={idCampo} className="sr-only">
            Buscar receitas
          </label>
          <input
            id={idCampo}
            type="text"
            placeholder="Ex.: breakfast, salad, chicken..."
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            className="w-full p-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            className="bg-green-600 text-white px-6 rounded-xl hover:bg-green-700 transition disabled:opacity-60"
            disabled={estado.tipo === 'carregando'}
          >
            Buscar
          </button>
        </form>

        {estado.tipo === 'carregando' && (
          <p role="status" className="text-center text-gray-500">
            Carregando receitas...
          </p>
        )}
        {estado.tipo === 'erro' && (
          <p role="alert" className="text-center text-red-700">
            {estado.mensagem}
          </p>
        )}
        {estado.tipo === 'ok' && estado.receitas.length === 0 && (
          <p className="text-center text-gray-500">Nenhuma receita encontrada para essa busca.</p>
        )}
        {estado.tipo === 'ok' && estado.receitas.length > 0 && (
          <ul className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {estado.receitas.map((receita) => (
              <li key={receita.id} className="bg-white shadow-md rounded-2xl overflow-hidden border">
                <img src={receita.image} alt="" loading="lazy" className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-800">{receita.title}</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {receita.readyInMinutes} min • {receita.vegetarian ? 'Vegetariana' : 'Não vegetariana'}
                  </p>
                  {receita.sourceUrl && (
                    <a
                      href={receita.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 block text-green-700 font-medium hover:underline"
                    >
                      Ver receita completa
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
