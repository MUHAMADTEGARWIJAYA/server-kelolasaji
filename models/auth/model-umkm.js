import mongoose from "mongoose";

const umkmSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    logo: { type: String, required: true },
    subscribeStart: { type: Date, default: Date.now },
    subscribeEnd: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    theme: {
    primaryColor: { type: String, default: "#000000" },
    secondaryColor: { type: String, default: "#ffffff" },
    textColor: { type: String, default: "#000000" },
    backgroundColor: { type: String, default: "#ffffff" },
    font: { type: String, default: "Arial" },
    }
});

export default mongoose.model("Umkm", umkmSchema);