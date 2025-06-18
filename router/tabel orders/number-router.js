import express from "express"
import { createTable, getTablesByUmkmId, updateTable, deleteTable,generateTableQR } from "../../controllers/tabel orders/number-controller.js";
import { verifyToken } from "../../middlewares/verify-token.js";
import { checkUserRole } from "../../middlewares/user-role-middleware.js";
import { checkSubscription } from "../../middlewares/langganan-middleware.js";
const router = express.Router()

router.post('/create',verifyToken, checkUserRole(["admin", "owner"]), checkSubscription,createTable)
router.get('/getall',verifyToken, getTablesByUmkmId)
router.put('/update/:tableId',verifyToken, checkUserRole(["admin", "owner"]), checkSubscription, updateTable)
router.delete('/delete/:tableId',verifyToken, checkUserRole(["admin", "owner"]), checkSubscription, deleteTable)
router.get('/generate-qr/:tableId',verifyToken, checkSubscription, generateTableQR)

export default router
