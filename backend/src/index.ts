import express from "express";
import cors from "cors"; // <--- importar cors
import professorRoutes from "./routes/professorRoutes";
import infoRoutes from "./routes/infoRoutes";
import scheduleRoutes from "./routes/schedulerRoutes";
import authRoutes from "./routes/authRoutes"; // <--- importar rutas de autenticación
const app = express();
const PORT = process.env.PORT || 3000;

// -----------------------------
// Middleware
// -----------------------------
app.use(
  cors({
    origin: "http://localhost:5173", // ⚠️ URL de tu frontend Vite
    credentials: true, // ✅ permite enviar cookies y encabezados de autorización
  })
);
app.use(express.json());

// -----------------------------
// Rutas
// -----------------------------
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/professors", professorRoutes);
app.use("/info", infoRoutes);
app.use("/schedule", scheduleRoutes);
app.use("/auth", authRoutes); // <--- nueva ruta para autenticación
// -----------------------------
// Iniciar servidor
// -----------------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
