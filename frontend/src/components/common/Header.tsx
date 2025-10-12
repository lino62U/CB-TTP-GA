// components/common/Header.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import UserMenu from '../UserMenu';

const Header: React.FC = () => {
  const location = useLocation(); // Obtener la ruta actual

  // Función para verificar si la ruta está activa
  const getLinkClass = (path: string) => {
    return location.pathname === path
      ? 'text-secondary font-semibold' // Estilo para el enlace activo
      : 'text-white'; // Estilo para los enlaces normales
  };

  return (
    <header className="bg-primary shadow-md fixed w-full top-0 left-0 z-50">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo con enlace */}
        <Link to="/" className="text-2xl font-bold text-white">
          UniTimetableAI
        </Link>

        {/* Menú de navegación */}
        <div className="flex space-x-3"> {/* Espacio reducido entre los enlaces */}
          <Link
            to="/"
            className={`py-4 px-6 transition-colors duration-200 ${getLinkClass('/')} hover:bg-red-600 hover:text-white rounded-md`}
          >
            Inicio
          </Link>
          <Link
            to="/teacher"
            className={`py-4 px-6 transition-colors duration-200 ${getLinkClass('/teacher')} hover:bg-red-600 hover:text-white rounded-md`}
          >
            Docente
          </Link>
          <Link
            to="/coordinator"
            className={`py-4 px-6 transition-colors duration-200 ${getLinkClass('/coordinator')} hover:bg-red-600 hover:text-white rounded-md`}
          >
            Coordinador
          </Link>
            <UserMenu />
        </div>
      </nav>
    </header>
  );
};

export default Header;
