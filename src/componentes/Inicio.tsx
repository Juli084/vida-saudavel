import { ArrowRight, Salad } from 'lucide-react';

export function Inicio() {
  return (
    <section id="topo" className="bg-linear-to-br from-green-100 to-white px-6 pt-32 pb-20">
      <div className="mx-auto flex max-w-6xl flex-col-reverse items-center justify-between gap-12 md:flex-row">
        <div className="text-center md:max-w-xl md:text-left">
          <h1 className="mb-6 text-4xl leading-tight font-extrabold text-green-800">
            Sua jornada para uma vida <br className="hidden md:block" />
            <span className="text-green-600">mais saudável</span> começa aqui
          </h1>
          <p className="mb-8 text-lg text-gray-600">
            Pesquise um alimento ou prato e veja o que ele tem: calorias, proteínas, fibras, vitaminas e minerais pela tabela
            oficial brasileira, e receitas para preparar em casa.
          </p>
          <a
            href="#buscar"
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white shadow transition-all hover:bg-green-700"
          >
            Pesquisar alimentos <ArrowRight size={20} aria-hidden="true" />
          </a>
        </div>

        <div className="flex w-full justify-center md:w-1/2" aria-hidden="true">
          <Salad className="h-64 w-64 text-green-600 md:h-80 md:w-80" strokeWidth={1.2} />
        </div>
      </div>
    </section>
  );
}
