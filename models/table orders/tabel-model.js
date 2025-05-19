import mongoose from "mongoose";

const tableSchema = new mongoose.Schema({
    number: { type: Number, required: true },
    umkm_id: { type: mongoose.Schema.Types.ObjectId, ref: "Umkm", required: true },
    qr_code: { type: String }
}, { timestamps: true });

export default mongoose.model("Table", tableSchema);
