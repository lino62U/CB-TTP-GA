import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { Users, UserCog } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
      {/* Fondo con imagen difuminada y filtro oscuro */}
      <div
        className="absolute inset-0 bg-cover bg-center brightness-50 blur-sm"
        style={{
          backgroundImage:
            "url('https://www.unsa.edu.pe/wp-content/uploads/2022/02/FACHADA-UNSA3-878x426.jpg')",
        }}
      />

      {/* Capa oscura adicional para mayor contraste */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Contenido principal */}
      <div className="relative z-10 text-center text-gray-800 px-10 py-14 bg-white rounded-3xl shadow-2xl max-w-3xl w-11/12 sm:w-3/4">
        <h1 className="text-6xl font-extrabold mb-6 text-red-600 drop-shadow-md">
          UniTimetableAI
        </h1>
        <p className="text-xl text-gray-600 mb-12 leading-relaxed font-medium">
          Optimización inteligente de horarios académicos.<br />
          Simplifique la planificación, elimine conflictos y maximice los recursos de su institución con el poder de la IA.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-8">
          <Link to="/teacher">
            <Button
              size="lg"
              className="w-64 h-14 bg-red-600 hover:bg-red-100 text-white text-lg font-semibold rounded-xl transition-all"
            >
              <Users className="mr-2 w-6 h-6" />
              Portal del Docente
            </Button>
          </Link>
          <Link to="/coordinator">
            <Button
              size="lg"
              variant="secondary"
              className="w-64 h-14 bg-gray-100 text-gray-900 hover:bg-gray-200 text-lg font-semibold rounded-xl transition-all"
            >
              <UserCog className="mr-2 w-6 h-6" />
              Panel del Coordinador
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
