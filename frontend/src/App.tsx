// App.tsx
import React from 'react';
import { Route, Routes, HashRouter } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TeacherPage from './pages/TeacherPage';
import CoordinatorPage from './pages/CoordinatorPage';
import { NotificationProvider } from './context/NotificationContext';
import { CourseProvider } from './context/CourseContext';
import NotificationCenter from './components/common/NotificationCenter';
import Header from './components/common/Header';  // Importar el Header
import Footer from './components/common/Footer';  // Importar el Footer

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <CourseProvider>
        <HashRouter>
          <div className="min-h-screen flex flex-col">
            {/* Usar el Header aquí */}
            <Header />

            <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/teacher" element={<TeacherPage />} />
                <Route path="/coordinator" element={<CoordinatorPage />} />
              </Routes>
            </main>

            {/* Usar el Footer aquí */}
            <Footer />
          </div>
        </HashRouter>
      </CourseProvider>
      <NotificationCenter />
    </NotificationProvider>
  );
};

export default App;
