import { Apple, ChefHat, Clock, ExternalLink, FlaskConical, Heart, Megaphone, Sandwich, ShoppingCart, Store, Utensils } from 'lucide-react';
import { useState } from 'react';
import { DEZ_PASSOS, GUIA_ALIMENTAR } from '../guia.ts';

// Um ícone por passo, na ordem do guia.
const ICONES = [
  <Apple key="1" className="h-8 w-8 text-red-500" />,
  <Heart key="2" className="h-8 w-8 text-pink-500" />,
  <Sandwich key="3" className="h-8 w-8 text-orange-500" />,
  <FlaskConical key="4" className="h-8 w-8 text-blue-600" />,
  <Utensils key="5" className="h-8 w-8 text-gray-700" />,
  <ShoppingCart key="6" className="h-8 w-8 text-green-800" />,
  <ChefHat key="7" className="h-8 w-8 text-orange-400" />,
  <Clock key="8" className="h-8 w-8 text-indigo-500" />,
  <Store key="9" className="h-8 w-8 text-emerald-600" />,
  <Megaphone key="10" className="h-8 w-8 text-purple-500" />,
];

export function Dicas() {
  const [todas, setTodas] = useState(false);
  const visiveis = todas ? DEZ_PASSOS : DEZ_PASSOS.slice(0, 3);

  return (
    <section id="dicas" aria-labelledby="titulo-dicas" className="scroll-mt-20 bg-white px-6 py-16">
      <div className="mx-auto max-w-5xl text-center">
        <h2 id="titulo-dicas" className="mb-3 text-3xl font-bold text-green-800">
          Dicas Nutricionais para uma Vida Saudável
        </h2>
        <p className="mb-10 text-sm text-gray-600">
          Os dez passos do{' '}
          <a href={GUIA_ALIMENTAR.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-green-700 underline">
            {GUIA_ALIMENTAR.titulo} <ExternalLink size={13} aria-hidden="true" />
          </a>{' '}
          ({GUIA_ALIMENTAR.edicao}).
        </p>

        <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {visiveis.map((passo, i) => (
            <li key={passo.titulo} className="flex flex-col items-center rounded-2xl bg-green-50 p-6 text-center shadow-md">
              <div className="mb-4" aria-hidden="true">
                {ICONES[i]}
              </div>
              <h3 className="mb-2 text-lg font-semibold">{passo.titulo}</h3>
              <p className="text-sm text-gray-700">{passo.resumo}</p>
            </li>
          ))}
        </ul>

        <button
          type="button"
          aria-expanded={todas}
          onClick={() => setTodas(!todas)}
          className="mt-12 rounded-full bg-green-600 px-8 py-3 font-semibold text-white transition hover:bg-green-700"
        >
          {todas ? 'Ver menos' : 'Ver mais dicas'}
        </button>
      </div>
    </section>
  );
}
