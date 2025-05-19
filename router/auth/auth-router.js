import express from "express";
import { register, login, getUser, refreshToken,logout } from "../../controllers/auth/auth-controller.js";
import { verifyToken } from "../../middlewares/verify-token.js";
const router = express.Router();

router.post("/login", login);
router.post("/register", register)
router.get("/getuser", verifyToken, getUser)
router.get("/refreshtoken", refreshToken)
router.post("/logout",verifyToken, logout)



export default router;