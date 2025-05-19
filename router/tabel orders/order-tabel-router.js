import express from "express";
import { createOrder, getOrdersByUmkmId, updateOrderStatus, getTodayIncomeTable,getIncomeByDateTable,getOrderTableById } from "../../controllers/tabel orders/order-tabel-controller.js";
import { verifyToken } from "../../middlewares/verify-token.js";

const router = express.Router();

router.post('/order/:table_id/:umkm_id', createOrder);
router.get('/getall/', verifyToken, getOrdersByUmkmId);
router.put('/update/:order_id', verifyToken, updateOrderStatus)
router.get('/get-today-income/table', verifyToken, getTodayIncomeTable)
router.get('/get-income-by-date/table', verifyToken, getIncomeByDateTable)
router.get('/getby-id/:id', verifyToken, getOrderTableById)
export default router;