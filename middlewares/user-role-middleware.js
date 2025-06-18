export const checkUserRole = (role) => (req, res, next) => {

    try {
        const rolePremission = req.user.role;

        if (!rolePremission) {
            return res.status(403).json({ message: "Role pada user tidak ada" });
        }
    
        if (!role.includes(rolePremission)) {
            return res.status(403).json({ message: "Akses ditolak. Anda tidak memiliki izin." });
          }
    
        next(); // lanjut ke route berikutnya
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan pada pengecekan role", error: error.message });  
    }


};