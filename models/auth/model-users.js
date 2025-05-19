import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "owner", "pegawai"], default: "pegawai" },
    email: { type: String, required: true },
    subscribeStart: { type: Date, default: Date.now },
    subscribeEnd: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    refreshToken: { type: String, default: "" },
    umkm_id: { type: mongoose.Schema.Types.ObjectId, ref: "Umkm", required: true },
});

export default mongoose.model("Users", userSchema);
