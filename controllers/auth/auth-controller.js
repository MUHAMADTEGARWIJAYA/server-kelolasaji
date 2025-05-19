import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Users from "../../models/auth/model-users.js";
import Umkm from "../../models/auth/model-umkm.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/generateToken.js";

export const register = async (req, res) => {

    try {
    const { username, password, role, email, umkm_id } = req.body;
    
    if (!username || !password || !email || !umkm_id) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await Users.findOne({ username });
    if (userExists) {
        return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await Users.create({
        username,
        password : hashedPassword,
        role,
        email,
        umkm_id
    });

    const newUser = await user.save();

    res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
    }

}


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await Users.findOne({ email });
        
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const umkm = await Umkm.findById(user.umkm_id);
        if (!umkm) {
            return res.status(404).json({ message: "UMKM not found" });
        }

        // Pengecekan status langganan
        const now = new Date();
        if (!umkm.isActive || now > new Date(umkm.subscribeEnd)) {
            return res.status(403).json({
                message: "Your subscription has expired. Please renew your subscription."
            });
        }

        // Jika langganan aktif, lanjutkan login
        const accessToken = generateAccessToken(user, umkm._id);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000
        });
        
        res.status(200).json({
            message: "Login successful",
            accessToken,
            refreshToken,
            user: { email: user.email, role: user.role, umkm_id: umkm._id }
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const refreshToken = async (req, res) => {
       try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.status(401).json({ message: "Token tidak diberikan" });

        const user = await Users.findOne({ refreshToken });
        if (!user) return res.status(403).json({ message: "Refresh token tidak valid" });

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                user.refreshToken = "";
                await user.save();
                res.clearCookie("refreshToken", { path: "/" });
                return res.status(403).json({ message: "Token tidak valid" });
            }

            const newAccessToken = generateAccessToken(user);
            res.json({ message: "Token berhasil diperbarui", accessToken: newAccessToken });
        });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.status(401).json({ message: "User tidak login" });

        const user = await Users.findOne({ refreshToken });
        if (!user) return res.status(403).json({ message: "User tidak ditemukan" });

        user.refreshToken = "";
        await user.save();

        res.clearCookie("refreshToken", {
            httpOnly: true,
            sameSite: "None",
        });

        return res.status(200).json({ message: "Logout berhasil" });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
};

export const getUser = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Akses ditolak. Token tidak tersedia." });
        }

          jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
            if (err) return res.status(403).json({ message: "Token tidak valid" });

            const user = await Users.findById(decoded.id);
            if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

            res.json({ email: user.email, umkm_id: user.umkm_id }); 
        });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
}