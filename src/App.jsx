import { useState } from 'react'
import './index.css'
import Navbar from './components/Navbar'
import HomeHero from './components/HomeHero';
import RecipeSection from './components/RecipeSection';

function App() {
  

  return (
    <>
      <Navbar/>
      <HomeHero />
      <RecipeSection />
    </>
  )
}

export default App
