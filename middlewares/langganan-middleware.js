
import Umkm from "../models/auth/model-umkm.js";
export const checkSubscription = async (req, res, next) => {
    try {
      const umkmId = req.user.umkm_id; // misalnya diambil dari JWT
  
      const umkm = await Umkm.findById(umkmId);
  
      if (!umkm) {
        return res.status(404).json({ message: "Tenant tidak ditemukan" });
      }
  
      const now = new Date();
      if (now > umkm.subscribeEnd) {
        return res.status(403).json({ message: "Langganan telah berakhir. Silakan perpanjang." });
      }
  
      next(); // lanjut ke route berikutnya
    } catch (err) {
      res.status(500).json({ message: "Terjadi kesalahan pada pengecekan langganan" });
    }
  };
  