import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <header className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
            <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-green-700">NutriApp</h1>

                {/* Desktop links */}
                <nav className="hidden md:flex space-x-6 text-gray-600 font-medium">
                    <a href="#" className="hover:text-green-600">Receitas</a>
                    <a href="#" className="hover:text-green-600">Benefícios</a>
                    <a href="#" className="hover:text-green-600">Sobre</a>
                    <a href="#" className="hover:text-green-600">Contato</a>
                    <button className="ml-4 px-3 py-1 border rounded text-sm hover:bg-green-100">EN</button>
                </nav>

                {/* Mobile Menu Button*/}
                <button className="md:hidden" onClick={( )=> setIsOpen(!isOpen)}>
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white px-4 pb-4 space-y-3 text-gray-700 font-medium">
                    <a href="#" className="block">Receitas</a>
                    <a href="#" className="block">Benefícios</a>
                    <a href="#" className="block">Sobre</a>
                    <a href="#" className="block">Contato</a>
                    <button className="mt-2 px-3 py-1 border rounded text-sm hover:bg-green-100">EN</button>
            </div>
            )}
        </header>
    )
}