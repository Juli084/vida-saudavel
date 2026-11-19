import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { usePrato } from '../alimentos/prato.ts';
import { usePlano } from '../dados.ts';

export function Navbar() {
  const [aberto, setAberto] = useState(false);
  const noPrato = usePrato().length;
  const naSemana = Object.keys(usePlano()).length;

  // "Meu prato" e "Minha semana" só entram no menu quando têm alguma coisa.
  const links = [
    { href: '#buscar', texto: 'Pesquisar' },
    ...(noPrato ? [{ href: '#prato', texto: `Meu prato (${noPrato})` }] : []),
    ...(naSemana ? [{ href: '#semana', texto: 'Minha semana' }] : []),
    { href: '#dicas', texto: 'Dicas' },
  ];

  return (
    <header className="fixed top-0 left-0 z-50 w-full bg-white shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <a href="#topo" className="text-2xl font-bold text-green-700">
          Vida Saudável
        </a>

        <nav aria-label="Principal" className="hidden space-x-6 font-medium text-gray-600 md:flex">
          {links.map(({ href, texto }) => (
            <a key={href} href={href} className="hover:text-green-600">
              {texto}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="md:hidden"
          aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={aberto}
          aria-controls="menu-celular"
          onClick={() => setAberto(!aberto)}
        >
          {aberto ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
        </button>
      </div>

      {aberto ? (
        <nav id="menu-celular" aria-label="Principal" className="space-y-3 bg-white px-4 pb-4 font-medium text-gray-700 md:hidden">
          {links.map(({ href, texto }) => (
            <a key={href} href={href} className="block" onClick={() => setAberto(false)}>
              {texto}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
