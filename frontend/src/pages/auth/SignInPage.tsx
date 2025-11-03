import React, { useState, useEffect } from "react";
import { LogIn } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import axios from "../../config/axios";

const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const loginStore = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("PROFESSOR");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (import.meta.env.MODE === "development") {
      setEmail("juan@unsa.edu.pe");
      setPassword("123456");
      setRole("PROFESSOR");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axios.post("/auth/signin", { email, password, role });
      if (res.status !== 200) throw new Error("Credenciales incorrectas");
      const data = res.data;
      loginStore.login(data.user, data.token);
      if (role === "COORDINATOR") navigate("/coordinator");
      else navigate("/teacher");
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Error al iniciar sesión"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
      {/* Fondo con imagen institucional y overlay vino tinto */}
      <div
        className="absolute inset-0 bg-cover bg-center brightness-75 blur-sm"
        style={{
          backgroundImage:
            "url('https://www.unsa.edu.pe/wp-content/uploads/2022/02/FACHADA-UNSA3-878x426.jpg')",
        }}
      />
      <div className="absolute inset-0 bg-black/70" />

      {/* Contenedor del formulario */}
      <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-10 w-full max-w-md text-center border border-gray-200">
        <h1 className="text-4xl font-extrabold text-[#7b1d26] mb-6">
          Iniciar Sesión
        </h1>
        <p className="text-gray-600 mb-8 text-base">
          Bienvenido a <span className="font-semibold text-[#5a0b15]">UniTimetableAI</span>.  
          Inicie sesión para continuar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Correo institucional
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7b1d26]"
              placeholder="profesor@unsa.edu.pe"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7b1d26]"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7b1d26]"
            >
              <option value="PROFESSOR">Profesor</option>
              <option value="COORDINATOR">Coordinador</option>
            </select>
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center font-medium mt-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            className={`w-full mt-6 flex justify-center items-center text-white font-semibold py-3 rounded-lg transition-all duration-300 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#7b1d26] hover:bg-[#5a0b15] hover:scale-105 shadow-md"
            }`}
            disabled={loading}
          >
            <LogIn className="mr-2" />
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        {/* Enlace al registro */}
        <p className="text-center text-gray-600 mt-6 text-sm">
          ¿No tienes cuenta?{" "}
          <button
            type="button"
            onClick={() => navigate("/auth/signup")}
            className="text-[#7b1d26] font-semibold hover:underline"
          >
            Regístrate aquí
          </button>
        </p>

        {/* Demo en modo desarrollo */}
        {import.meta.env.MODE === "development" && (
          <div className="mt-6 text-xs text-gray-500 text-center">
            <p>
              <strong>Demo:</strong> juan@unsa.edu.pe / 123456 / PROFESOR
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignInPage;
