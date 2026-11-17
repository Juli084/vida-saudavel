import Navbar from './components/Navbar';
import HomeHero from './components/HomeHero';
import RecipeSection from './components/RecipeSection';
import TipsSection from './components/TipsSection';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <HomeHero />
        <RecipeSection />
        <TipsSection />
      </main>
    </>
  );
}
