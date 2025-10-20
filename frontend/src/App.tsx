// App.tsx
import React from 'react';
import { Route, Routes, HashRouter } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TeacherPage from './pages/TeacherPage';
import CoordinatorPage from './pages/CoordinatorPage';
import { NotificationProvider } from './context/NotificationContext';
import { CourseProvider } from './context/CourseContext';
import NotificationCenter from './components/common/NotificationCenter';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from "./store/authStore";

const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <NotificationProvider>
      <CourseProvider>
        <HashRouter>
          <div className="min-h-screen flex flex-col">
            {isAuthenticated && <Header />}

            <Routes>
              {/* Rutas públicas que manejan su propio layout */}
              <Route path="/" element={<HomePage />} />
              <Route path="/auth/signin" element={<SignInPage />} />
              <Route path="/auth/signup" element={<SignUpPage />} />

              {/* 🔒 Rutas protegidas con contenedor */}
              <Route
                path="/teacher"
                element={
                  <ProtectedRoute>
                    <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
                      <TeacherPage />
                    </main>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coordinator"
                element={
                  <ProtectedRoute>
                    <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
                      <CoordinatorPage />
                    </main>
                  </ProtectedRoute>
                }
              />
            </Routes>

            {isAuthenticated && <Footer />}
          </div>
        </HashRouter>
      </CourseProvider>
      <NotificationCenter />
    </NotificationProvider>
  );
};

export default App;
