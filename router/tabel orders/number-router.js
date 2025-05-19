import express from "express"
import { createTable, getTablesByUmkmId, updateTable, deleteTable,generateTableQR } from "../../controllers/tabel orders/number-controller.js";
import { verifyToken } from "../../middlewares/verify-token.js";
const router = express.Router()

router.post('/create',verifyToken, createTable)
router.get('/getall',verifyToken, getTablesByUmkmId)
router.put('/update/:tableId',verifyToken, updateTable)
router.delete('/delete/:tableId',verifyToken, deleteTable)
router.get('/generate-qr/:tableId',verifyToken, generateTableQR)

export default router