import mongoose from "mongoose";

const itemsOrderCashierSchema = new mongoose.Schema({
    orderCashier: { type: mongoose.Schema.Types.ObjectId, ref: "OrderCashier", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true },
});

export default mongoose.model("ItemsOrderCashier", itemsOrderCashierSchema);