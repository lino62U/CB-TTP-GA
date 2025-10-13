import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import axios from "../../config/axios"
const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const loginStore = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("PROFESSOR");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axios.post("/auth/signup", {
        name,
        email,
        password,
        role,
      });

      if (res.status !== 201) {
        const errorData = res.data;
        throw new Error(errorData.error || "Error al crear la cuenta");
      }

      const data = res.data;
      loginStore.login(data.user, data.token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error en el registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-center text-primary mb-6">
          Crear Cuenta
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-left text-gray-600 mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ej. Juan Pérez"
              required
            />
          </div>

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

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full mt-4 flex justify-center items-center bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition"
            disabled={loading}
          >
            <UserPlus className="mr-2" />
            {loading ? "Registrando..." : "Registrarse"}
          </button>

          <p className="text-sm text-gray-600 text-center mt-4">
            ¿Ya tienes una cuenta?{" "}
            <span
              onClick={() => navigate("/signin")}
              className="text-primary font-semibold cursor-pointer hover:underline"
            >
              Inicia sesión
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUpPage;
