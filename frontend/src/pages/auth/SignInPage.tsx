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

  // 🧩 Rellenar automáticamente en modo desarrollo
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

      // 🚀 Redirigir según el rol
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
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md relative">

        <h1 className="text-3xl font-extrabold text-center text-primary mb-6">
          Iniciar Sesión
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-left text-gray-600 mb-1">
              Correo institucional
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="profesor@universidad.edu"
              required
            />
          </div>

          <div>
            <label className="block text-left text-gray-600 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-left text-gray-600 mb-1">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="PROFESSOR">Profesor</option>
              <option value="COORDINATOR">Coordinador</option>
            </select>
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className={`w-full mt-4 flex justify-center items-center text-white font-semibold py-2 rounded-lg transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
            }`}
            disabled={loading}
          >
            <LogIn className="mr-2" />
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        {/* 🔹 Enlace a registro */}
        <p className="text-center text-gray-600 mt-6 text-sm">
          ¿No tienes cuenta?{" "}
          <button
            type="button"
            onClick={() => navigate("/auth/signup")}
            className="text-primary font-semibold hover:underline"
          >
            Regístrate aquí
          </button>
        </p>

        {/* Ejemplo rápido en dev */}
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
