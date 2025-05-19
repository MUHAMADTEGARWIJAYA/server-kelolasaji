import mongoose from "mongoose";

const orderCashierSchema = new mongoose.Schema({
    umkm_id: { type: mongoose.Schema.Types.ObjectId, ref: "Umkm", required: true },
    status: { type: String, enum: ["completed", "cancelled"], default: "completed" },
    customer: { type: String, required: true },
    payment_type:{ type: String, enum:["cash", "qris"], default: "cash" },
    totalAmount: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    orderItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "ItemsOrderCashier" }] 
});

export default mongoose.model("OrderCashier", orderCashierSchema);