import { useState, useEffect } from "react";
import { Apple,
  Smartphone,
  Carrot,
  Droplet,
  CupSoda,
  Utensils,
  Clock,
  Sprout,
  BatteryCharging,
  Sun,
  Moon,
  Heart,
  Leaf,
  Dumbbell,
  ShoppingCart,
  Soup,
  FlaskConical,
  GlassWater,
  Smile, } 
from "lucide-react"; 

const allTips = [
  {
    id: 1,
    icon: <Apple className="w-8 h-8 text-red-500" />,
    title: "Coma mais frutas e verduras",
    description: "Inclua ao menos 5 porções de frutas e vegetais por dia para manter uma boa saúde.",
  },
  {
    id: 2,
    icon: <Droplet className="w-8 h-8 text-blue-500" />,
    title: "Hidrate-se adequadamente",
    description: "Beba pelo menos 2 litros de água por dia para manter seu corpo funcionando bem.",
  },
  {
    id: 3,
    icon: <CupSoda className="w-8 h-8 text-orange-500" />,
    title: "Evite bebidas açucaradas",
    description: "Prefira água ou sucos naturais no lugar de refrigerantes e sucos industrializados.",
  },
  {
    id: 4,
    icon: <Clock className="w-8 h-8 text-indigo-500" />,
    title: "Mantenha horários regulares",
    description: "Comer em horários definidos ajuda a controlar o apetite e manter o metabolismo equilibrado.",
  },
  {
    id: 5,
    icon: <Sprout className="w-8 h-8 text-green-600" />,
    title: "Inclua fibras na dieta",
    description: "Alimentos integrais, frutas e legumes são ótimas fontes de fibras para o bom funcionamento intestinal.",
  },
  {
    id: 6,
    icon: <BatteryCharging className="w-8 h-8 text-yellow-600" />,
    title: "Prefira gorduras boas",
    description: "Aposte em abacate, azeite de oliva, castanhas e peixes para obter gorduras saudáveis.",
  },
  {
    id: 7,
    icon: <Sun className="w-8 h-8 text-yellow-500" />,
    title: "Tome sol diariamente",
    description: "A exposição ao sol ajuda na produção de vitamina D, essencial para a saúde óssea.",
  },
  {
    id: 8,
    icon: <Heart className="w-8 h-8 text-pink-500" />,
    title: "Modere o sal e açúcar",
    description: "Evite alimentos ultra processados e leia os rótulos com atenção.",
  },
  {
    id: 9,
    icon: <Utensils className="w-8 h-8 text-gray-700" />,
    title: "Coma com atenção",
    description: "Evite distrações como celular ou TV enquanto se alimenta, e mastigue devagar.",
  },
  {
    id: 10,
    icon: <FlaskConical className="w-8 h-8 text-blue-600" />,
    title: "Evite alimentos ultraprocessados",
    description: "Dê preferência a alimentos naturais e minimamente processados no dia a dia.",
  },
  {
    id: 11,
    icon: <Dumbbell className="w-8 h-8 text-purple-500" />,
    title: "Combine alimentação com exercícios",
    description: "Uma dieta equilibrada somada à atividade física gera mais saúde e bem-estar.",
  },
  {
    id: 12,
    icon: <ShoppingCart className="w-8 h-8 text-green-800" />,
    title: "Planeje suas compras",
    description: "Monte uma lista de alimentos saudáveis antes de ir ao mercado para evitar escolhas impulsivas.",
  },
  {
    id: 13,
    icon: <Moon className="w-8 h-8 text-indigo-600" />,
    title: "Durma bem",
    description: "O sono de qualidade influencia diretamente nos hormônios da fome e saciedade.",
  },
  {
    id: 14,
    icon: <Smile className="w-8 h-8 text-yellow-400" />,
    title: "Coma com prazer",
    description: "Alimentação saudável também pode (e deve) ser saborosa e prazerosa.",
  },
  {
    id: 15,
    icon: <Soup className="w-8 h-8 text-orange-500" />,
    title: "Inclua sopas nutritivas",
    description: "Sopas com legumes e proteínas magras são ótimas opções para jantares leves.",
  },
   {
    id: 16,
    icon: <Carrot className="w-8 h-8 text-orange-400" />,
    title: "Tenha lanches saudáveis à mão",
    description: "Cenoura, castanhas e frutas secas são ótimas opções para evitar beliscos industrializados.",
  },
  {
    id: 17,
    icon: <Leaf className="w-8 h-8 text-emerald-600" />,
    title: "Reduza o consumo de carne vermelha",
    description: "Intercale com leguminosas e carnes brancas para um equilíbrio melhor.",
  },
  {
    id: 18,
    icon: <GlassWater className="w-8 h-8 text-blue-400" />,
    title: "Comece o dia com água",
    description: "Beber um copo de água ao acordar ajuda a ativar o organismo.",
  },
  {
    id: 19,
    icon: <Smartphone className="w-8 h-8 text-gray-500" />,
    title: "Use apps de nutrição",
    description: "Existem apps que ajudam no controle de calorias e hábitos saudáveis.",
  },
   
];

function shuffleArray(array) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

export default function TipsSection() {
  const [tips, setTips] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const shuffled = shuffleArray(allTips);
    setTips(shuffled);
  }, []);

  const visibleTips = showAll ? tips : tips.slice(0, 3);

  return (
    <section className="bg-white py-16 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-green-800 mb-10">
          Dicas Nutricionais para uma Vida Saudável
        </h2>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTips.map(({ id, icon, title, description }) => (
            <div
              key={id}
              className="bg-green-50 p-6 rounded-2xl shadow-md flex flex-col items-center text-center"
            >
              <div className="mb-4">{icon}</div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-gray-700 text-sm">{description}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-12 px-8 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition"
        >
          {showAll ? "Ver menos" : "Ver mais dicas"}
        </button>
      </div>
    </section>
  );
}