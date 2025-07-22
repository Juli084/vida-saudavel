import { useState } from 'react'
import './index.css'
import Navbar from './components/Navbar'
import HomeHero from './components/HomeHero';
import RecipeSection from './components/RecipeSection';
import TipsSection from './components/TipsSection';

function App() {
  

  return (
    <>
      <Navbar/>
      <HomeHero />
      <RecipeSection />
      <TipsSection />
    </>
  )
}

export default App
