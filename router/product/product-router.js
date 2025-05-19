import express from "express";
import { createProduct, getProductsByUmkmId, updateProduct, deleteProduct, getProductById, getProductsByUmkmIdParam } from "../../controllers/product/product-controller.js";
import { verifyToken } from "../../middlewares/verify-token.js";
import upload from "../../utils/upload-file.js";
const router = express.Router();

router.post("/create",verifyToken, upload.single("image"), createProduct);
router.get("/getby-id-umkm",verifyToken, getProductsByUmkmId)
router.put("/update/:id",verifyToken, updateProduct)
router.get("/getby-id/:id", getProductById)
router.get("/getby-id-umkm-param/:umkm_id", getProductsByUmkmIdParam)
router.delete("/delete/:id",verifyToken, deleteProduct)

export default router;  