import { ArrowRight, Salad } from 'lucide-react';

export default function HomeHero() {
  return (
    <section id="topo" className="bg-gradient-to-br from-green-100 to-white pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto flex flex-col-reverse md:flex-row items-center justify-between gap-12">
        <div className="text-center md:text-left md:max-w-xl">
          <h1 className="text-4xl font-extrabold text-green-800 leading-tight mb-6">
            Sua jornada para uma vida <br className="hidden md:block" />
            <span className="text-green-600">mais saudável</span> começa aqui
          </h1>
          <p className="text-gray-600 text-lg mb-8">
            Busque receitas saudáveis e encontre dicas práticas de alimentação para o dia a dia.
          </p>
          <a
            href="#receitas"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow"
          >
            Explorar receitas <ArrowRight size={20} aria-hidden="true" />
          </a>
        </div>

        <div className="w-full md:w-1/2 flex justify-center" aria-hidden="true">
          <Salad className="w-64 h-64 md:w-80 md:h-80 text-green-600" strokeWidth={1.2} />
        </div>
      </div>
    </section>
  );
}
