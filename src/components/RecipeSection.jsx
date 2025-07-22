import React, { useState, useEffect } from "react";
import axios from "axios";

const API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY;

export default function RecipeSection() {
  const [search, setSearch] = useState("healthy breakfast");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `https://api.spoonacular.com/recipes/complexSearch`,
        {
          params: {
            apiKey: API_KEY,
            query: search,
            number: 12,
            addRecipeInformation: true,
          },
        }
      );
      setRecipes(res.data.results);
    } catch (err) {
      console.error("Erro ao buscar receitas:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRecipes();
  };

  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-green-800 mb-4 text-center">
          Encontre receitas saudáveis
        </h2>

        <p className="text-center text-sm text-gray-600 mb-6">
          * As receitas são exibidas em inglês. Para melhores resultados, pesquise usando termos como <strong>"breakfast"</strong>, <strong>"chicken"</strong>, <strong>"smoothie"</strong> etc.
        </p>

        <form onSubmit={handleSearch} className="mb-8 flex gap-3">
          <input
            type="text"
            placeholder="Ex: breakfast, salad, chicken..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            className="bg-green-600 text-white px-6 rounded-xl hover:bg-green-700 transition"
          >
            Buscar
          </button>
        </form>

        {loading ? (
          <p className="text-center text-gray-500">Carregando receitas...</p>
        ) : recipes.length === 0 ? (
          <p className="text-center text-gray-500">Nenhuma receita encontrada.</p>
        ) : (
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-white shadow-md rounded-2xl overflow-hidden border"
              >
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {recipe.title}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {recipe.readyInMinutes} min •{" "}
                    {recipe.vegetarian ? "Vegetariano" : "Comum"}
                  </p>
                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block text-green-700 font-medium hover:underline"
                  >
                    Ver receita completa →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
