import express from "express";
import { createOrderCashier, updateOrderCashierStatus, getOrdersCashierByUmkm, getTodayIncome, getOrderCashierById, getIncomeByDate, getOrderCashierByWeekly } from "../../controllers/orders cashier/orders-cashier-controller.js";
import { verifyToken } from "../../middlewares/verify-token.js";
import { checkUserRole } from "../../middlewares/user-role-middleware.js";
import { checkSubscription } from "../../middlewares/langganan-middleware.js";
const router = express.Router();

router.post("/create", verifyToken, checkSubscription, createOrderCashier);
router.get("/getby-weekly", verifyToken, getOrderCashierByWeekly);
router.put("/update/:order_id", verifyToken,  checkSubscription, updateOrderCashierStatus);
router.get("/getall", verifyToken, getOrdersCashierByUmkm);
router.get("/get-today-income", verifyToken, getTodayIncome);
router.get("/get-income-by-date", verifyToken, getIncomeByDate);
router.get("/getby-id/:id", verifyToken, getOrderCashierById);

export default router;