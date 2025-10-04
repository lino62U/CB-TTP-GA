
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { Users, UserCog } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full -mt-16">
      <div className="bg-white p-12 rounded-2xl shadow-xl">
        <h1 className="text-5xl font-extrabold text-primary mb-4">
          UniTimetableAI
        </h1>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          Optimización inteligente de horarios académicos. Simplifique la planificación, elimine conflictos y maximice los recursos de su institución con el poder de la IA.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Link to="/teacher">
            <Button size="lg" className="w-64">
              <Users className="mr-2" />
              Portal del Docente
            </Button>
          </Link>
          <Link to="/coordinator">
            <Button size="lg" variant="secondary" className="w-64">
                <UserCog className="mr-2" />
              Panel del Coordinador
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
