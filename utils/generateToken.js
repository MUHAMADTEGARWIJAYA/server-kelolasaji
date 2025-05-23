import jwt from "jsonwebtoken";

const generateAccessToken = (user, umkm_id) =>{
    return jwt.sign({
        id: user._id,
        role: user.role,
        umkm_id: umkm_id
    }, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "1d"});
}

const generateRefreshToken = (user) => {
    return jwt.sign({
        id: user._id,
        role: user.role
    },process.env.REFRESH_TOKEN_SECRET, {expiresIn: "7d"});
}

export {generateAccessToken, generateRefreshToken}