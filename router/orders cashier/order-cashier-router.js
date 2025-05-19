import express from "express";
import { createOrderCashier, updateOrderCashierStatus, getOrdersCashierByUmkm, getTodayIncome, getOrderCashierById, getIncomeByDate } from "../../controllers/orders cashier/orders-cashier-controller.js";
import { verifyToken } from "../../middlewares/verify-token.js";

const router = express.Router();

router.post("/create", verifyToken, createOrderCashier);
router.put("/update/:order_id", verifyToken, updateOrderCashierStatus);
router.get("/getall", verifyToken, getOrdersCashierByUmkm);
router.get("/get-today-income", verifyToken, getTodayIncome);
router.get("/get-income-by-date", verifyToken, getIncomeByDate);
router.get("/getby-id/:id", verifyToken, getOrderCashierById);

export default router;