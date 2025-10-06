import express from "express";
import cors from "cors"; // <--- importar cors
import professorRoutes from "./routes/professorRoutes";
import infoRoutes from "./routes/infoRoutes";
import scheduleRoutes from "./routes/schedulerRoutes";

const app = express();
const PORT = process.env.PORT || 3000;

// -----------------------------
// Middleware
// -----------------------------
app.use(cors()); // <--- permite cualquier origen
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

// -----------------------------
// Iniciar servidor
// -----------------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
