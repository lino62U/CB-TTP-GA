
import { Route, Routes, HashRouter, Link } from 'react-router-dom'

import './App.css'
import HomePage from './pages/HomePage'
import TeacherPage from './pages/TeacherPage'
import CoordinatorPage from './pages/CoordinatorPage'
import { NotificationProvider } from './context/NotificationContext'
import { CourseProvider } from './context/CourseContext'
import NotificationCenter from './components/common/NotificationCenter'


function App() {
  return (
  
    <NotificationProvider>
    <CourseProvider>
      <HashRouter>
        <div className="min-h-screen flex flex-col">
          <header className="bg-primary shadow-md">
            <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
              <Link to="/" className="text-2xl font-bold text-white">
                UniTimetableAI
              </Link>
              <div className="flex space-x-4">
                <Link to="/" className="text-white hover:text-secondary">Inicio</Link>
                <Link to="/teacher" className="text-white hover:text-secondary">Docente</Link>
                <Link to="/coordinator" className="text-white hover:text-secondary">Coordinador</Link>
              </div>
            </nav>
          </header>
          <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/teacher" element={<TeacherPage />} />
              <Route path="/coordinator" element={<CoordinatorPage />} />
            </Routes>
          </main>
          <footer className="bg-primary text-white text-center p-4 mt-auto">
            © {new Date().getFullYear()} UniTimetableAI. Todos los derechos reservados.
          </footer>
        </div>
      </HashRouter>
    </CourseProvider>
    <NotificationCenter />
  </NotificationProvider>

  );
}

export default App
