import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  order_type: {
    type: String,
    enum: ["dine-in", "takeaway"],
    required: true,
  },

  // Hanya diperlukan jika order_type adalah dine-in
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Table",
    required: function () {
      return this.order_type === "dine-in";
    },
  },

  totalWithTax: {
  type: Number,
  required: true,
  },

  umkm_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Umkm",
    required: true,
  },

  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
  },

  totalPPN: { type: Number, default: 0 },

  customer: {
    type: String,
    required: true,
  },

  payment_type: {
    type: String,
    enum: ["cash", "qris"],
    default: null,
  },

  totalAmount: {
    type: Number,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  orderItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderItem",
    },
  ],
});

export default mongoose.model("Order", orderSchema);
