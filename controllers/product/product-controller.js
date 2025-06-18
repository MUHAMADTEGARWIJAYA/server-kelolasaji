import Product from "../../models/product/product-model.js";
import { uploadToCloudinary } from "../../utils/cloudinary-file.js";
export const createProduct = async (req, res) => {
    try {
        const { name, description, price, kategory, } = req.body;

        const imageUpload = await uploadToCloudinary(req.file.buffer);      
        const umkm_id = req.user.umkm_id; 

        const product = await Product.create({
            name,
            description,
            price,
            kategory,
            image: imageUpload.secure_url,
            umkm_id: umkm_id
        });

        res.status(201).json({ message: "Produk berhasil dibuat.", product });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan server.", error: error.message });
    }
};

export const getProductsByUmkmId = async (req, res) => {
    try {
        const umkmId = req.user.umkm_id;  // Ambil umkm_id dari user yang sudah diverifikasi token

        if (!umkmId) {
            return res.status(400).json({ message: "UMKM ID tidak ditemukan di token." });
        }

        const products = await Product.find({ umkm_id: umkmId,  isDeleted: { $ne: true } });

        res.status(200).json({ 
            message: "Produk berhasil diambil", 
            products 
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
}



export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params; // id produk
        const umkmId = req.user.umkm_id;
        const updateData = req.body;

        const product = await Product.findOne({ _id: id, umkm_id: umkmId });

        if (!product) {
            return res.status(404).json({ message: "Produk tidak ditemukan atau bukan milik Anda." });
        }

        Object.assign(product, updateData); // update fields
        const updatedProduct = await product.save();

        res.status(200).json({ message: "Produk berhasil diupdate", product: updatedProduct });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
      const { id } = req.params;
      const umkmId = req.user.umkm_id;
  
      // Cari dan update isDeleted jadi true
      const product = await Product.findOneAndUpdate(
        { _id: id, umkm_id: umkmId },
        { isDeleted: true },
        { new: true } // supaya kita bisa lihat hasil setelah update
      );
  
      if (!product) {
        return res.status(404).json({ message: "Produk tidak ditemukan atau bukan milik Anda." });
      }
  
      res.status(200).json({ message: "Produk berhasil dihapus (soft delete)", product });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  };
  

// Ambil semua produk berdasarkan umkm_id dari params
export const getProductsByUmkmIdParam = async (req, res) => {
    try {
        const { umkm_id, } = req.params;

        const products = await Product.find({ umkm_id, isDeleted: { $ne: true }  });

        if (products.length === 0) {
            return res.status(404).json({ message: "Tidak ada produk untuk UMKM ini." });
        }

        res.status(200).json({ 
            message: "Produk berhasil diambil berdasarkan UMKM ID", 
            products 
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
};

// Ambil satu produk berdasarkan id produk
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: "Produk tidak ditemukan." });
        }

        res.status(200).json({ 
            message: "Produk berhasil diambil", 
            product 
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
};

export const setProductActiveStatus = async (req, res) => {
    try {
        const { id } = req.params; // ID produk
        const { isActive } = req.body; // Status baru
        const umkmId = req.user.umkm_id; // Ambil umkm_id dari user login

        // Validasi input
        if (typeof isActive !== "boolean") {
            return res.status(400).json({ message: "Status isActive harus berupa boolean (true/false)." });
        }

        // Temukan produk dan update isActive
        const product = await Product.findOneAndUpdate(
            { _id: id, umkm_id: umkmId },
            { isActive },
            { new: true } // Return data terbaru setelah update
        );

        if (!product) {
            return res.status(404).json({ message: "Produk tidak ditemukan atau bukan milik Anda." });
        }

        res.status(200).json({
            message: `Status produk berhasil diubah menjadi ${isActive ? "aktif" : "tidak aktif"}.`,
            product
        });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan server.", error: error.message });
    }
};
