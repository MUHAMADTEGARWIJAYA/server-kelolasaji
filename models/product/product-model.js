import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  kategory: {
    type: String,
    enum: ["makanan", "minuman", "lainnya"],
    required: true,
  },
  image: { type: String, required: true },
  umkm_id: { type: mongoose.Schema.Types.ObjectId, ref: "Umkm", required: true },
  createdAt: { type: Date, default: Date.now },

  // Tambahan: Soft delete flag
  isDeleted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
});

export default mongoose.model("Product", productSchema);
