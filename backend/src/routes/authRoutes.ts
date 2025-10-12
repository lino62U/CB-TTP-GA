import { Router } from "express";
import { loginUser, registerUser } from "../controllers/authController";

const router = Router();

// 🔹 Login
router.post("/signin", loginUser);

// (Opcional) Registro de usuarios
router.post("/signup", registerUser);

export default router;
