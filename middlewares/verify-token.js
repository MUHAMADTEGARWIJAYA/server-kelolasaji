import jwt from "jsonwebtoken";
import Users from "../models/auth/model-users.js";


export const verifyToken = async (req, res, next) => {
    try {
        
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Akses ditolak. Token tidak tersedia." });
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await Users.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({ message: "User tidak ditemukan." });
        }

         req.user = {
            id: user._id,
            role: user.role,
            email: user.email,
            umkm_id: user.umkm_id
        };
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token tidak valid atau telah kedaluwarsa.", error: error.message });
    }
};