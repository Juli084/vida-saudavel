import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const LINKS = [
  { href: '#receitas', texto: 'Receitas' },
  { href: '#dicas', texto: 'Dicas' },
];

export default function Navbar() {
  const [aberto, setAberto] = useState(false);

  return (
    <header className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <a href="#topo" className="text-2xl font-bold text-green-700">
          Vida Saudável
        </a>

        <nav aria-label="Principal" className="hidden md:flex space-x-6 text-gray-600 font-medium">
          {LINKS.map(({ href, texto }) => (
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
          {aberto ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
        </button>
      </div>

      {aberto && (
        <nav id="menu-celular" aria-label="Principal" className="md:hidden bg-white px-4 pb-4 space-y-3 text-gray-700 font-medium">
          {LINKS.map(({ href, texto }) => (
            <a key={href} href={href} className="block" onClick={() => setAberto(false)}>
              {texto}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
