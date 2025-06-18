import express from "express";
import { createOrder, getOrdersByUmkmId, updateOrderStatus, getTodayIncomeTable,getIncomeByDateTable,getOrderTableById, getOrderByDailyForWeek, getOrdersByDate, getOrderByDailyForBiweekly, getOrderByDailyForMonthly , getOrderByDailyForCurrentMonth} from "../../controllers/tabel orders/order-tabel-controller.js";
import { verifyToken } from "../../middlewares/verify-token.js";
import { checkUserRole } from "../../middlewares/user-role-middleware.js";
const router = express.Router();

router.post('/order/:table_id/:umkm_id',     createOrder);
router.get('/filter-getby-date', verifyToken,getOrdersByDate, (req, res) => {
    console.log('Route filter-getby-date berhasil diakses')
    res.send('OK')
  })
  router.get('/getby-biweekly', verifyToken, getOrderByDailyForBiweekly);
router.get('/getby-monthly', verifyToken, getOrderByDailyForMonthly);
router.get('/getby-current-month', verifyToken, getOrderByDailyForCurrentMonth);
router.get('/getby-weekly', verifyToken, getOrderByDailyForWeek);
router.post('/order', verifyToken, createOrder); // untuk user
router.get('/getall/',  verifyToken, getOrdersByUmkmId);
router.put('/update/:order_id',  verifyToken, updateOrderStatus)
router.get('/get-today-income/table', verifyToken, getTodayIncomeTable)
router.get('/get-income-by-date/table', verifyToken, getIncomeByDateTable)
router.get('/getby-id/:id', verifyToken, getOrderTableById)
export default router;