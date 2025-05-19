import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
  umkm_id: { type: mongoose.Schema.Types.ObjectId, ref: "Umkm", required: true },
  status: { type: String, enum: ["pending", "completed", "cancelled"], default: "pending" },
  customer: { type: String, required: true },
  payment_type:{ type: String, enum:["cash", "qris"], default: null },
  totalAmount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  orderItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "OrderItem" }] 
});

export default mongoose.model("Order", orderSchema);
