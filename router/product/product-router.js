import express from "express";
import { createProduct, getProductsByUmkmId, updateProduct, deleteProduct, getProductById, getProductsByUmkmIdParam, setProductActiveStatus} from "../../controllers/product/product-controller.js";
import { verifyToken } from "../../middlewares/verify-token.js";
import upload from "../../utils/upload-file.js";
import { checkUserRole } from "../../middlewares/user-role-middleware.js";
import { checkSubscription } from "../../middlewares/langganan-middleware.js";
const router = express.Router();

router.post("/create",verifyToken, checkUserRole(["admin", "owner"]), checkSubscription, upload.single("image"), createProduct);
router.get("/getby-id-umkm",verifyToken, getProductsByUmkmId)
router.put("/update/:id",verifyToken, checkUserRole(["admin", "owner"]), checkSubscription, updateProduct)
router.put("/set-active-status/:id",verifyToken, checkSubscription, setProductActiveStatus)
router.get("/getby-id/:id", getProductById)
router.get("/getby-id-umkm-param/:umkm_id", getProductsByUmkmIdParam)
router.delete("/delete/:id",verifyToken, checkUserRole(["admin", "owner"]), checkSubscription, deleteProduct)

export default router;  