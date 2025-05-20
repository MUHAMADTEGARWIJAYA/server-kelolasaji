import QRCode from 'qrcode';

import Table from "../../models/table orders/tabel-model.js";

export const createTable = async (req, res) => {
  try {
    const { number  } = req.body;
    const umkm_id = req.user.umkm_id;

    if (!number || !umkm_id) {
      return res.status(400).json({ message: "Number dan UMKM ID harus diisi" });
    }

    // Cek kalau meja dengan number dan umkm_id yang sama sudah ada
    const existingTable = await Table.findOne({ number, umkm_id });
    if (existingTable) {
      return res.status(400).json({ message: "Nomor meja ini sudah ada untuk UMKM ini" });
    }

    const table = await Table.create({
      number,
      umkm_id,
    });

    res.status(201).json({ message: "Table berhasil dibuat", table });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal membuat table", error: error.message });
  }
};

export const getTablesByUmkmId = async (req, res) => {

    try {
        const umkmId = req.user.umkm_id;  // Ambil umkm_id dari user yang sudah diverifikasi token  

        if (!umkmId) {
            return res.status(400).json({ message: "UMKM ID tidak ditemukan di token." });
        }

        const tables = await Table.find({ umkm_id: umkmId });

        res.status(200).json({
            message: "Meja berhasil diambil",
            tables
        })
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        })
    }
};

export const updateTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { number } = req.body;
    const umkm_id = req.user.umkm_id;

    if (!number || !tableId) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    // Cek apakah nomor sudah dipakai meja lain
    const duplicate = await Table.findOne({ number, umkm_id, _id: { $ne: tableId } });
    if (duplicate) {
      return res.status(400).json({ message: "Nomor meja ini sudah digunakan" });
    }

    const table = await Table.findOneAndUpdate(
      { _id: tableId, umkm_id },
      { number },
      { new: true }
    );

    if (!table) {
      return res.status(404).json({ message: "Meja tidak ditemukan" });
    }

    res.status(200).json({ message: "Meja berhasil diperbarui", table });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui meja", error: error.message });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const umkm_id = req.user.umkm_id;

    const deleted = await Table.findOneAndDelete({ _id: tableId, umkm_id });

    if (!deleted) {
      return res.status(404).json({ message: "Meja tidak ditemukan" });
    }

    res.status(200).json({ message: "Meja berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus meja", error: error.message });
  }
};

// controllers/tableController.js


export const generateTableQR = async (req, res) => {
  try {
    const { tableId } = req.params;
    const umkm_id = req.user.umkm_id;

    // Cek apakah meja ada dan dimiliki oleh UMKM yang sedang login
    const table = await Table.findOne({ _id: tableId, umkm_id });
    if (!table) {
      return res.status(404).json({ message: "Meja tidak ditemukan untuk UMKM ini" });
    }

    const url = `https://client-kelolasaji.vercel.app/${tableId}/${umkm_id}/menu`;
    const qrCodeImage = await QRCode.toDataURL(url);

    res.status(200).json({
      message: "QR Code berhasil dibuat",
      url,
      qrCodeImage, // base64 image string
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal membuat QR Code", error: error.message });
  }
};
