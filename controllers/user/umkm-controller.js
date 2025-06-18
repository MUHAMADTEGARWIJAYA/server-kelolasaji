import Umkm from "../../models/auth/model-umkm.js";

export const createUmkm = async (req, res) => {
    try {
        const {name, slug, address, logo} = req.body;

        if(!name || !slug || !address || !logo){
            return res.status(400).json({message: "All fields are required"});
        }
 
        const umkm = await Umkm.create({
            name,
            slug,
            address,
            logo,
            // subscribeStart: new Date(),
            // subscribeEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        const newUmkm = await umkm.save();

        res.status(201).json({message: "UMKM created successfully", umkm: newUmkm});
    } catch (error) {
        res.status(500).json({message: "Internal server error", error: error.message});
    }
}


export const getUmkm = async (req, res) => {
    try {
        const umkms = await Umkm.find(); // ambil semua data dari collection Umkm

        res.status(200).json({ message: "UMKM fetched successfully", umkms });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export const renewSubscription = async (req, res) => {
    try {
        const { umkmId, months } = req.body;

        if (!umkmId || !months) {
            return res.status(400).json({ message: "umkmId dan jumlah bulan diperlukan" });
        }

        const umkm = await Umkm.findById(umkmId);
        if (!umkm) {
            return res.status(404).json({ message: "UMKM tidak ditemukan" });
        }

        const now = new Date();
        const currentEnd = umkm.subscribeEnd > now ? umkm.subscribeEnd : now;
        const extendedDate = new Date(currentEnd);
        extendedDate.setMonth(extendedDate.getMonth() + Number(months));

        // Memperpanjang langganan
        umkm.subscribeEnd = extendedDate;
        umkm.isActive = true;  // Mengubah status isActive menjadi true ketika diperpanjang

        await umkm.save();

        res.status(200).json({
            message: `Langganan berhasil diperpanjang selama ${months} bulan`,
            subscribeEnd: umkm.subscribeEnd,
            isActive: umkm.isActive,  // Menambahkan status isActive ke response
        });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
};


export const checkSubscription = async (req, res, next) => {
    try {
      const umkmId = req.user.umkm_id; 
  
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
      res.status(500).json({ message: "Terjadi kesalahan pada pengecekan langganan", error: err.message });
    }
  };


  export const deactivateSubscription = async (req, res) => {
    try {
      const { umkmId } = req.body;
  
      if (!umkmId) {
        return res.status(400).json({ message: "umkmId diperlukan" });
      }
  
      const umkm = await Umkm.findById(umkmId);
      if (!umkm) {
        return res.status(404).json({ message: "UMKM tidak ditemukan" });
      }
  
      umkm.isActive = false;
      await umkm.save();
  
      res.status(200).json({ message: "Langganan berhasil dinonaktifkan", umkm });
    } catch (error) {
      res.status(500).json({ message: "Gagal menonaktifkan langganan", error: error.message });
    }
  };
  